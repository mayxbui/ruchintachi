// Day types and the streak (#35). Pure: the server loads each day's habits
// and completions; these functions only classify days and count them.
//
// Only repeating habits count, as for the weekly gift, coins and mood. A
// complete day has at least one repeating habit scheduled and every one of
// them done; a missed day has some left undone; an empty day has none
// (one-off tasks never count). A repaired day (#82) counts as empty.

import { addDays, startOfWeek, type WeekStart } from "./dates";

export type DayType = "complete" | "missed" | "empty";

/** One scheduled occurrence on a day; `repeats` is false for one-off tasks. */
export type DayHabits = readonly { repeats: boolean; done: boolean }[];

/** Every repeating habit scheduled that day is done, and there was at least one. */
export function isCompleteDay(items: DayHabits): boolean {
  const habits = items.filter((item) => item.repeats);
  return habits.length > 0 && habits.every((item) => item.done);
}

/** What kind of day it was. A repaired day is always empty. */
export function dayType(items: DayHabits, repaired = false): DayType {
  if (repaired || !items.some((item) => item.repeats)) return "empty";
  return isCompleteDay(items) ? "complete" : "missed";
}

/**
 * Complete days in a row ending on `date`, walking back no further than
 * `earliest`. Empty days are skipped; the first missed day ends it.
 */
export function streakEndingAt(date: string, typeOf: (date: string) => DayType, earliest: string): number {
  let count = 0;
  for (let day = date; day >= earliest; day = addDays(day, -1)) {
    const type = typeOf(day);
    if (type === "missed") break;
    if (type === "complete") count++;
  }
  return count;
}

/**
 * The current streak: complete days in a row ending today, or yesterday
 * while today isn't complete yet (an unfinished today never breaks it).
 */
export function currentStreak(today: string, typeOf: (date: string) => DayType, earliest: string): number {
  const end = typeOf(today) === "complete" ? today : addDays(today, -1);
  return streakEndingAt(end, typeOf, earliest);
}

/** Today's % done (all of today's tasks), or null for "no tasks today" rather than 0%. */
export function todayPercent(items: readonly { done: boolean }[]): number | null {
  if (items.length === 0) return null;
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}

/**
 * The missed day a streak repair (#82) can buy back today, or null. Offered
 * when yesterday was missed and the streak before it is at least 1, until
 * today ends. At most one repair per week (the week of the missed day), so
 * pass the dates already repaired. `typeOf` already counts repaired days as
 * empty, so two missed days in a row leave no streak to repair.
 */
export function repairOffer(
  today: string,
  typeOf: (date: string) => DayType,
  earliest: string,
  repaired: readonly string[],
  weekStart: WeekStart,
): string | null {
  const yesterday = addDays(today, -1);
  if (typeOf(yesterday) !== "missed") return null;
  const week = startOfWeek(yesterday, weekStart);
  if (repaired.some((date) => startOfWeek(date, weekStart) === week)) return null;
  return streakEndingAt(addDays(yesterday, -1), typeOf, earliest) >= 1 ? yesterday : null;
}
