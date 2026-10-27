// The inventory page's layout (#18). Pure: the page loads the user's rows and
// this groups them by category for display.

import { getItem, itemCategories, type Item, type ItemCategory } from "./items";

export const categoryLabels: Record<ItemCategory, string> = {
  food: "Food",
  goods: "Goods",
  treasure: "Treasures",
  clothing: "Clothing",
};

export interface InventoryGroup {
  category: ItemCategory;
  label: string;
  items: { item: Item; quantity: number }[];
}

/**
 * Owned items grouped by category (catalogue order), A–Z within each.
 * Empty categories are left out, and so are ids no longer in the catalogue.
 */
export function groupInventory(
  rows: readonly { itemId: string; quantity: number }[],
  lookup: (id: string) => Item | undefined = getItem,
): InventoryGroup[] {
  const owned = rows.flatMap(({ itemId, quantity }) => {
    const item = lookup(itemId);
    return item && quantity > 0 ? [{ item, quantity }] : [];
  });
  return itemCategories.flatMap((category) => {
    const items = owned
      .filter((o) => o.item.category === category)
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
    return items.length ? [{ category, label: categoryLabels[category], items }] : [];
  });
}

/** Total items owned (counting duplicates) and how many different ones. */
export function inventoryTotals(groups: readonly InventoryGroup[]): { total: number; kinds: number } {
  const all = groups.flatMap((g) => g.items);
  return { total: all.reduce((sum, o) => sum + o.quantity, 0), kinds: all.length };
}
