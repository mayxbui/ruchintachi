// Completion rings on the Mii page (#24). Pure: the page loads the user's
// habits, exceptions and completions; these functions count how many
// occurrences were scheduled and done, up to today. The habit rings count
// repeating habits only, as for the daily gift, streak and mood; one-off
// tasks get a ring of their own.

import { expandOccurrences, type RepeatRule } from "./repeat-rule";
import type { DayException } from "./today";

export type RateHabit = RepeatRule & { id: string; icon: string | null };

/** One scheduled occurrence, and whether it was done. */
export interface RateOccurrence {
  date: string;
  habitId: string;
  name: string; // the habit's own name, not an "only this day" rename
  icon: string | null;
  repeats: boolean; // a repeating habit, not a one-off task
  done: boolean;
}

export interface Tally {
  done: number;
  scheduled: number;
}

/**
 * Every occurrence from `from` to `to` (inclusive), oldest first. Pass
 * carry-over tasks through `scheduleAll` (due-date.ts) first. Skipped days
 * ("only this day" deletes) are left out.
 */
export function occurrencesBetween(
  habits: readonly RateHabit[],
  exceptions: readonly DayException[],
  doneByDate: ReadonlyMap<string, ReadonlySet<string>>,
  from: string,
  to: string,
): RateOccurrence[] {
  if (from > to) return [];
  const out: RateOccurrence[] = [];
  for (const habit of habits) {
    const own = exceptions.filter((e) => e.habitId === habit.id);
    for (const { date } of expandOccurrences(habit, from, to, own)) {
      const done = doneByDate.get(date)?.has(habit.id) ?? false;
      const repeats = habit.frequency !== "none";
      out.push({ date, habitId: habit.id, name: habit.name, icon: habit.icon, repeats, done });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Done and scheduled counts for occurrences from `from` to `to` (inclusive). */
export function tally(occurrences: readonly RateOccurrence[], from = "", to = "9999-12-31"): Tally {
  const inRange = occurrences.filter((o) => o.date >= from && o.date <= to);
  return { done: inRange.filter((o) => o.done).length, scheduled: inRange.length };
}

/** Whole-number percent done, or null when nothing was scheduled (not 0%). */
export function ratePercent({ done, scheduled }: Tally): number | null {
  return scheduled === 0 ? null : Math.round((done / scheduled) * 100);
}

/**
 * One tally per habit, in the order the habits first appear. A habit split
 * by "this day and future" is two rows with the same name; they count as one.
 */
export function habitTallies(
  occurrences: readonly RateOccurrence[],
): { name: string; icon: string | null; tally: Tally }[] {
  const byName = new Map<string, { name: string; icon: string | null; tally: Tally }>();
  for (const o of occurrences) {
    const row = byName.get(o.name) ?? { name: o.name, icon: o.icon, tally: { done: 0, scheduled: 0 } };
    row.tally.scheduled++;
    if (o.done) row.tally.done++;
    byName.set(o.name, row);
  }
  return [...byName.values()];
}

/** The ring's colour: red below 40%, yellow below 80%, green from 80%. */
export function rateTone(percent: number): "low" | "mid" | "high" {
  return percent >= 80 ? "high" : percent >= 40 ? "mid" : "low";
}
