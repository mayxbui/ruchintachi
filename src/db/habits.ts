import { and, asc, eq, gt, gte, max } from "drizzle-orm";
import type { NewHabit } from "@/lib/habit-form";
import type { HabitIcon } from "@/lib/habit-icons";
import { placeInSlots } from "@/lib/sort-habits";
import type { Db } from "./accounts";
import { completions, habitExceptions, habits } from "./schema";

/** Stores a validated habit for `userId`, at the end of their custom order. Returns its id. */
export function createHabit(db: Db, userId: string, habit: NewHabit): string {
  const id = crypto.randomUUID();
  const last = db
    .select({ position: max(habits.position) })
    .from(habits)
    .where(eq(habits.userId, userId))
    .get();
  db.insert(habits)
    .values({ id, userId, position: (last?.position ?? -1) + 1, ...habit })
    .run();
  return id;
}

const habitFields = {
  id: habits.id,
  name: habits.name,
  icon: habits.icon,
  note: habits.note,
  startDate: habits.startDate,
  frequency: habits.frequency,
  weekdays: habits.weekdays,
  interval: habits.interval,
  monthWeek: habits.monthWeek,
  monthWeekday: habits.monthWeekday,
  endType: habits.endType,
  endDate: habits.endDate,
  endCount: habits.endCount,
  dueDate: habits.dueDate,
  listId: habits.listId,
  position: habits.position,
  createdAt: habits.createdAt,
};

/** The user's own habits, oldest first. Never returns another user's rows. */
export function listHabits(db: Db, userId: string) {
  return db
    .select(habitFields)
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(asc(habits.createdAt), asc(habits.id))
    .all();
}

/** One of the user's habits, or undefined if it doesn't exist or isn't theirs. */
export function getHabit(db: Db, userId: string, habitId: string) {
  return db
    .select(habitFields)
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .get();
}

/**
 * "Only this day": renames (`overrideName`) or skips (null) one date.
 * Replaces any earlier exception for that date.
 */
export function setException(
  db: Db,
  userId: string,
  habitId: string,
  date: string,
  overrideName: string | null,
): void {
  if (!getHabit(db, userId, habitId)) return;
  db.insert(habitExceptions)
    .values({ habitId, date, overrideName })
    .onConflictDoUpdate({
      target: [habitExceptions.habitId, habitExceptions.date],
      set: { overrideName },
    })
    .run();
}

/** Renames a whole habit (one-off tasks; repeating ones rename a day with setException). */
export function renameHabit(db: Db, userId: string, habitId: string, name: string): void {
  db.update(habits)
    .set({ name })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}

/** Sets a habit's icon (null = none). Like notes, icons aren't per day. */
export function setHabitIcon(db: Db, userId: string, habitId: string, icon: HabitIcon | null): void {
  db.update(habits)
    .set({ icon })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}

/** Sets a habit's note (null = none). Notes aren't per day, so this never splits a series. */
export function setHabitNote(db: Db, userId: string, habitId: string, note: string | null): void {
  db.update(habits)
    .set({ note })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}

/** Changes a whole series in place. Only for series with no past days. */
export function updateHabit(db: Db, userId: string, habitId: string, habit: NewHabit): void {
  db.update(habits)
    .set(habit)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}

/**
 * "This day and future" edit of a series with past days: ends the old
 * series on `oldEndDate` and starts `next` (which starts the day after) as
 * a new habit linked to it, in the same list and custom-order spot. Exceptions and completions
 * from the new start on move to the new habit. Returns the new habit's id.
 */
export function splitHabit(
  db: Db,
  userId: string,
  habitId: string,
  oldEndDate: string,
  next: NewHabit,
): string | null {
  return db.transaction((tx) => {
    const old = getHabit(tx, userId, habitId);
    if (!old) return null;
    const newId = crypto.randomUUID();
    tx.update(habits)
      .set({ endType: "on_date", endDate: oldEndDate, endCount: null })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .run();
    tx.insert(habits)
      .values({
        id: newId,
        userId,
        previousHabitId: habitId,
        listId: old.listId,
        position: old.position,
        ...next,
      })
      .run();
    tx.update(habitExceptions)
      .set({ habitId: newId })
      .where(and(eq(habitExceptions.habitId, habitId), gte(habitExceptions.date, next.startDate)))
      .run();
    tx.update(completions)
      .set({ habitId: newId })
      .where(and(eq(completions.habitId, habitId), gte(completions.date, next.startDate)))
      .run();
    return newId;
  });
}

/** "This day and future" delete of a series with past days: stop it on `endDate`. */
export function endHabit(db: Db, userId: string, habitId: string, endDate: string): void {
  db.transaction((tx) => {
    if (!getHabit(tx, userId, habitId)) return;
    tx.update(habits)
      .set({ endType: "on_date", endDate, endCount: null })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .run();
    // Days after the new end no longer exist, so their exceptions and ticks go too.
    tx.delete(habitExceptions)
      .where(and(eq(habitExceptions.habitId, habitId), gt(habitExceptions.date, endDate)))
      .run();
    tx.delete(completions)
      .where(
        and(
          eq(completions.habitId, habitId),
          eq(completions.userId, userId),
          gt(completions.date, endDate),
        ),
      )
      .run();
  });
}

/** Removes a habit with no past days (its exceptions and ticks cascade). */
export function deleteHabit(db: Db, userId: string, habitId: string): void {
  db.delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .run();
}

/**
 * Saves a custom order: `orderedIds` (some or all of the user's habits) take
 * the slots they held in the current custom order, in the given order, so
 * reordering one list leaves the others in place. False, and nothing saved,
 * if any id isn't the user's.
 */
export function reorderHabits(db: Db, userId: string, orderedIds: string[]): boolean {
  return db.transaction((tx) => {
    const current = tx
      .select({ id: habits.id })
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(asc(habits.position), asc(habits.createdAt), asc(habits.id))
      .all()
      .map((h) => h.id);
    const next = placeInSlots(current, orderedIds);
    if (!next) return false;
    next.forEach((id, position) => {
      tx.update(habits).set({ position }).where(eq(habits.id, id)).run();
    });
    return true;
  });
}

/** Removes the "only this day" change on `date`, so the day follows the series again. */
export function clearException(db: Db, userId: string, habitId: string, date: string): void {
  if (!getHabit(db, userId, habitId)) return;
  db.delete(habitExceptions)
    .where(and(eq(habitExceptions.habitId, habitId), eq(habitExceptions.date, date)))
    .run();
}
