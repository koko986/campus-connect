/**
 * Parity check for the two React translation catalogs, the counterpart to
 * ConsoleMessageBundleTest on the Java side. TypeScript already fails the build when a key is
 * missing from my.json; this catches the cases the type system cannot see: a leftover key, a blank
 * translation, or a placeholder that was dropped in translation.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const en = JSON.parse(readFileSync(join(root, "src/locales/en.json"), "utf8"));
const my = JSON.parse(readFileSync(join(root, "src/locales/my.json"), "utf8"));

const problems = [];

for (const key of Object.keys(en)) {
  if (!(key in my)) problems.push(`my.json is missing ${key}`);
}
for (const key of Object.keys(my)) {
  if (!(key in en)) problems.push(`my.json has an extra key ${key}`);
}
for (const [name, catalog] of [
  ["en.json", en],
  ["my.json", my],
]) {
  for (const [key, value] of Object.entries(catalog)) {
    if (!String(value).trim()) problems.push(`${name} leaves ${key} blank`);
  }
}

const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
for (const key of Object.keys(en)) {
  if (!(key in my)) continue;
  const expected = placeholders(en[key]).join(",");
  const actual = placeholders(my[key]).join(",");
  if (expected !== actual) {
    problems.push(`${key} expects {${expected}} but the translation has {${actual}}`);
  }
}

// A key nothing reads is a key nobody maintains.
const sources = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(path)) sources.push(readFileSync(path, "utf8"));
  }
};
walk(join(root, "src"));
const corpus = sources.join("\n");
for (const key of Object.keys(en)) {
  if (!corpus.includes(`"${key}"`)) problems.push(`nothing uses ${key}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Both catalogs agree on ${Object.keys(en).length} keys.`);
