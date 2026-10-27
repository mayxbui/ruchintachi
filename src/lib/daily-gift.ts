// Daily gift rules (#16). Pure: the server action loads today's items and
// awards the gift; these functions only decide whether and from what pool.

import { items as catalogue, type Item, type ItemCategory } from "./items";

/** Clothing is kept for the perfect-week reward. */
export const DAILY_GIFT_CATEGORIES: readonly ItemCategory[] = ["food", "goods", "treasure"];

/**
 * A day earns its gift when it has at least one repeating habit scheduled and
 * every one of them is done. One-off tasks don't count either way. A day with
 * no habits earns nothing (and isn't a miss). The streak uses the same rule.
 */
export function earnsDailyGift(items: readonly { repeats: boolean; done: boolean }[]): boolean {
  const habits = items.filter((item) => item.repeats);
  return habits.length > 0 && habits.every((item) => item.done);
}

/** The items a daily gift can be rolled from. */
export function dailyGiftPool(items: readonly Item[] = catalogue): Item[] {
  return items.filter((item) => DAILY_GIFT_CATEGORIES.includes(item.category));
}
