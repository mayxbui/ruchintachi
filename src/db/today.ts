import { scheduleAll } from "@/lib/due-date";
import { sortHabits, type HabitSort } from "@/lib/sort-habits";
import { itemsOn, type DayItem } from "@/lib/today";
import type { Db } from "./accounts";
import { carryOverDoneDates, completedHabitIds, listExceptions } from "./completions";
import { listHabits } from "./habits";

/**
 * Today's checklist in the user's sort order: carry-over tasks moved onto
 * today (or the day they were ticked), then every occurrence scheduled
 * `today` with whether it's done. The Today tab and /widget (#65) share it.
 */
export function todayItems(db: Db, userId: string, today: string, sort: HabitSort): DayItem[] {
  // Everything on today's list is due today, so "Next due" falls back to name.
  const habits = sortHabits(
    scheduleAll(listHabits(db, userId), today, carryOverDoneDates(db, userId)).map((h) => ({
      ...h,
      next: today,
    })),
    sort,
  );
  return itemsOn(habits, listExceptions(db, userId), completedHabitIds(db, userId, today), today);
}
