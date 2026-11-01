// Daily gift rules (#16). Pure: the server action loads today's items and
// awards the gift; these functions only decide whether and from what pool.

import { isCompleteDay } from "./streak";
import { items as catalogue, type Item, type ItemCategory } from "./items";

/** Clothing is paused until the end-of-week reward is decided (#29). */
export const DAILY_GIFT_CATEGORIES: readonly ItemCategory[] = ["food", "goods", "treasure"];

/** A day earns its gift when it is complete (see isCompleteDay in streak.ts). */
export const earnsDailyGift = isCompleteDay;

/** The items a daily gift can be rolled from. */
export function dailyGiftPool(items: readonly Item[] = catalogue): Item[] {
  return items.filter((item) => DAILY_GIFT_CATEGORIES.includes(item.category));
}
