import { describe, expect, it } from "vitest";
import { clothingSlots, getItem, itemCategories, items, itemsIn } from "./items";

describe("item catalogue", () => {
  it("has items in every category", () => {
    for (const category of itemCategories) expect(itemsIn(category).length, category).toBeGreaterThan(0);
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

  it("points each sprite at public/items/<id>.png", () => {
    for (const item of items) expect(item.sprite).toBe(`/items/${item.id}.png`);
  });

  it("looks items up by id", () => {
    const first = items[0];
    expect(getItem(first.id)).toBe(first);
    expect(getItem("not-an-item")).toBeUndefined();
  });
});
