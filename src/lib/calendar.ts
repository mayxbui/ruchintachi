// Month grid for the Progress page calendar (#19). Pure: months are "YYYY-MM" and
// dates "YYYY-MM-DD", in the user's own calendar (see dates.ts).

import { addDays, startOfWeek, type WeekStart } from "./dates";

export interface CalendarDay {
  date: string;
  inMonth: boolean; // false for the leading/trailing days of other months
}

/** The month in the URL if it's a real "YYYY-MM", otherwise the month of `today`. */
export function parseMonth(raw: string | undefined, today: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) return raw!;
  }
  return today.slice(0, 7);
}

/** "2026-10" plus `n` months, e.g. addMonths("2026-12", 1) = "2027-01". */
export function addMonths(month: string, n: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

function daysIn(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/**
 * Whole weeks covering the month, each starting on the user's week start.
 * Days from the months either side fill the first and last weeks.
 */
export function monthGrid(month: string, weekStart: WeekStart): CalendarDay[][] {
  const first = `${month}-01`;
  const last = `${month}-${String(daysIn(month)).padStart(2, "0")}`;
  const weeks: CalendarDay[][] = [];
  for (let start = startOfWeek(first, weekStart); start <= last; start = addDays(start, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i);
        return { date, inMonth: date.startsWith(month) };
      }),
    );
  }
  return weeks;
}

const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

/** Column headings in the user's week order, e.g. ["Mon", …, "Sun"]. */
export function weekdayLabels(weekStart: WeekStart): string[] {
  // 2026-10-04 is a Sunday, 2026-10-05 a Monday.
  const first = weekStart === "sunday" ? "2026-10-04" : "2026-10-05";
  return Array.from({ length: 7 }, (_, i) => weekdayFormat.format(new Date(`${addDays(first, i)}T00:00:00Z`)));
}

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-10" → "October 2026". */
export function formatMonth(month: string): string {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}
