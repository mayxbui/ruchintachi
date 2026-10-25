import { and, asc, eq, gt, gte } from "drizzle-orm";
import type { NewHabit } from "@/lib/habit-form";
import type { Db } from "./accounts";
import { completions, habitExceptions, habits } from "./schema";

/** Stores a validated habit for `userId`. Returns its id. */
export function createHabit(db: Db, userId: string, habit: NewHabit): string {
  const id = crypto.randomUUID();
  db.insert(habits).values({ id, userId, ...habit }).run();
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
  endType: habits.endType,
  endDate: habits.endDate,
  endCount: habits.endCount,
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
 * a new habit linked to it. Exceptions and completions from the new start
 * on move to the new habit. Returns the new habit's id.
 */
export function splitHabit(
  db: Db,
  userId: string,
  habitId: string,
  oldEndDate: string,
  next: NewHabit,
): string | null {
  return db.transaction((tx) => {
    if (!getHabit(tx, userId, habitId)) return null;
    const newId = crypto.randomUUID();
    tx.update(habits)
      .set({ endType: "on_date", endDate: oldEndDate, endCount: null })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .run();
    tx.insert(habits).values({ id: newId, userId, previousHabitId: habitId, ...next }).run();
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

/** Removes the "only this day" change on `date`, so the day follows the series again. */
export function clearException(db: Db, userId: string, habitId: string, date: string): void {
  if (!getHabit(db, userId, habitId)) return;
  db.delete(habitExceptions)
    .where(and(eq(habitExceptions.habitId, habitId), eq(habitExceptions.date, date)))
    .run();
}
