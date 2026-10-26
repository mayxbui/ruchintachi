// Rebuilds src/data/items.json from the community price sheet (#14):
// one entry per named, priced item in the food, goods, treasure and clothes
// tabs. Never hand-edit the JSON; re-run this when the sheet changes.
//
//   pnpm catalogue:import
//
// Sheet: https://docs.google.com/spreadsheets/d/1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y
// (datamined by echocolat, with phil_macrocheira and superspazzy).
import { writeFileSync } from "node:fs";

const SHEET = "1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y";
const OUT = new URL("../src/data/items.json", import.meta.url);

// Tabs by gid (the gid export keeps every row; the gviz one drops some).
const TABS = [
  { gid: "415930329", category: "food" },
  { gid: "67684898", category: "goods" },
  { gid: "1000832652", category: "treasure" },
  { gid: "1897844616", category: "clothing", slot: "outfit" },
  { gid: "2107867105", category: "clothing", slot: "top" },
  { gid: "262541168", category: "clothing", slot: "long-top" },
  { gid: "727561529", category: "clothing", slot: "legwear" },
  { gid: "2076444412", category: "clothing", slot: "headwear" },
  { gid: "651732674", category: "clothing", slot: "accessory" },
  { gid: "2103310691", category: "clothing", slot: "socks" },
  { gid: "2050662755", category: "clothing", slot: "shoes" },
  { gid: "1972172780", category: "clothing", slot: "costume" },
];

/** RFC 4180 CSV: quoted fields may hold commas, quotes and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** "$7.60" → 7.6; blank or unreadable → 0. */
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

async function fetchTab(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tab ${gid}: HTTP ${res.status}`);
  const [header, ...rows] = parseCsv(await res.text());
  const keys = header.map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const items = [];
const seen = new Set();
for (const tab of TABS) {
  let kept = 0;
  for (const row of await fetchTab(tab.gid)) {
    const name = row["Name"];
    const internal = row["Internal name"];
    // Treasures list a selling price only.
    const price = dollars(row["Buying price"]) || dollars(row["Selling price"]);
    // Unnamed rows aren't in the game yet; free ones are starter items.
    if (!name || !internal || price <= 0) continue;

    const id = slug(internal);
    if (seen.has(id)) throw new Error(`Duplicate item id "${id}" (${name})`);
    seen.add(id);
    items.push({
      id,
      name,
      category: tab.category,
      ...(tab.slot && { slot: tab.slot }),
      price,
      sprite: `/items/${id}.png`,
    });
    kept++;
  }
  console.log(`${tab.category}${tab.slot ? ` (${tab.slot})` : ""}: ${kept}`);
}

items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
console.log(`Wrote ${items.length} items to src/data/items.json`);
