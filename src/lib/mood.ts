// Mii mood (#25). Pure: the server loads each day's habits and completions,
// and these functions turn them into a 0–100 score and one of five moods.
//
// Only repeating habits count, as for the daily gift and the streak. A
// finished day where every habit was done lifts the mood; each habit left
// undone lowers it; a day with no habits leaves it alone. A perfect week
// adds a bonus on its last day. Today can only lift the mood (once every
// habit is done), so it never drops in the middle of a day.

import { earnsDailyGift } from "./daily-gift";
import { addDays, startOfWeek, weekDates, type WeekStart } from "./dates";

export const MOOD_MIN = 0;
export const MOOD_MAX = 100;
export const MOOD_START = 50; // Content

export const COMPLETE_DAY = 8;
export const MISSED_HABIT = 4;
export const MISSED_DAY_MAX = 12; // a bad day costs at most this much
export const PERFECT_WEEK = 12;

/** One scheduled occurrence on a day; `repeats` is false for one-off tasks. */
export type DayHabits = readonly { repeats: boolean; done: boolean }[];

/** The five moods, best to worst, with the lowest score of each. */
export const MOOD_LEVELS = [
  { id: "lovestruck", min: 85 },
  { id: "overjoyed", min: 65 },
  { id: "content", min: 40 },
  { id: "gloomy", min: 20 },
  { id: "fuming", min: MOOD_MIN },
] as const;

export type MoodLevel = (typeof MOOD_LEVELS)[number]["id"];

/** Keeps a score within 0–100, as a whole number. */
export function clampMood(score: number): number {
  return Math.min(MOOD_MAX, Math.max(MOOD_MIN, Math.round(score)));
}

/** The mood bubble for a score. */
export function moodLevel(score: number): MoodLevel {
  const clamped = clampMood(score);
  return MOOD_LEVELS.find((level) => clamped >= level.min)!.id;
}

/**
 * How one day moves the mood. A day that's still going (`finished` false)
 * only counts once it's complete; misses wait until the day is over.
 */
export function dayMoodChange(items: DayHabits, finished: boolean): number {
  if (earnsDailyGift(items)) return COMPLETE_DAY;
  if (!finished) return 0;
  const missed = items.filter((item) => item.repeats && !item.done).length;
  return missed === 0 ? 0 : -Math.min(MISSED_DAY_MAX, missed * MISSED_HABIT);
}

/**
 * Every repeating habit scheduled in the week was done. Empty days are
 * ignored; a week with no habits at all isn't perfect.
 */
export function isPerfectWeek(days: readonly DayHabits[]): boolean {
  const habits = days.flat().filter((item) => item.repeats);
  return habits.length > 0 && habits.every((item) => item.done);
}

/** True on the last day of a week, per the user's week start. */
export function isWeekEnd(date: string, weekStart: WeekStart): boolean {
  return addDays(startOfWeek(date, weekStart), 6) === date;
}

/**
 * Plays finished `dates` (in order) forward from `start` and returns the
 * mood at the end of each. `itemsFor` gives a day's scheduled occurrences;
 * on a week's last day it is also asked for the rest of that week, which
 * may reach back before `dates` begins.
 */
export function replayMood(
  start: number,
  dates: readonly string[],
  itemsFor: (date: string) => DayHabits,
  weekStart: WeekStart,
): { date: string; mood: number }[] {
  let mood = clampMood(start);
  return dates.map((date) => {
    let change = dayMoodChange(itemsFor(date), true);
    if (isWeekEnd(date, weekStart) && isPerfectWeek(weekDates(date, weekStart).map(itemsFor))) {
      change += PERFECT_WEEK;
    }
    mood = clampMood(mood + change);
    return { date, mood };
  });
}
