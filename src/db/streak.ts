import { addDays } from "@/lib/dates";
import { currentStreak, dayType, type DayHabits, type DayType } from "@/lib/streak";
import { itemsOn } from "@/lib/today";
import type { Db } from "./accounts";
import { completionsBetween, listExceptions } from "./completions";
import { listHabits } from "./habits";

/** The user's past days, read lazily: what was scheduled and what kind of day it was. */
export interface DayHistory {
  /** The first day any repeating habit was scheduled; earlier days are empty. */
  earliest: string;
  itemsFor(date: string): DayHabits;
  typeOf(date: string): DayType;
}

/**
 * Loads the user's repeating habits, exceptions and completions up to
 * `today` once, for the streak, coins, weekly gift and calendar. One-off
 * tasks never count, so carry-over tasks need no scheduling.
 */
export function dayHistory(db: Db, userId: string, today: string): DayHistory {
  const habits = listHabits(db, userId).filter((h) => h.frequency !== "none");
  const earliest = habits.reduce((min, h) => (h.startDate < min ? h.startDate : min), addDays(today, 1));
  const exceptions = listExceptions(db, userId);
  const done = completionsBetween(db, userId, earliest, today);
  const cache = new Map<string, DayHabits>();
  const itemsFor = (date: string): DayHabits => {
    if (date > today || date < earliest) return [];
    if (!cache.has(date)) cache.set(date, itemsOn(habits, exceptions, done.get(date) ?? new Set(), date));
    return cache.get(date)!;
  };
  return { earliest, itemsFor, typeOf: (date) => dayType(itemsFor(date)) };
}

/** The user's current streak (#35). */
export function streakFor(db: Db, userId: string, today: string): number {
  const history = dayHistory(db, userId, today);
  return currentStreak(today, history.typeOf, history.earliest);
}
