import { and, asc, eq, max } from "drizzle-orm";
import { planBulkDelete } from "@/lib/bulk-edit";
import { scheduleAll } from "@/lib/due-date";
import { LISTS_MAX } from "@/lib/task-lists";
import type { Db } from "./accounts";
import { carryOverDoneDates, listExceptions } from "./completions";
import { deleteHabit, endHabit, getHabit, listHabits } from "./habits";
import { habits, taskLists } from "./schema";

/** The user's own lists, in the order they made them. */
export function listTaskLists(db: Db, userId: string) {
  return db
    .select({ id: taskLists.id, name: taskLists.name })
    .from(taskLists)
    .where(eq(taskLists.userId, userId))
    .orderBy(asc(taskLists.position), asc(taskLists.id))
    .all();
}

/** One of the user's lists, or undefined if it doesn't exist or isn't theirs. */
export function getTaskList(db: Db, userId: string, listId: string) {
  return db
    .select({ id: taskLists.id, name: taskLists.name })
    .from(taskLists)
    .where(and(eq(taskLists.id, listId), eq(taskLists.userId, userId)))
    .get();
}

/** Adds a list at the end. Returns its id, or null once the user has LISTS_MAX. */
export function createTaskList(db: Db, userId: string, name: string): string | null {
  return db.transaction((tx) => {
    if (listTaskLists(tx, userId).length >= LISTS_MAX) return null;
    const last = tx
      .select({ position: max(taskLists.position) })
      .from(taskLists)
      .where(eq(taskLists.userId, userId))
      .get();
    const id = crypto.randomUUID();
    tx.insert(taskLists)
      .values({ id, userId, name, position: (last?.position ?? -1) + 1 })
      .run();
    return id;
  });
}

export function renameTaskList(db: Db, userId: string, listId: string, name: string): void {
  db.update(taskLists)
    .set({ name })
    .where(and(eq(taskLists.id, listId), eq(taskLists.userId, userId)))
    .run();
}

/** Deletes a list. Its tasks stay, unlisted. */
export function deleteTaskList(db: Db, userId: string, listId: string): void {
  db.transaction((tx) => {
    if (!getTaskList(tx, userId, listId)) return;
    tx.update(habits)
      .set({ listId: null })
      .where(and(eq(habits.listId, listId), eq(habits.userId, userId)))
      .run();
    tx.delete(taskLists).where(eq(taskLists.id, listId)).run();
  });
}

/**
 * Deletes a list and its tasks from `today` on, like "delete this day and
 * future": a task with no past days goes; one with past days stops yesterday,
 * so its history stays. Finished tasks only lose the list.
 */
export function deleteTaskListAndTasks(db: Db, userId: string, listId: string, today: string): void {
  db.transaction((tx) => {
    if (!getTaskList(tx, userId, listId)) return;
    const inList = listHabits(tx, userId).filter((h) => h.listId === listId);
    const plan = planBulkDelete(
      scheduleAll(inList, today, carryOverDoneDates(tx, userId)),
      listExceptions(tx, userId),
      today,
    );
    for (const id of plan.remove) deleteHabit(tx, userId, id);
    for (const { id, endDate } of plan.end) endHabit(tx, userId, id, endDate);
    deleteTaskList(tx, userId, listId);
  });
}

/**
 * Puts one of the user's tasks in one of their lists (null = no list).
 * Ignored if either isn't theirs.
 */
export function setHabitList(
  db: Db,
  userId: string,
  habitId: string,
  listId: string | null,
): void {
  if (listId && !getTaskList(db, userId, listId)) return;
  if (!getHabit(db, userId, habitId)) return;
  db.update(habits)
    .set({ listId })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}
