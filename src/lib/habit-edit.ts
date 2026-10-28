// Edit/delete rules for a habit series. Pure: actions load the habit and its
// exceptions, ask these functions what to do, then write the result.
//
// - "Only this day" adds an exception (rename or skip) for one date.
// - "This day and future" changes the series from a date on. If the series
//   has no days before that date it is changed in place; otherwise the old
//   series ends the day before and a new one starts on that date, so past
//   occurrences and completions never change.

import { addDays } from "./dates";
import {
  expandOccurrences,
  firstOccurrenceFrom,
  occurrenceOn,
  type HabitException,
  type RepeatRule,
} from "./repeat-rule";

export type EditScope = "day" | "future";

/** The first scheduled day on or after `from`, or null if the series is over. */
export function nextOccurrence(
  rule: RepeatRule,
  exceptions: HabitException[],
  from: string,
): string | null {
  return firstOccurrenceFrom(rule, from, exceptions)?.date ?? null;
}

/** A day can be edited if it is scheduled and not in the past. */
export function isEditableDay(
  rule: RepeatRule,
  exceptions: HabitException[],
  date: string,
  today: string,
): boolean {
  return date >= today && occurrenceOn(rule, date, exceptions) !== null;
}

/**
 * For an "after N times" series, how many times are left from `date` on.
 * Counts every rule instance before `date`, skipped days included (RRULE).
 */
export function remainingCount(rule: RepeatRule, date: string): number | null {
  if (rule.endType !== "after_count" || !rule.endCount) return null;
  const before =
    date > rule.startDate ? expandOccurrences(rule, rule.startDate, addDays(date, -1)).length : 0;
  return Math.max(rule.endCount - before, 0);
}

/**
 * The series as it stands from `date` on: what a "this day and future" edit
 * starts from. A one-off habit is edited whole, so it stays as it is.
 */
export function seriesFrom<T extends RepeatRule>(habit: T, date: string): T {
  if (habit.frequency === "none") return habit;
  return { ...habit, startDate: date, endCount: remainingCount(habit, date) ?? habit.endCount };
}

const SERIES_FIELDS = [
  "name",
  "icon",
  "note",
  "startDate",
  "frequency",
  "interval",
  "monthWeek",
  "monthWeekday",
  "endType",
  "endDate",
  "endCount",
  "dueDate",
] as const;
type SeriesFields = { [K in (typeof SERIES_FIELDS)[number]]?: unknown } & {
  weekdays?: readonly number[] | null;
};

/** True when nothing about the series differs, e.g. only its list changed. */
export function sameSeries(a: SeriesFields, b: SeriesFields): boolean {
  return (
    SERIES_FIELDS.every((k) => (a[k] ?? null) === (b[k] ?? null)) &&
    (a.weekdays ?? []).join() === (b.weekdays ?? []).join()
  );
}

export type FuturePlan =
  | { kind: "replace" } // no days before `date`: change the series in place
  | { kind: "split"; oldEndDate: string }; // end the old series, start a new one on `date`

/** How a "this day and future" edit applies to the series. */
export function planFutureEdit(rule: Pick<RepeatRule, "startDate">, date: string): FuturePlan {
  return date <= rule.startDate ? { kind: "replace" } : { kind: "split", oldEndDate: addDays(date, -1) };
}

export type FutureDeletePlan =
  | { kind: "delete" } // no days before `date`: remove the habit
  | { kind: "end"; endDate: string }; // keep the past, stop the day before

/** How a "this day and future" delete applies to the series. */
export function planFutureDelete(
  rule: Pick<RepeatRule, "startDate">,
  date: string,
): FutureDeletePlan {
  return date <= rule.startDate ? { kind: "delete" } : { kind: "end", endDate: addDays(date, -1) };
}
