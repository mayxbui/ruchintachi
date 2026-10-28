import { and, eq, inArray } from "drizzle-orm";
import { planBulkDelete } from "@/lib/bulk-edit";
import { scheduleAll } from "@/lib/due-date";
import type { Db } from "./accounts";
import { carryOverDoneDates, listExceptions } from "./completions";
import { deleteHabit, endHabit, listHabits } from "./habits";
import { habits } from "./schema";
import { getTaskList } from "./task-lists";

/** The user's habits with these ids, or null (nothing done) if any isn't theirs. */
function ownHabits(db: Db, userId: string, ids: readonly string[]) {
  const wanted = new Set(ids);
  const own = listHabits(db, userId).filter((h) => wanted.has(h.id));
  return own.length === wanted.size ? own : null;
}

/**
 * Deletes tasks from `today` on (see planBulkDelete): past days and their
 * completions stay. All or nothing: false if any id isn't the user's.
 */
export function bulkDeleteHabits(db: Db, userId: string, ids: readonly string[], today: string): boolean {
  return db.transaction((tx) => {
    const own = ownHabits(tx, userId, ids);
    if (!own) return false;
    const plan = planBulkDelete(
      scheduleAll(own, today, carryOverDoneDates(tx, userId)),
      listExceptions(tx, userId),
      today,
    );
    for (const id of plan.remove) deleteHabit(tx, userId, id);
    for (const { id, endDate } of plan.end) endHabit(tx, userId, id, endDate);
    return true;
  });
}

/**
 * Puts tasks in one of the user's lists (null = no list). All or nothing:
 * false if the list or any task isn't the user's.
 */
export function bulkMoveHabits(
  db: Db,
  userId: string,
  ids: readonly string[],
  listId: string | null,
): boolean {
  return db.transaction((tx) => {
    if (listId && !getTaskList(tx, userId, listId)) return false;
    if (!ownHabits(tx, userId, ids)) return false;
    tx.update(habits)
      .set({ listId })
      .where(and(eq(habits.userId, userId), inArray(habits.id, [...ids])))
      .run();
    return true;
  });
}
