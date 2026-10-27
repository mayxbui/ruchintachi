import { describe, expect, it } from "vitest";
import { groupInventory, inventoryTotals } from "./inventory";
import type { Item } from "./items";

const catalogue: Item[] = [
  { id: "bacon", name: "bacon", category: "food", price: 3.8, sprite: "/items/bacon.png" },
  { id: "avocado", name: "avocado", category: "food", price: 1, sprite: "/items/avocado.png" },
  { id: "cap", name: "basic cap", category: "clothing", slot: "headwear", price: 10, sprite: "/items/cap.png" },
  { id: "album", name: "pop album", category: "treasure", price: 25, sprite: "/items/album.png" },
];
const lookup = (id: string) => catalogue.find((i) => i.id === id);

describe("groupInventory", () => {
  it("groups by category in catalogue order and sorts A–Z inside", () => {
    const groups = groupInventory(
      [
        { itemId: "cap", quantity: 1 },
        { itemId: "bacon", quantity: 2 },
        { itemId: "album", quantity: 1 },
        { itemId: "avocado", quantity: 3 },
      ],
      lookup,
    );
    expect(groups.map((g) => g.label)).toEqual(["Food", "Treasures", "Clothing"]);
    expect(groups[0].items.map((o) => [o.item.name, o.quantity])).toEqual([
      ["avocado", 3],
      ["bacon", 2],
    ]);
  });

  it("drops ids missing from the catalogue and empty rows", () => {
    expect(groupInventory([{ itemId: "gone", quantity: 2 }, { itemId: "bacon", quantity: 0 }], lookup)).toEqual([]);
  });

  it("is empty for an empty inventory", () => {
    expect(groupInventory([], lookup)).toEqual([]);
  });
});

describe("inventoryTotals", () => {
  it("counts duplicates in the total but once in kinds", () => {
    const groups = groupInventory(
      [
        { itemId: "avocado", quantity: 3 },
        { itemId: "cap", quantity: 1 },
      ],
      lookup,
    );
    expect(inventoryTotals(groups)).toEqual({ total: 4, kinds: 2 });
    expect(inventoryTotals([])).toEqual({ total: 0, kinds: 0 });
  });
});
