// User-made task lists and the Tasks tab filters. Pure: the page loads the
// user's tasks (each with its next date) and lists, and these decide what shows.

import { addDays } from "./dates";

export const LIST_NAME_MAX = 30;
export const LISTS_MAX = 20;
/** The List dropdown's "+ New list" choice. Real list ids are UUIDs, so it can't clash. */
export const NEW_LIST = "new";
/** "Up next" covers today and the six days after it. */
export const UP_NEXT_DAYS = 7;

export type TaskFilter = { kind: "next" } | { kind: "all" } | { kind: "list"; listId: string };

/** Trims and checks a list name. */
export function validateListName(raw: string): { name: string } | { error: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give the list a name." };
  if (name.length > LIST_NAME_MAX) {
    return { error: `Keep the name to ${LIST_NAME_MAX} characters or fewer.` };
  }
  return { name };
}

/**
 * Reads the `?list=` filter. Unknown or someone else's list ids fall back to
 * "Up next", the default.
 */
export function parseTaskFilter(param: string | undefined, listIds: readonly string[]): TaskFilter {
  if (param === "all") return { kind: "all" };
  if (param && listIds.includes(param)) return { kind: "list", listId: param };
  return { kind: "next" };
}

/** The `?list=` value for a filter; "Up next" is the bare URL. */
export function filterParam(filter: TaskFilter): string | null {
  return filter.kind === "next" ? null : filter.kind === "all" ? "all" : filter.listId;
}

/**
 * The tasks a filter shows, in the given (already sorted) order. "Up next"
 * is tasks coming up in the next UP_NEXT_DAYS days.
 */
export function filterTasks<T extends { next: string; listId: string | null }>(
  tasks: readonly T[],
  filter: TaskFilter,
  today: string,
): T[] {
  switch (filter.kind) {
    case "all":
      return [...tasks];
    case "list":
      return tasks.filter((t) => t.listId === filter.listId);
    case "next": {
      const last = addDays(today, UP_NEXT_DAYS - 1);
      return tasks.filter((t) => t.next <= last);
    }
  }
}

const weekdayDayMonth = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** When a task next comes up: "Today", "Tomorrow" or e.g. "Fri 30 Oct". */
export function nextDateLabel(next: string, today: string): string {
  if (next === today) return "Today";
  if (next === addDays(today, 1)) return "Tomorrow";
  return weekdayDayMonth.format(new Date(`${next}T00:00:00Z`));
}
