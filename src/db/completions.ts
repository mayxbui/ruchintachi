import { and, between, eq, isNotNull } from "drizzle-orm";
import type { Db } from "./accounts";
import { completions, habitExceptions, habits } from "./schema";

/** "Only this day" exceptions for all of the user's habits. */
export function listExceptions(db: Db, userId: string) {
  return db
    .select({
      habitId: habitExceptions.habitId,
      date: habitExceptions.date,
      overrideName: habitExceptions.overrideName,
    })
    .from(habitExceptions)
    .innerJoin(habits, eq(habits.id, habitExceptions.habitId))
    .where(eq(habits.userId, userId))
    .all();
}

/** Ids of the user's habits completed on `date`. */
export function completedHabitIds(db: Db, userId: string, date: string): Set<string> {
  const rows = db
    .select({ habitId: completions.habitId })
    .from(completions)
    .where(and(eq(completions.userId, userId), eq(completions.date, date)))
    .all();
  return new Set(rows.map((r) => r.habitId));
}

/** Ids of the user's habits completed on each day from `from` to `to` (inclusive). */
export function completionsBetween(
  db: Db,
  userId: string,
  from: string,
  to: string,
): Map<string, Set<string>> {
  const rows = db
    .select({ habitId: completions.habitId, date: completions.date })
    .from(completions)
    .where(and(eq(completions.userId, userId), between(completions.date, from, to)))
    .all();
  const byDate = new Map<string, Set<string>>();
  for (const { habitId, date } of rows) {
    if (!byDate.has(date)) byDate.set(date, new Set());
    byDate.get(date)!.add(habitId);
  }
  return byDate;
}

/**
 * The day each of the user's carry-over tasks (one-offs with a due date) was
 * ticked, by habit id. Undone ones are missing. See src/lib/due-date.ts.
 */
export function carryOverDoneDates(db: Db, userId: string): Map<string, string> {
  const rows = db
    .select({ habitId: completions.habitId, date: completions.date })
    .from(completions)
    .innerJoin(habits, eq(habits.id, completions.habitId))
    .where(
      and(eq(completions.userId, userId), eq(habits.frequency, "none"), isNotNull(habits.dueDate)),
    )
    .orderBy(completions.date)
    .all();
  const done = new Map<string, string>();
  for (const r of rows) if (!done.has(r.habitId)) done.set(r.habitId, r.date);
  return done;
}

/**
 * Ticks or unticks the habit for `date`. Callers check that the habit is the
 * user's and scheduled that day; the user id is still part of every query.
 * Idempotent: ticking twice keeps one row (and its first timestamp).
 */
export function setCompletion(
  db: Db,
  userId: string,
  habitId: string,
  date: string,
  done: boolean,
): void {
  if (done) {
    db.insert(completions).values({ habitId, userId, date }).onConflictDoNothing().run();
  } else {
    db.delete(completions)
      .where(
        and(
          eq(completions.habitId, habitId),
          eq(completions.userId, userId),
          eq(completions.date, date),
        ),
      )
      .run();
  }
}
