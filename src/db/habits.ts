import { asc, eq } from "drizzle-orm";
import type { NewHabit } from "@/lib/habit-form";
import type { Db } from "./accounts";
import { habits } from "./schema";

/** Stores a validated habit for `userId`. Returns its id. */
export function createHabit(db: Db, userId: string, habit: NewHabit): string {
  const id = crypto.randomUUID();
  db.insert(habits).values({ id, userId, ...habit }).run();
  return id;
}

/** The user's own habits, oldest first. Never returns another user's rows. */
export function listHabits(db: Db, userId: string) {
  return db
    .select({
      id: habits.id,
      name: habits.name,
      icon: habits.icon,
      startDate: habits.startDate,
      frequency: habits.frequency,
      weekdays: habits.weekdays,
      endType: habits.endType,
      endDate: habits.endDate,
      endCount: habits.endCount,
    })
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(asc(habits.createdAt), asc(habits.id))
    .all();
}
