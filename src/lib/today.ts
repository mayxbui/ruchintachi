// Today's checklist. Pure: the page loads the user's habits, exceptions and
// completions, and these functions decide what is scheduled on a date.

import { occurrenceOn, type RepeatRule } from "./repeat-rule";

export type DayHabit = RepeatRule & {
  id: string;
  icon: string | null;
  note?: string | null;
  dueDate?: string | null;
};

export interface DayException {
  habitId: string;
  date: string;
  overrideName: string | null;
}

export interface DayItem {
  habitId: string;
  name: string; // the day's name, after any "only this day" rename
  icon: string | null;
  note: string | null;
  dueDate: string | null; // a one-off task's deadline
  repeats: boolean; // a repeating habit, not a one-off task; only these count for the streak, coins and weekly gift
  done: boolean;
}

/**
 * Every habit occurrence scheduled on `date` (pass carry-over tasks through
 * `scheduleAll` from due-date.ts first), in the habits' order, with
 * whether it is completed. Skipped days ("only this day" deletes) are left out.
 */
export function itemsOn(
  habits: DayHabit[],
  exceptions: DayException[],
  completedHabitIds: ReadonlySet<string>,
  date: string,
): DayItem[] {
  const items: DayItem[] = [];
  for (const habit of habits) {
    const own = exceptions.filter((e) => e.habitId === habit.id);
    const occurrence = occurrenceOn(habit, date, own);
    if (!occurrence) continue;
    items.push({
      habitId: habit.id,
      name: occurrence.name,
      icon: habit.icon,
      note: habit.note ?? null,
      dueDate: habit.dueDate ?? null,
      repeats: habit.frequency !== "none",
      done: completedHabitIds.has(habit.id),
    });
  }
  return items;
}

/** Completed and scheduled counts. `total` 0 means "no tasks today", not 0%. */
export function dayProgress(items: Pick<DayItem, "done">[]): { done: number; total: number } {
  return { done: items.filter((i) => i.done).length, total: items.length };
}
