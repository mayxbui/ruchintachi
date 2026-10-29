import { occurrencesBetween, type RateOccurrence } from "@/lib/completion-rate";
import { scheduleAll } from "@/lib/due-date";
import type { Db } from "./accounts";
import { carryOverDoneDates, completionsBetween, listExceptions } from "./completions";
import { listHabits } from "./habits";

/**
 * The user's habit and task occurrences from `from` to `today` (inclusive),
 * each with whether it was done, for the Mii page's completion rings (#24).
 * Carry-over tasks sit on the day they were ticked, or today.
 */
export function habitOccurrencesBetween(db: Db, userId: string, from: string, today: string): RateOccurrence[] {
  if (from > today) return [];
  return occurrencesBetween(
    scheduleAll(listHabits(db, userId), today, carryOverDoneDates(db, userId)),
    listExceptions(db, userId),
    completionsBetween(db, userId, from, today),
    from,
    today,
  );
}
