// The item catalogue (#14). The data lives in src/data/items.json, built from
// the community price sheet by scripts/import-catalogue.mjs; don't hand-edit it.
// Each item's icon is from tlmodding/ltd-images; `pnpm sprites:build` saves it
// as public/items/<icon>.webp.
import catalogue from "@/data/items.json";

export const itemCategories = ["food", "goods", "treasure", "clothing"] as const;
export type ItemCategory = (typeof itemCategories)[number];

export const clothingSlots = [
  "outfit",
  "top",
  "long-top",
  "legwear",
  "headwear",
  "accessory",
  "socks",
  "shoes",
  "costume",
] as const;
export type ClothingSlot = (typeof clothingSlots)[number];

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  slot?: ClothingSlot; // clothing only
  price: number; // in-game dollars; rarity is derived from it
  icon: string; // game icon name, e.g. "Food133"
  sprite: string; // public path: /items/<icon>.webp
}

export const items = catalogue as Item[];

const byId = new Map(items.map((item) => [item.id, item]));

/** The item with this id, or undefined if it's not (or no longer) in the catalogue. */
export function getItem(id: string): Item | undefined {
  return byId.get(id);
}

export function itemsIn(category: ItemCategory): Item[] {
  return items.filter((item) => item.category === category);
}
