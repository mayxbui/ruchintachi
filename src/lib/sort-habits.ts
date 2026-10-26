// How My Chronicle orders tasks. Pure: the pages pass each habit with the
// next date it comes up (null once it's finished) and the user's choice.

import type { Frequency } from "./repeat-rule";

export const HABIT_SORTS = [
  "next",
  "name-asc",
  "name-desc",
  "newest",
  "oldest",
  "repeat",
  "custom",
] as const;
export type HabitSort = (typeof HABIT_SORTS)[number];

export const SORT_LABELS: Record<HabitSort, string> = {
  next: "Next due",
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
  newest: "Newest",
  oldest: "Oldest",
  repeat: "Repeat",
  custom: "Custom",
};

export function isHabitSort(value: unknown): value is HabitSort {
  return HABIT_SORTS.includes(value as HabitSort);
}

export interface SortableHabit {
  name: string;
  frequency: Frequency;
  createdAt: Date;
  position: number;
  next: string | null; // next date it comes up; null = finished
}

const REPEAT_ORDER: Frequency[] = ["none", "daily", "weekly", "monthly", "annually"];
const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

const byName = (a: SortableHabit, b: SortableHabit) => collator.compare(a.name, b.name);
const byCreated = (a: SortableHabit, b: SortableHabit) => a.createdAt.getTime() - b.createdAt.getTime();

/** Finished habits go last; otherwise the sooner date first. */
function byNext(a: SortableHabit, b: SortableHabit) {
  if (a.next === b.next) return 0;
  if (a.next === null) return 1;
  if (b.next === null) return -1;
  return a.next < b.next ? -1 : 1;
}

const FIRST: Record<HabitSort, (a: SortableHabit, b: SortableHabit) => number> = {
  next: byNext,
  "name-asc": byName,
  "name-desc": (a, b) => byName(b, a),
  newest: (a, b) => byCreated(b, a),
  oldest: byCreated,
  repeat: (a, b) => REPEAT_ORDER.indexOf(a.frequency) - REPEAT_ORDER.indexOf(b.frequency),
  custom: (a, b) => a.position - b.position,
};

/**
 * A sorted copy. Ties fall back to name, then created date, so the order is
 * stable (Custom ties keep created order, so new habits land at the end).
 */
export function sortHabits<T extends SortableHabit>(habits: readonly T[], sort: HabitSort): T[] {
  const first = FIRST[sort];
  const tie = sort === "custom" ? byCreated : (a: T, b: T) => byName(a, b) || byCreated(a, b);
  return [...habits].sort((a, b) => first(a, b) || tie(a, b));
}

/** Moves done items below the rest, keeping each group's order. */
export function doneLast<T extends { done: boolean }>(items: readonly T[]): T[] {
  return [...items.filter((i) => !i.done), ...items.filter((i) => i.done)];
}

/**
 * The order after moving the ids in `moved` into the slots those ids held
 * in `all`, in the given order. Used to reorder a filtered view (a list)
 * without disturbing the tasks around it. Null if `moved` isn't a
 * reordering of ids found in `all`.
 */
export function placeInSlots(all: readonly string[], moved: readonly string[]): string[] | null {
  const set = new Set(moved);
  if (set.size !== moved.length || moved.some((id) => !all.includes(id))) return null;
  const queue = [...moved];
  return all.map((id) => (set.has(id) ? queue.shift()! : id));
}
