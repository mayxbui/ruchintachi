// Fetches each catalogue item's icon from tlmodding/ltd-images (the same
// links the price sheet shows) and saves it as a 128px WebP at the item's
// sprite path, public/items/<icon>.webp. Sprites already there are skipped,
// so after `pnpm catalogue:import` this only fetches the new items.
//
//   pnpm sprites:build
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const ICONS = "https://raw.githubusercontent.com/tlmodding/ltd-images/refs/heads/main/Icon";
const DIR = new URL("../public/items/", import.meta.url);
const SIZE = 128; // largest use is the 96px gift reveal
const PARALLEL = 8;

const items = JSON.parse(readFileSync(new URL("../src/data/items.json", import.meta.url), "utf8"));
const todo = items.filter((item) => !existsSync(new URL(`.${item.sprite.slice("/items".length)}`, DIR)));
console.log(`${items.length - todo.length} sprites already built, ${todo.length} to fetch`);

const failed = [];
async function build(item) {
  const res = await fetch(`${ICONS}/${encodeURIComponent(item.icon)}.png`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const webp = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(SIZE, SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  writeFileSync(new URL(`${item.icon}.webp`, DIR), webp);
}

let next = 0;
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    while (next < todo.length) {
      const item = todo[next++];
      try {
        await build(item);
      } catch (error) {
        failed.push(`${item.icon} (${item.name}): ${error.message}`);
      }
    }
  }),
);

// Sprites for items no longer in the catalogue; delete them by hand if unwanted.
const wanted = new Set(items.map((item) => `${item.icon}.webp`));
const stale = readdirSync(DIR).filter((file) => file.endsWith(".webp") && !wanted.has(file));
if (stale.length) console.log(`Not in the catalogue: ${stale.join(", ")}`);

console.log(`Built ${todo.length - failed.length} sprites`);
if (failed.length) {
  console.error(`Failed:\n  ${failed.join("\n  ")}`);
  process.exitCode = 1;
}
