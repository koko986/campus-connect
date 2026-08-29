/**
 * Resolves a free-licensed campus photograph for each university from Wikimedia
 * Commons and records it with the attribution that CC BY and CC BY-SA require.
 *
 * Run:
 *   node --use-system-ca scripts/import-university-photos.ts \
 *     --input universities.json --out photos.sql
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node --use-system-ca scripts/import-university-photos.ts \
 *     --input universities.json --apply
 *
 * `--input` is a JSON array of `{ slug, name, city }`, exported from the
 * `universities` table. Without `--apply` the script performs no database or
 * storage writes and emits SQL for review. `--apply` is the explicit one-time
 * import path: it downloads a 1600 px Commons derivative, uploads it to the
 * `university-media` bucket, then stores the bucket-relative path and complete
 * attribution on the university row.
 *
 * `--use-system-ca` is needed behind a TLS-intercepting proxy; drop it
 * elsewhere.
 *
 * Only a minority of Myanmar institutions have any free-licensed photograph, so
 * a miss is the expected outcome rather than an error. Universities without one
 * are left untouched and keep rendering their short-name badge.
 *
 * Two deliberate exclusions:
 *   - `prop=pageimages` is not used. For these articles it returns the
 *     institutional seal, which English Wikipedia hosts locally under a
 *     non-free fair-use claim. Reusing that on TAKKA would not be permitted.
 *   - Anything not served from `/wikipedia/commons/` is rejected for the same
 *     reason, as is any licence outside the allow-list below.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

// Wikimedia's API etiquette requires an identifying agent and serial requests.
// Anonymous clients that ignore this get throttled, and a throttled response is
// indistinguishable from "no photo exists" unless it is handled explicitly.
const USER_AGENT =
  "TAKKA-university-directory/1.0 (https://github.com/takka/campus-connect) node-fetch";
const REQUEST_SPACING_MS = 350;

const FREE_LICENCES = [
  /^cc[ -]?by(-sa)?([ -]?\d(\.\d)?)?$/i,
  /^cc[ -]?zero$/i,
  /^cc0$/i,
  /^public domain$/i,
  /^pd(-.*)?$/i,
  /^attribution$/i,
];

/** Filenames that are technically free but make poor cover images. */
const REJECT_FILENAME =
  /(seal|logo|coat.of.arms|crest|map|diagram|lageplan|protest|riot|ribbon|portrait|banner|signature|chart|graph|railway|station|\bvc\b|statement|speech|interview|ceremony|meeting|delegation|conference|workshop|seminar|group of|wheelchair|education college|\.svg$|\.pdf$|\.tif+$)/i;

/** Filenames that read like the front of a campus. */
const PREFER_FILENAME =
  /(campus|main.?(building|hall|gate)|entrance|gate|convocation|administration|library|front|aerial|building|hall|university|college)/i;

/**
 * Myanmar puts several unrelated institutions in the same town -- Magway alone
 * has a university, a technological university, a computer studies university
 * and a medical university. A place name therefore identifies a town, not a
 * campus, and matching on it alone hands every institution its neighbour's
 * photograph.
 *
 * Each entry detects a specialisation in a name. A candidate is rejected when
 * its filename claims a specialisation the university does not have, which is
 * what stops "Technological University, Magway" from adopting a picture of the
 * computer studies campus down the road.
 *
 * `technological` deliberately matches "Technological" and not "Technology", so
 * that "University of Medical Technology" is not read as an engineering school.
 */
const SPECIALISATIONS: RegExp[] = [
  /computer|\bucs?\b/i,
  /technological|polytechnic|\btu\b/i,
  /education/i,
  /medicine|medical|med school/i,
  /dental/i,
  /nursing/i,
  /pharmac/i,
  /economic/i,
  /agricultur/i,
  /veterinar/i,
  /forestry/i,
  /arts and culture/i,
  /foreign language/i,
  /distance/i,
  /maritime/i,
  /buddhist|pariyatti|sasana|theolog/i,
  /defence|defense|\bdsa\b|\bdsta\b|\bdsma\b/i,
  /aerospace/i,
  /co-?operative/i,
  /public health|community health/i,
  /paramedical/i,
];

function specialisations(text: string) {
  return new Set(SPECIALISATIONS.filter((pattern) => pattern.test(text)).map(String));
}

type Candidate = {
  file: string;
  url: string;
  licence: string;
  artist: string;
  descriptionUrl: string;
  width: number;
  score: number;
};

type Resolved = {
  slug: string;
  name: string;
  candidate: Candidate;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wikimedia throttles anonymous clients, and a throttled response must not be
 * mistaken for "this university has no photo". Requests are therefore serial,
 * spaced, and retried on the statuses that mean "slow down".
 */
async function api(endpoint: string, params: Record<string, string>) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
    if (response.ok) {
      await sleep(REQUEST_SPACING_MS);
      return response.json();
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt,
    );
  }
  throw new Error("throttled after 5 attempts");
}

/** Commons artist fields are HTML fragments; the UI needs plain text. */
function plainText(html: string | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFree(licence: string) {
  const value = licence.trim();
  return FREE_LICENCES.some((pattern) => pattern.test(value));
}

function scoreFile(file: string, width: number) {
  let score = 0;
  if (PREFER_FILENAME.test(file)) score += 10;
  // Landscape, reasonably large files crop well into a 16:9 banner.
  if (width >= 1200) score += 4;
  else if (width >= 800) score += 2;
  return score;
}

/**
 * Turns raw imageinfo rows into vetted candidates. `Special:FilePath` is used
 * for the stored URL because it serves a resized derivative and survives the
 * file being moved to a new name on Commons.
 */
function toCandidates(pages: unknown[]): Candidate[] {
  const candidates: Candidate[] = [];
  for (const page of pages as {
    title?: string;
    imageinfo?: {
      url?: string;
      mime?: string;
      width?: number;
      descriptionurl?: string;
      extmetadata?: Record<string, { value?: string }>;
    }[];
  }[]) {
    const info = page.imageinfo?.[0];
    const title = page.title;
    if (!info?.url || !title) continue;
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime ?? "")) continue;
    // Local English Wikipedia uploads are fair-use, not free.
    if (!info.url.includes("/wikipedia/commons/")) continue;

    const licence = plainText(info.extmetadata?.LicenseShortName?.value);
    if (!isFree(licence)) continue;

    const file = title.replace(/^File:/, "");
    if (REJECT_FILENAME.test(file)) continue;

    const width = info.width ?? 0;
    candidates.push({
      file,
      url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`,
      licence,
      artist: plainText(info.extmetadata?.Artist?.value) || "Unknown author",
      descriptionUrl:
        info.descriptionurl ??
        `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
      width,
      score: scoreFile(file, width),
    });
  }
  return candidates;
}

async function imageInfoFor(titles: string[]): Promise<Candidate[]> {
  if (!titles.length) return [];
  const data = await api(COMMONS_API, {
    action: "query",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
  });
  return toCandidates(data?.query?.pages ?? []);
}

/** The image Wikidata curates for the institution, which is usually the best one. */
async function fromWikidata(name: string): Promise<Candidate[]> {
  const page = await api(WIKIPEDIA_API, {
    action: "query",
    titles: name,
    prop: "pageprops",
    redirects: "1",
  });
  const entity = page?.query?.pages?.[0]?.pageprops?.wikibase_item;
  if (!entity) return [];

  const claims = await api(WIKIDATA_API, {
    action: "wbgetclaims",
    entity,
    property: "P18",
  });
  const file = claims?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (typeof file !== "string") return [];
  return imageInfoFor([`File:${file}`]);
}

/** Everything filed under the institution's Commons category. */
async function fromCommonsCategory(category: string): Promise<Candidate[]> {
  const data = await api(COMMONS_API, {
    action: "query",
    generator: "categorymembers",
    gcmtitle: `Category:${category}`,
    gcmtype: "file",
    gcmlimit: "30",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
  });
  return toCandidates(data?.query?.pages ?? []);
}

/** One level of the category tree, used only when the institution category has no files itself. */
async function fromCommonsCategoryTree(category: string): Promise<Candidate[]> {
  const direct = await fromCommonsCategory(category);
  if (direct.length) return direct;

  const data = await api(COMMONS_API, {
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmtype: "subcat",
    cmlimit: "5",
  });
  const subcategories = (data?.query?.categorymembers ?? []) as { title?: string }[];
  const nested: Candidate[] = [];
  for (const subcategory of subcategories) {
    if (!subcategory.title) continue;
    nested.push(...(await fromCommonsCategory(subcategory.title.replace(/^Category:/, ""))));
  }
  return nested;
}

/** Last resort: Commons full-text file search. */
async function fromCommonsSearch(name: string): Promise<Candidate[]> {
  const data = await api(COMMONS_API, {
    action: "query",
    generator: "search",
    gsrsearch: `${name} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
  });
  const candidates = toCandidates(data?.query?.pages ?? []);
  // Search is fuzzy, so require the institution's distinguishing word to appear
  // in the filename before trusting the match.
  const keyword = distinguishingWord(name);
  return keyword
    ? candidates.filter((candidate) => candidate.file.toLowerCase().includes(keyword))
    : [];
}

const GENERIC_WORDS = new Set([
  "university",
  "universities",
  "of",
  "the",
  "and",
  "college",
  "institute",
  "studies",
  "computer",
  "technological",
  "technology",
  "national",
  "state",
  "public",
  "science",
  "sciences",
  "medicine",
  "medical",
  "education",
  "myanmar",
]);

/** The place or subject name that makes an institution identifiable. */
function distinguishingWord(name: string) {
  const words = name
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !GENERIC_WORDS.has(word));
  return words[0] ?? null;
}

/** Commons categories rarely match our exact naming, so try the usual shapes. */
function categoryVariants(name: string) {
  const variants = new Set<string>([name]);
  const swapped = name.match(/^University of (.+)$/);
  if (swapped) variants.add(`${swapped[1]} University`);
  const reverse = name.match(/^(.+) University$/);
  if (reverse) variants.add(`University of ${reverse[1]}`);
  // "Technological University, Magway" is filed as "Technological University (Magway)".
  const comma = name.match(/^(.+), (.+)$/);
  if (comma) {
    variants.add(`${comma[1]} (${comma[2]})`);
    variants.add(`${comma[2]} ${comma[1]}`);
  }
  return [...variants];
}

/**
 * An attempt is `strict` when its source can return images of a different
 * institution. A category named after the university itself is trustworthy; a
 * city-wide category or a full-text search is not, and there the filename must
 * actually mention this institution. Without that distinction, every university
 * in Yangon inherits the same photograph.
 */
type Attempt = { strict: boolean; run: () => Promise<Candidate[]> };

/**
 * A candidate must not claim a specialisation the university lacks. Applied to
 * every source, including a category named after the university, because those
 * categories routinely also hold photographs of nearby institutions.
 */
function consistentInstitution(universityName: string, file: string) {
  const own = specialisations(universityName);
  for (const claimed of specialisations(file)) {
    if (!own.has(claimed)) return false;
  }
  return true;
}

/**
 * Stricter form for sources that can return any file in the country: the
 * filename must describe exactly the same specialisations, not merely
 * compatible ones. Yangon has a dental school, a paramedical school and a
 * medical technology school within a few streets, and all three share the word
 * "medical", so overlap alone is not evidence.
 */
function sameInstitutionType(universityName: string, file: string) {
  const own = specialisations(universityName);
  const claimed = specialisations(file);
  return own.size === claimed.size && [...own].every((entry) => claimed.has(entry));
}

async function resolve(university: { slug: string; name: string; city: string }, errors: string[]) {
  const [exact, ...otherNames] = categoryVariants(university.name);
  // Ordered by yield per request. The exact category costs one call and matches
  // most often; Wikidata costs two, so it comes after.
  const attempts: Attempt[] = [
    { strict: false, run: () => fromCommonsCategoryTree(exact!) },
    { strict: false, run: () => fromWikidata(university.name) },
    ...otherNames.map((variant) => ({
      strict: false,
      run: () => fromCommonsCategoryTree(variant),
    })),
    {
      strict: true,
      run: () => fromCommonsCategory(`Universities and colleges in ${university.city}`),
    },
    { strict: true, run: () => fromCommonsSearch(university.name) },
  ];

  const city = university.city.toLowerCase();
  for (const attempt of attempts) {
    let candidates: Candidate[];
    try {
      candidates = await attempt.run();
    } catch (error) {
      errors.push(`${university.name}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    candidates = candidates.filter((candidate) =>
      consistentInstitution(university.name, candidate.file),
    );

    // A city-wide category or a full-text search can return anything at all, so
    // there the filename must both name the town and read like a building.
    if (attempt.strict) {
      candidates = candidates.filter(
        (candidate) =>
          candidate.file.toLowerCase().includes(city) &&
          PREFER_FILENAME.test(candidate.file) &&
          sameInstitutionType(university.name, candidate.file),
      );
    }
    if (!candidates.length) continue;

    const best = candidates.sort((a, b) => b.score - a.score || b.width - a.width)[0];
    if (best) return best;
  }
  return null;
}

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildSql(resolved: Resolved[]) {
  const rows = resolved
    .map(
      ({ slug, candidate }) =>
        `    (${sqlString(slug)}, ${sqlString(candidate.url)}, ` +
        `${sqlString(`${candidate.artist}, ${candidate.licence}, via Wikimedia Commons`)}, ` +
        `${sqlString(candidate.descriptionUrl)}, ${sqlString(candidate.licence)})`,
    )
    .join(",\n");

  return `-- ---------------------------------------------------------------------------
-- University cover images
--
-- Generated by scripts/import-university-photos.ts from Wikimedia Commons.
-- Regenerate rather than hand-editing: the credit and licence strings have to
-- keep matching the file they describe, because CC BY and CC BY-SA require
-- naming the author and licence wherever the photograph is shown.
--
-- Universities absent from this list have no free-licensed photograph on
-- Commons and intentionally keep their short-name badge.
-- ---------------------------------------------------------------------------

with photo(slug, url, credit, source_url, licence) as (
  values
${rows}
)
update public.universities u
set cover_image_path = photo.url,
    cover_image_credit = photo.credit,
    cover_image_source_url = photo.source_url,
    cover_image_license = photo.licence,
    updated_at = now()
from photo
where u.slug = photo.slug
  and u.cover_image_path is null;
`;
}

function imageExtension(contentType: string) {
  if (contentType.startsWith("image/png")) return "png";
  if (contentType.startsWith("image/webp")) return "webp";
  if (contentType.startsWith("image/jpeg")) return "jpg";
  throw new Error(`Unsupported Commons response type: ${contentType || "unknown"}`);
}

async function applyResolved(resolved: Resolved[]) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("--apply requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { slug, candidate } of resolved) {
    const response = await fetch(candidate.url, { headers: { "user-agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`Could not download ${candidate.file}: ${response.status}`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    const extension = imageExtension(contentType);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) {
      throw new Error(`${candidate.file} exceeds the university-media 5 MB limit.`);
    }

    const imagePath = `covers/${slug}.${extension}`;
    const upload = await supabase.storage.from("university-media").upload(imagePath, bytes, {
      contentType,
      upsert: true,
    });
    if (upload.error) throw new Error(`Upload failed for ${slug}: ${upload.error.message}`);

    const update = await supabase
      .from("universities")
      .update({
        cover_image_path: imagePath,
        cover_image_credit: `${candidate.artist}, ${candidate.licence}, via Wikimedia Commons`,
        cover_image_source_url: candidate.descriptionUrl,
        cover_image_license: candidate.licence,
      })
      .eq("slug", slug)
      .select("id")
      .single();
    if (update.error) {
      await supabase.storage.from("university-media").remove([imagePath]);
      throw new Error(`Database update failed for ${slug}: ${update.error.message}`);
    }

    console.log(`  stored ${slug} -> ${imagePath}`);
  }
}

function flag(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? null) : null;
}

async function main() {
  const args = process.argv.slice(2);
  const inputFile = flag(args, "--input");
  const outFile = flag(args, "--out");
  const apply = args.includes("--apply");
  if (!inputFile) {
    throw new Error("Pass --input <file.json> containing [{ slug, name, city }].");
  }

  const universities = JSON.parse(readFileSync(inputFile, "utf8").replace(/^\uFEFF/, "")) as {
    slug: string;
    name: string;
    city: string;
  }[];

  console.log(`resolving photos for ${universities.length} universities`);

  const resolved: Resolved[] = [];
  const errors: string[] = [];
  for (const university of universities) {
    const candidate = await resolve(university, errors);
    if (candidate) {
      resolved.push({ slug: university.slug, name: university.name, candidate });
      console.log(`  hit  ${university.name} -> ${candidate.file} (${candidate.licence})`);
    }
  }

  console.log(`\n${resolved.length} of ${universities.length} matched a free-licensed photo`);
  // Surfaced rather than swallowed: a throttled request looks exactly like a
  // university with no photograph, and silently conflating the two would make
  // the import quietly incomplete.
  if (errors.length) {
    console.log(`${errors.length} lookups failed:`);
    for (const error of errors.slice(0, 20)) console.log(`  ${error}`);
  }
  if (!resolved.length) return;

  if (apply) {
    await applyResolved(resolved);
    return;
  }

  const sql = buildSql(resolved);
  if (outFile) {
    writeFileSync(outFile, sql, "utf8");
    console.log(`wrote ${outFile}`);
  } else {
    console.log(sql);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
