// Coins (#28). Pure: the server action counts today's habits and the streak;
// these functions turn them into coins. Only repeating habits earn coins.

import { isCompleteDay, type DayHabits } from "./streak";

export const COINS_PER_HABIT = 2;
export const HABIT_COINS_MAX = 10;
export const COMPLETE_DAY_COINS = 20;
export const COINS_PER_STREAK_DAY = 2;
export const STREAK_COINS_MAX = 20;
export const DAY_COINS_MAX = HABIT_COINS_MAX + COMPLETE_DAY_COINS + STREAK_COINS_MAX; // 50
export const REPAIR_COST = 100; // a streak repair (#82)

/**
 * What a day's habits earn: 2 per repeating habit done (up to 10), plus 20
 * on a complete day with a streak bonus of 2 per day of the streak,
 * counting that day (up to 20). One-off tasks earn nothing.
 */
export function coinsForDay(items: DayHabits, streak: number): number {
  const done = items.filter((item) => item.repeats && item.done).length;
  let coins = Math.min(done * COINS_PER_HABIT, HABIT_COINS_MAX);
  if (isCompleteDay(items)) {
    coins += COMPLETE_DAY_COINS + Math.min(Math.max(streak, 0) * COINS_PER_STREAK_DAY, STREAK_COINS_MAX);
  }
  return coins;
}
