// Repeat-rule engine. Expands a habit series into its occurrences for a
// date range. Pure: no DB, no time zones — every date is a local
// "YYYY-MM-DD" string. Follows RRULE semantics:
// - invalid dates are skipped, not clamped (monthly on the 31st skips
//   30-day months; annually on Feb 29 only hits leap years);
// - an "after N" count is spent by every rule instance from the start
//   date, including instances later removed by an exception (EXDATE);
// - INTERVAL: every N days / weeks / months / years. Weeks start on Monday
//   (RRULE's default WKST), counted from the start date's week;
// - monthly BYDAY with a position: the 1st–4th or last weekday of the month
//   (1SU, -1SU). Months where the start date falls after that day start
//   from the next one.

import { addDays } from "./dates";

export type Frequency = "none" | "daily" | "weekly" | "monthly" | "annually";
export type EndType = "never" | "on_date" | "after_count";

/** The scheduling columns of a habit row. */
export interface RepeatRule {
  name: string;
  startDate: string;
  frequency: Frequency;
  weekdays?: number[] | null; // 0=Sun..6=Sat, weekly only
  interval?: number | null; // every N periods; missing = 1
  // Monthly "on the 2nd Tuesday" / "on the last Sunday": both set, or both
  // null for "on the same day of the month".
  monthWeek?: number | null; // 1..4, or -1 for the last
  monthWeekday?: number | null; // 0=Sun..6=Sat
  endType: EndType;
  endDate?: string | null; // inclusive, on_date only
  endCount?: number | null; // after_count only
}

/** An "only this day" edit. A null overrideName means the day is skipped. */
export interface HabitException {
  date: string;
  overrideName: string | null;
}

export interface Occurrence {
  date: string;
  name: string;
}

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

function format(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Whole days from `a` to `b`. */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Day of the month of the `week`th (1..4, -1 = last) `weekdayNo` in a month. */
export function nthWeekdayOfMonth(y: number, m: number, week: number, weekdayNo: number): number {
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const first = 1 + ((weekdayNo - firstWeekday + 7) % 7);
  if (week > 0) return first + (week - 1) * 7; // weeks 1–4 always fit
  const last = daysInMonth(y, m);
  return first + Math.floor((last - first) / 7) * 7;
}

// Rules stop here, so a rule that never lands again (say, Feb 29 every 100
// years from a year that never meets a leap year) still ends.
const LAST_YEAR = 9999;

function assertValid(rule: RepeatRule): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.startDate)) {
    throw new Error(`Invalid start date: ${rule.startDate}`);
  }
  if (rule.endType === "on_date" && !rule.endDate) {
    throw new Error("endType on_date needs an endDate");
  }
  if (
    rule.endType === "after_count" &&
    !(Number.isInteger(rule.endCount) && (rule.endCount ?? 0) >= 1)
  ) {
    throw new Error("endType after_count needs an endCount of at least 1");
  }
}

/** Every rule instance from the start date onwards, in order, up to LAST_YEAR. */
function* instances(rule: RepeatRule): Generator<string> {
  const start = rule.startDate;
  const [y, m, d] = parts(start);
  const every = Math.max(1, Math.floor(rule.interval ?? 1));
  const until = `${LAST_YEAR}-12-31`;

  switch (rule.frequency) {
    case "none":
      yield start;
      return;
    case "daily":
      for (let date = start; date <= until; date = addDays(date, every)) yield date;
      return;
    case "weekly": {
      // No weekdays means the start date's weekday, like RRULE without BYDAY.
      const valid = (rule.weekdays ?? []).filter((w) => w >= 0 && w <= 6);
      const days = new Set(valid.length ? valid : [weekday(start)]);
      const monday = addDays(start, -((weekday(start) + 6) % 7));
      for (let date = start; date <= until; date = addDays(date, 1)) {
        // Only weeks 0, N, 2N… counted from the start date's week.
        const week = Math.floor(daysBetween(monday, date) / 7);
        if (week % every !== 0) {
          date = addDays(monday, (week + every - (week % every)) * 7 - 1); // jump to the next counted week
          continue;
        }
        if (days.has(weekday(date))) yield date;
      }
      return;
    }
    case "monthly": {
      const byWeekday = rule.monthWeek != null && rule.monthWeekday != null;
      for (let i = 0; ; i += every) {
        const year = y + Math.floor((m - 1 + i) / 12);
        const month = ((m - 1 + i) % 12) + 1;
        if (year > LAST_YEAR) return;
        const day = byWeekday ? nthWeekdayOfMonth(year, month, rule.monthWeek!, rule.monthWeekday!) : d;
        if (day > daysInMonth(year, month)) continue; // e.g. the 31st in a 30-day month
        const date = format(year, month, day);
        if (date >= start) yield date; // the start month's day may already have passed
      }
    }
    case "annually":
      for (let year = y; year <= LAST_YEAR; year += every) {
        if (d <= daysInMonth(year, m)) yield format(year, m, d);
      }
      return;
  }
}

/** Occurrences of `rule` between `from` and `to`, both inclusive. */
export function expandOccurrences(
  rule: RepeatRule,
  from: string,
  to: string,
  exceptions: HabitException[] = [],
): Occurrence[] {
  assertValid(rule);
  const overrides = new Map(exceptions.map((e) => [e.date, e.overrideName]));
  const out: Occurrence[] = [];
  let count = 0;

  for (const date of instances(rule)) {
    if (date > to) break;
    if (rule.endType === "on_date" && date > rule.endDate!) break;
    if (rule.endType === "after_count" && count >= rule.endCount!) break;
    count++;
    if (date < from) continue;

    const override = overrides.get(date);
    if (override === null) continue; // skipped "only this day"
    out.push({ date, name: override ?? rule.name });
  }
  return out;
}

/**
 * The first occurrence on or after `from` (skipped days don't count), or
 * null if the series ends before then. Walks the rule itself, so a rule
 * that repeats every few years still finds its next day.
 */
export function firstOccurrenceFrom(
  rule: RepeatRule,
  from: string,
  exceptions: HabitException[] = [],
): Occurrence | null {
  assertValid(rule);
  const overrides = new Map(exceptions.map((e) => [e.date, e.overrideName]));
  let count = 0;
  for (const date of instances(rule)) {
    if (rule.endType === "on_date" && date > rule.endDate!) return null;
    if (rule.endType === "after_count" && count >= rule.endCount!) return null;
    count++;
    if (date < from) continue;
    const override = overrides.get(date);
    if (override === null) continue;
    return { date, name: override ?? rule.name };
  }
  return null;
}

/** The occurrence on `date`, or null if the habit isn't scheduled then. */
export function occurrenceOn(
  rule: RepeatRule,
  date: string,
  exceptions: HabitException[] = [],
): Occurrence | null {
  return expandOccurrences(rule, date, date, exceptions)[0] ?? null;
}
