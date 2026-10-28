// Due dates for one-off tasks. Pure: pages and actions pass each habit with
// the day it was ticked (if any) and the user's "today".
//
// A one-off task with a due date carries over: it is on the list from its
// start date, then on each new "today" until it is ticked, and stays there
// (overdue) after the due date. Ticking records the day it was done, so it
// only ever counts on today and on that day; past days are never filled in.

import { addDays } from "./dates";
import type { Frequency } from "./repeat-rule";

interface Dated {
  frequency: Frequency;
  startDate: string;
  dueDate?: string | null;
}

/** True for a one-off task with a due date, which carries over until done. */
export function carriesOver(habit: Dated): boolean {
  return habit.frequency === "none" && !!habit.dueDate;
}

/**
 * The habit as scheduled: a carried-over task's one day is the day it was
 * ticked (`doneOn`), or else today (its start date while that's ahead).
 * Every other habit is returned as it is.
 */
export function scheduled<T extends Dated>(habit: T, today: string, doneOn: string | undefined): T {
  if (!carriesOver(habit)) return habit;
  const day = doneOn ?? (habit.startDate > today ? habit.startDate : today);
  return day === habit.startDate ? habit : { ...habit, startDate: day };
}

/** `scheduled` for a list of habits; `doneOn` maps habit id → day ticked. */
export function scheduleAll<T extends Dated & { id: string }>(
  habits: readonly T[],
  today: string,
  doneOn: ReadonlyMap<string, string>,
): T[] {
  return habits.map((h) => scheduled(h, today, doneOn.get(h.id)));
}

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const weekdayDayMonth = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** The task's due tag: "Due today", "Due Fri 30 Oct", "Overdue 2 days". */
export function dueLabel(dueDate: string, today: string): { text: string; overdue: boolean } {
  if (dueDate < today) {
    const days = daysBetween(dueDate, today);
    return { text: `Overdue ${days} day${days === 1 ? "" : "s"}`, overdue: true };
  }
  if (dueDate === today) return { text: "Due today", overdue: false };
  if (dueDate === addDays(today, 1)) return { text: "Due tomorrow", overdue: false };
  return { text: `Due ${weekdayDayMonth.format(new Date(`${dueDate}T00:00:00Z`))}`, overdue: false };
}
