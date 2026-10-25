import { and, asc, eq } from "drizzle-orm";
import type { NewHabit } from "@/lib/habit-form";
import type { Db } from "./accounts";
import { habits } from "./schema";

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
