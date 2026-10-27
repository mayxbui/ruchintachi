import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clothingSlots, getItem, itemCategories, items, itemsIn } from "./items";

describe("item catalogue", () => {
  it("has items in every category (clothing is paused, #29)", () => {
    for (const category of itemCategories) {
      if (category === "clothing") expect(itemsIn(category)).toEqual([]);
      else expect(itemsIn(category).length, category).toBeGreaterThan(0);
    }
  });

  it("has unique, url-safe ids", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const item of items) expect(item.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every item a name, a known category and a positive price", () => {
    for (const item of items) {
      expect(item.name.trim(), item.id).not.toBe("");
      expect(itemCategories, item.id).toContain(item.category);
      expect(item.price, item.id).toBeGreaterThan(0);
    }
  });

  it("gives clothing, and only clothing, a slot", () => {
    for (const item of items) {
      if (item.category === "clothing") expect(clothingSlots, item.id).toContain(item.slot);
      else expect(item.slot, item.id).toBeUndefined();
    }
  });

  it("gives each item its own icon, with a sprite at public/items/<icon>.webp", () => {
    expect(new Set(items.map((i) => i.icon)).size).toBe(items.length);
    for (const item of items) {
      expect(item.icon, item.id).toMatch(/^[A-Za-z0-9_]+$/);
      expect(item.sprite, item.id).toBe(`/items/${item.icon}.webp`);
      expect(existsSync(`public${item.sprite}`), `${item.sprite} (run pnpm sprites:build)`).toBe(true);
    }
  });

  it("looks items up by id", () => {
    const first = items[0];
    expect(getItem(first.id)).toBe(first);
    expect(getItem("not-an-item")).toBeUndefined();
  });
});
