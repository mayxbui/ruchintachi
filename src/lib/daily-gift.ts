// Daily gift rules (#16). Pure: the server action loads today's items and
// awards the gift; these functions only decide whether and from what pool.

import { items as catalogue, type Item, type ItemCategory } from "./items";

/** Clothing is paused until the end-of-week reward is decided (#29). */
export const DAILY_GIFT_CATEGORIES: readonly ItemCategory[] = ["food", "goods", "treasure"];

/**
 * A day earns its gift when it has at least one scheduled task and every one
 * is done. A day with no tasks earns nothing (and isn't a miss).
 */
export function earnsDailyGift(items: readonly { done: boolean }[]): boolean {
  return items.length > 0 && items.every((item) => item.done);
}

/** The items a daily gift can be rolled from. */
export function dailyGiftPool(items: readonly Item[] = catalogue): Item[] {
  return items.filter((item) => DAILY_GIFT_CATEGORIES.includes(item.category));
}
