// Rebuilds src/data/items.json from the community price sheet (#14):
// one entry per named, priced item in the food, goods, treasure and clothes
// tabs. Never hand-edit the JSON; re-run this when the sheet changes, then
// `pnpm sprites:build` for any new icons.
//
//   pnpm catalogue:import
//
// Sheet: https://docs.google.com/spreadsheets/d/1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y
// (datamined by echocolat, with phil_macrocheira and superspazzy).
//
// The sheet is read as .xlsx, not CSV: each row's icon is an
// IMAGE("…/tlmodding/ltd-images/…/Icon/<icon>.png") formula, and only the
// .xlsx export keeps formulas. The icon name becomes the item's sprite.
import { writeFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";

const SHEET = "1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y";
const OUT = new URL("../src/data/items.json", import.meta.url);
const ICON_URL = /^https:\/\/raw\.githubusercontent\.com\/tlmodding\/ltd-images\/[^"]*\/Icon\/([^/"]+)\.png$/;

// Tabs by name.
const TABS = [
  { name: "Foods", category: "food" },
  { name: "Goods", category: "goods" },
  { name: "Treasures", category: "treasure" },
  { name: "Clothes (Outfits)", category: "clothing", slot: "outfit" },
  { name: "Clothes (Tops)", category: "clothing", slot: "top" },
  { name: "Clothes (Long Tops)", category: "clothing", slot: "long-top" },
  { name: "Clothes (Legwear)", category: "clothing", slot: "legwear" },
  { name: "Clothes (Headwear)", category: "clothing", slot: "headwear" },
  { name: "Clothes (Accessories)", category: "clothing", slot: "accessory" },
  { name: "Clothes (Socks)", category: "clothing", slot: "socks" },
  { name: "Clothes (Shoes)", category: "clothing", slot: "shoes" },
  { name: "Clothes (Costumes)", category: "clothing", slot: "costume" },
];

/** XML text → plain text: "&amp;" → "&", "&#10;" → newline. */
function unescapeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] === "#") return String.fromCodePoint(Number.parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[e.toLowerCase()];
  });
}

/** The text of an <si> or <is> element: its <t> runs, minus phonetic hints. */
function richText(xml) {
  const text = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  return [...text.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1])).join("");
}

/** "$7.60" or 7.6 → 7.6; blank or unreadable → 0. */
function dollars(text) {
  const n = Number.parseFloat((text ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** "ClothTopsTshirtHalfAnimal" → "cloth-tops-tshirt-half-animal". */
function slug(internalName) {
  return internalName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function fetchWorkbook() {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/export?format=xlsx`);
  if (!res.ok) throw new Error(`Sheet: HTTP ${res.status}`);
  const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
  const read = (path) => {
    if (!files[path]) throw new Error(`Sheet: no ${path} in the .xlsx`);
    return strFromU8(files[path]);
  };

  const strings = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => richText(m[1]));
  const targets = Object.fromEntries(
    [...read("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      m[0].match(/Id="([^"]+)"/)[1],
      m[0].match(/Target="([^"]+)"/)[1].replace(/^\/?(xl\/)?/, "xl/"),
    ]),
  );
  const sheets = Object.fromEntries(
    [...read("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)].map((m) => [
      unescapeXml(m[0].match(/name="([^"]+)"/)[1]),
      targets[m[0].match(/r:id="([^"]+)"/)[1]],
    ]),
  );

  /** A tab's rows as objects keyed by header, each with the row's icon name. */
  return function tab(name) {
    if (!sheets[name]) throw new Error(`Sheet: no tab "${name}"`);
    const rows = [...read(sheets[name]).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
      const cells = {};
      let icon = null;
      for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const [, column, attrs, body = ""] = c;
        const type = attrs.match(/t="([^"]+)"/)?.[1];
        const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        cells[column] =
          type === "s" ? strings[Number(value)] : type === "inlineStr" ? richText(body) : unescapeXml(value ?? "");
        const formula = body.match(/<f\b[^>]*>([\s\S]*?)<\/f>/)?.[1];
        const url = formula && unescapeXml(formula).match(/IMAGE\("([^"]+)"/)?.[1];
        if (url) {
          const match = url.match(ICON_URL);
          if (!match) throw new Error(`${name}: icon outside tlmodding/ltd-images: ${url}`);
          icon = decodeURIComponent(match[1]);
        }
      }
      return { cells, icon };
    });
    const [header, ...body] = rows;
    const keys = Object.entries(header.cells).map(([column, text]) => [column, text.trim()]);
    return body.map(({ cells, icon }) => ({
      ...Object.fromEntries(keys.map(([column, key]) => [key, (cells[column] ?? "").trim()])),
      icon,
    }));
  };
}

const tab = await fetchWorkbook();
const items = [];
const seen = new Set();
const icons = new Set();
for (const { name: tabName, category, slot } of TABS) {
  let kept = 0;
  for (const row of tab(tabName)) {
    const name = row["Name"];
    const internal = row["Internal name"];
    // Treasures list a selling price only.
    const price = dollars(row["Buying price"]) || dollars(row["Selling price"]);
    // Unnamed rows aren't in the game yet; free ones are starter items.
    if (!name || !internal || price <= 0) continue;

    const id = slug(internal);
    if (seen.has(id)) throw new Error(`Duplicate item id "${id}" (${name})`);
    seen.add(id);
    if (!row.icon) throw new Error(`No icon for "${name}" (${tabName})`);
    if (icons.has(row.icon)) throw new Error(`Icon ${row.icon} used twice (${name})`);
    icons.add(row.icon);
    items.push({
      id,
      name,
      category,
      ...(slot && { slot }),
      price,
      icon: row.icon,
      sprite: `/items/${row.icon}.webp`,
    });
    kept++;
  }
  console.log(`${category}${slot ? ` (${slot})` : ""}: ${kept}`);
}

items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
console.log(`Wrote ${items.length} items to src/data/items.json`);
