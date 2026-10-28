// Bulk edit on the Tasks tab. Pure: actions check the posted ids here, then
// load the user's habits and ask what a bulk delete does to each.

import { nextOccurrence, planFutureDelete } from "./habit-edit";
import type { HabitException, RepeatRule } from "./repeat-rule";

/** Most tasks one bulk action takes (well above anyone's task count). */
export const BULK_MAX = 1000;

/** The posted task ids: unique strings, 1 to BULK_MAX of them. Null if not. */
export function parseBulkIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > BULK_MAX) return null;
  if (!value.every((id) => typeof id === "string" && id.length > 0)) return null;
  return [...new Set(value as string[])];
}

export interface BulkDeletePlan {
  remove: string[]; // no days before today: delete the habit
  end: { id: string; endDate: string }[]; // keep the past, stop yesterday
}

/**
 * What deleting these tasks does, like "delete this day and future" from
 * today: a task with no past days goes; one with past days stops yesterday,
 * so its occurrences and completions stay. Finished tasks are left alone.
 * Pass carry-over tasks through `scheduleAll` (due-date.ts) first.
 */
export function planBulkDelete(
  habits: readonly (RepeatRule & { id: string })[],
  exceptions: readonly (HabitException & { habitId: string })[],
  today: string,
): BulkDeletePlan {
  const plan: BulkDeletePlan = { remove: [], end: [] };
  for (const habit of habits) {
    const own = exceptions.filter((e) => e.habitId === habit.id);
    if (!nextOccurrence(habit, own, today)) continue;
    const step = planFutureDelete(habit, today);
    if (step.kind === "delete") plan.remove.push(habit.id);
    else plan.end.push({ id: habit.id, endDate: step.endDate });
  }
  return plan;
}
