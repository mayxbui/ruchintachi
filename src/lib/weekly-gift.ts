// Weekly gift (#27). Pure: the server counts each finished week's complete
// days and awards the gift; these functions decide which weeks are due and
// roll the gift. Replaces the daily gift and the perfect-week reward.

import { addDays, startOfWeek, type WeekStart } from "./dates";
import { rollGift } from "./gift-roll";
import { items as catalogue, type Item, type ItemCategory } from "./items";

/** Clothing is paused (#29). */
export const WEEKLY_GIFT_CATEGORIES: readonly ItemCategory[] = ["food", "goods", "treasure"];

/**
 * Weekly gifts start with the first week beginning on or after this day.
 * Earlier days were paid with the old daily gift, so they aren't paid twice.
 */
export const WEEKLY_GIFT_START = "2026-11-01";

/** The items a weekly gift can be rolled from. */
export function weeklyGiftPool(items: readonly Item[] = catalogue): Item[] {
  return items.filter((item) => WEEKLY_GIFT_CATEGORIES.includes(item.category));
}

/**
 * Rolls `rolls` times (one per complete day) and keeps the rarest: the
 * highest price, the first roll on a tie. No rolls, no gift.
 */
export function rollWeeklyGift<T extends { price: number }>(
  rolls: number,
  pool: readonly T[],
  random: () => number = Math.random,
): T | null {
  let best: T | null = null;
  for (let i = 0; i < rolls; i++) {
    const item = rollGift(pool, random);
    if (item && (!best || item.price > best.price)) best = item;
  }
  return best;
}

/**
 * Start dates of the finished weeks (the last day is before `today`) still
 * to be rewarded: from WEEKLY_GIFT_START, or after the last rewarded week
 * ends (`lastRewarded` is that week's start). Only whole weeks after that
 * count, so changing the week start never pays a day twice.
 */
export function weeksDue(today: string, weekStart: WeekStart, lastRewarded?: string): string[] {
  const after = lastRewarded ? addDays(lastRewarded, 7) : WEEKLY_GIFT_START;
  const earliest = after > WEEKLY_GIFT_START ? after : WEEKLY_GIFT_START;
  let week = startOfWeek(earliest, weekStart);
  if (week < earliest) week = addDays(week, 7);
  const weeks: string[] = [];
  for (; addDays(week, 6) < today; week = addDays(week, 7)) weeks.push(week);
  return weeks;
}
