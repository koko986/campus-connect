import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(root, "docs", "database-schema.json");
const svgPath = path.join(root, "docs", "database-schema-visualizer.svg");
const pngPath = path.join(root, "docs", "database-schema-visualizer.png");

const require = createRequire(import.meta.url);
const runtimeModules =
  process.env.CODEX_NODE_MODULES ??
  "C:\\Users\\M S I\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const sharp = require(path.join(runtimeModules, "sharp"));

const snapshot = JSON.parse(await readFile(schemaPath, "utf8"));
const tables = new Map(snapshot.tables.map((table) => [table.name, table]));

const domains = [
  {
    name: "IDENTITY & PROFILES",
    note: "Accounts, roles, academic identity, and preferences",
    color: "#087E8B",
    soft: "#E6F5F6",
    tables: ["profiles", "student_profiles", "prospective_profiles"],
  },
  {
    name: "UNIVERSITY CATALOG",
    note: "Institutions, programs, shortlists, and contributed media",
    color: "#2563A6",
    soft: "#EAF2FB",
    tables: [
      "universities",
      "campuses",
      "departments",
      "programs",
      "saved_universities",
      "university_photos",
    ],
  },
  {
    name: "COMMUNITY & Q&A",
    note: "Posts, discussions, questions, answers, votes, and saves",
    color: "#C24B3A",
    soft: "#FCEDEA",
    tables: [
      "posts",
      "post_likes",
      "saved_posts",
      "comments",
      "comment_votes",
      "questions",
      "question_tags",
      "answers",
      "answer_votes",
    ],
  },
  {
    name: "MESSAGING & NOTIFICATIONS",
    note: "Direct/group conversations, messages, and realtime events",
    color: "#7057A3",
    soft: "#F0ECF8",
    tables: ["conversations", "conversation_members", "messages", "notifications"],
  },
  {
    name: "STUDENT SUCCESS HUB",
    note: "University matching, opportunities, reminders, and study buddies",
    color: "#34845B",
    soft: "#EAF5EF",
    tables: [
      "matcher_preferences",
      "opportunities",
      "opportunity_bookmarks",
      "opportunity_reminders",
      "study_buddy_profiles",
      "study_buddy_requests",
      "study_buddy_dismissals",
    ],
  },
  {
    name: "MODERATION & ADMIN",
    note: "Admin access, account controls, reports, and immutable audit history",
    color: "#9B3D54",
    soft: "#F9EAF0",
    tables: ["admin_users", "account_moderation", "reports", "moderation_actions"],
  },
];

const columnWidth = 1110;
const columnGap = 28;
const outerX = 76;
const top = 292;
const cardGap = 18;
const cardInset = 18;
const tableHeaderHeight = 56;
const rowHeight = 38;
const foreignKeyExtra = 24;
const sectionHeaderHeight = 116;
const footerHeight = 116;

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const shortType = (type) =>
  String(type)
    .replace("character", "char")
    .replace("double precision", "float8")
    .replace("timestamp without time zone", "timestamp");

const cardHeight = (table) =>
  tableHeaderHeight +
  table.columns.reduce(
    (height, column) => height + rowHeight + (column.references ? foreignKeyExtra : 0),
    0,
  ) +
  cardInset;

const domainHeight = (domain) =>
  sectionHeaderHeight +
  domain.tables.reduce((height, name) => height + cardHeight(tables.get(name)) + cardGap, 0) +
  12;

const contentHeight = Math.max(...domains.map(domainHeight));
const width = outerX * 2 + domains.length * columnWidth + (domains.length - 1) * columnGap;
const height = top + contentHeight + footerHeight;
const foreignKeyColumnCount = snapshot.tables.reduce(
  (count, table) => count + table.columns.filter((column) => column.references).length,
  0,
);
const columnCount = snapshot.tables.reduce((count, table) => count + table.columns.length, 0);

const parts = [];
parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
);
parts.push(`<rect width="100%" height="100%" fill="#F5F7FA"/>`);
parts.push(`<rect x="0" y="0" width="${width}" height="222" fill="#101A2B"/>`);
parts.push(
  `<text x="${outerX}" y="82" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="700">TAKKA DATABASE SCHEMA</text>`,
  `<text x="${outerX}" y="130" fill="#AFBED3" font-family="Arial, sans-serif" font-size="24">Production public schema | ${escapeXml(snapshot.generatedAt)} | Supabase PostgreSQL</text>`,
);

const badges = [
  `${snapshot.tables.length} TABLES`,
  `${columnCount} COLUMNS`,
  `${snapshot.foreignKeyConstraints} FK CONSTRAINTS`,
  "RLS ENABLED",
];
let badgeX = width - outerX;
for (const badge of [...badges].reverse()) {
  const badgeWidth = badge.length * 17 + 42;
  badgeX -= badgeWidth;
  parts.push(
    `<rect x="${badgeX}" y="62" width="${badgeWidth}" height="48" rx="6" fill="#1D2B42" stroke="#344760"/>`,
    `<text x="${badgeX + badgeWidth / 2}" y="94" text-anchor="middle" fill="#DDE6F2" font-family="Arial, sans-serif" font-size="20" font-weight="700">${badge}</text>`,
  );
  badgeX -= 16;
}

parts.push(
  `<circle cx="${outerX + 10}" cy="184" r="8" fill="#F3B33D"/><text x="${outerX + 28}" y="192" fill="#CBD6E5" font-family="Arial, sans-serif" font-size="20">PK primary key</text>`,
  `<circle cx="${outerX + 218}" cy="184" r="8" fill="#42BFD0"/><text x="${outerX + 236}" y="192" fill="#CBD6E5" font-family="Arial, sans-serif" font-size="20">FK foreign key</text>`,
  `<circle cx="${outerX + 432}" cy="184" r="8" fill="#75849A"/><text x="${outerX + 450}" y="192" fill="#CBD6E5" font-family="Arial, sans-serif" font-size="20">? nullable</text>`,
  `<text x="${width - outerX}" y="192" text-anchor="end" fill="#CBD6E5" font-family="Arial, sans-serif" font-size="20">${foreignKeyColumnCount} FK columns include their referenced table and column</text>`,
);

domains.forEach((domain, domainIndex) => {
  const x = outerX + domainIndex * (columnWidth + columnGap);
  let y = top;
  const fullDomainHeight = domainHeight(domain);

  parts.push(
    `<rect x="${x}" y="${y}" width="${columnWidth}" height="${fullDomainHeight}" rx="10" fill="${domain.soft}" stroke="${domain.color}" stroke-width="2" opacity="0.96"/>`,
    `<rect x="${x}" y="${y}" width="${columnWidth}" height="${sectionHeaderHeight}" rx="10" fill="${domain.color}"/>`,
    `<rect x="${x}" y="${y + sectionHeaderHeight - 10}" width="${columnWidth}" height="10" fill="${domain.color}"/>`,
    `<text x="${x + 24}" y="${y + 44}" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(domain.name)}</text>`,
    `<text x="${x + 24}" y="${y + 79}" fill="#FFFFFF" opacity="0.84" font-family="Arial, sans-serif" font-size="18">${escapeXml(domain.note)}</text>`,
    `<text x="${x + columnWidth - 24}" y="${y + 44}" text-anchor="end" fill="#FFFFFF" opacity="0.9" font-family="Arial, sans-serif" font-size="20" font-weight="700">${domain.tables.length} TABLES</text>`,
  );
  y += sectionHeaderHeight + 14;

  for (const tableName of domain.tables) {
    const table = tables.get(tableName);
    if (!table) throw new Error(`Missing table metadata: ${tableName}`);
    const h = cardHeight(table);
    const cardX = x + 14;
    const cardWidth = columnWidth - 28;

    parts.push(
      `<rect x="${cardX + 3}" y="${y + 5}" width="${cardWidth}" height="${h}" rx="7" fill="#A8B1BF" opacity="0.18"/>`,
      `<rect x="${cardX}" y="${y}" width="${cardWidth}" height="${h}" rx="7" fill="#FFFFFF" stroke="#D5DCE6"/>`,
      `<rect x="${cardX}" y="${y}" width="9" height="${tableHeaderHeight}" rx="4" fill="${domain.color}"/>`,
      `<text x="${cardX + 25}" y="${y + 37}" fill="#162238" font-family="Consolas, monospace" font-size="25" font-weight="700">${escapeXml(table.name)}</text>`,
      `<text x="${cardX + cardWidth - 20}" y="${y + 35}" text-anchor="end" fill="#718096" font-family="Arial, sans-serif" font-size="17">${table.columns.length} columns</text>`,
      `<line x1="${cardX}" y1="${y + tableHeaderHeight}" x2="${cardX + cardWidth}" y2="${y + tableHeaderHeight}" stroke="#E2E7EF"/>`,
    );

    let rowY = y + tableHeaderHeight;
    table.columns.forEach((column, index) => {
      const currentHeight = rowHeight + (column.references ? foreignKeyExtra : 0);
      if (index % 2 === 1) {
        parts.push(
          `<rect x="${cardX + 1}" y="${rowY}" width="${cardWidth - 2}" height="${currentHeight}" fill="#F8FAFC"/>`,
        );
      }

      let labelX = cardX + 24;
      if (column.pk) {
        parts.push(
          `<rect x="${labelX}" y="${rowY + 9}" width="38" height="20" rx="4" fill="#FFF0C9"/>`,
          `<text x="${labelX + 19}" y="${rowY + 24}" text-anchor="middle" fill="#8A5C00" font-family="Arial, sans-serif" font-size="13" font-weight="700">PK</text>`,
        );
        labelX += 48;
      }
      if (column.references) {
        parts.push(
          `<rect x="${labelX}" y="${rowY + 9}" width="38" height="20" rx="4" fill="#DDF6F8"/>`,
          `<text x="${labelX + 19}" y="${rowY + 24}" text-anchor="middle" fill="#087E8B" font-family="Arial, sans-serif" font-size="13" font-weight="700">FK</text>`,
        );
        labelX += 48;
      }
      if (column.nullable) {
        parts.push(
          `<text x="${labelX}" y="${rowY + 26}" fill="#8A96A8" font-family="Consolas, monospace" font-size="19">?</text>`,
        );
        labelX += 19;
      }

      parts.push(
        `<text x="${labelX}" y="${rowY + 26}" fill="#24324A" font-family="Consolas, monospace" font-size="19">${escapeXml(column.name)}</text>`,
        `<text x="${cardX + cardWidth - 20}" y="${rowY + 26}" text-anchor="end" fill="#66758A" font-family="Consolas, monospace" font-size="17">${escapeXml(shortType(column.type))}</text>`,
      );

      if (column.references) {
        const reference = column.references;
        const external = reference.schema !== "public";
        parts.push(
          `<text x="${cardX + 72}" y="${rowY + 50}" fill="${external ? "#9B3D54" : domain.color}" font-family="Consolas, monospace" font-size="16">&#8594; ${escapeXml(reference.schema)}.${escapeXml(reference.table)}.${escapeXml(reference.column)}${external ? "  [managed by Supabase]" : ""}</text>`,
        );
      }

      rowY += currentHeight;
      parts.push(
        `<line x1="${cardX + 18}" y1="${rowY}" x2="${cardX + cardWidth - 18}" y2="${rowY}" stroke="#EDF0F4"/>`,
      );
    });

    y += h + cardGap;
  }
});

const footerY = height - 74;
parts.push(
  `<line x1="${outerX}" y1="${footerY - 28}" x2="${width - outerX}" y2="${footerY - 28}" stroke="#CED5DF"/>`,
  `<text x="${outerX}" y="${footerY}" fill="#526177" font-family="Arial, sans-serif" font-size="19">Source: live production information_schema | Public tables only | auth.users is referenced but managed by Supabase Auth</text>`,
  `<text x="${width - outerX}" y="${footerY}" text-anchor="end" fill="#526177" font-family="Arial, sans-serif" font-size="19">TAKKA / Campus Connect</text>`,
  `</svg>`,
);

const svg = parts.join("\n");
await writeFile(svgPath, svg, "utf8");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(pngPath);

console.log(`Rendered ${path.relative(root, pngPath)} (${width}x${height})`);
