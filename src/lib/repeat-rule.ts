// Repeat-rule engine. Expands a habit series into its occurrences for a
// date range. Pure: no DB, no time zones — every date is a local
// "YYYY-MM-DD" string. Follows RRULE semantics:
// - invalid dates are skipped, not clamped (monthly on the 31st skips
//   30-day months; annually on Feb 29 only hits leap years);
// - an "after N" count is spent by every rule instance from the start
//   date, including instances later removed by an exception (EXDATE).

import { addDays } from "./dates";

export type Frequency = "none" | "daily" | "weekly" | "monthly" | "annually";
export type EndType = "never" | "on_date" | "after_count";

/** The scheduling columns of a habit row. */
export interface RepeatRule {
  name: string;
  startDate: string;
  frequency: Frequency;
  weekdays?: number[] | null; // 0=Sun..6=Sat, weekly only
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

/** Every rule instance from the start date onwards, in order. Unbounded. */
function* instances(rule: RepeatRule): Generator<string> {
  const start = rule.startDate;
  const [y, m, d] = parts(start);

  switch (rule.frequency) {
    case "none":
      yield start;
      return;
    case "daily":
      for (let date = start; ; date = addDays(date, 1)) yield date;
    case "weekly": {
      // No weekdays means the start date's weekday, like RRULE without BYDAY.
      const valid = (rule.weekdays ?? []).filter((w) => w >= 0 && w <= 6);
      const days = new Set(valid.length ? valid : [weekday(start)]);
      for (let date = start; ; date = addDays(date, 1)) {
        if (days.has(weekday(date))) yield date;
      }
    }
    case "monthly":
      for (let i = 0; ; i++) {
        const year = y + Math.floor((m - 1 + i) / 12);
        const month = ((m - 1 + i) % 12) + 1;
        if (d <= daysInMonth(year, month)) yield format(year, month, d);
      }
    case "annually":
      for (let year = y; ; year++) {
        if (d <= daysInMonth(year, m)) yield format(year, m, d);
      }
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

/** The occurrence on `date`, or null if the habit isn't scheduled then. */
export function occurrenceOn(
  rule: RepeatRule,
  date: string,
  exceptions: HabitException[] = [],
): Occurrence | null {
  return expandOccurrences(rule, date, date, exceptions)[0] ?? null;
}
