import { occurrencesBetween, type RateOccurrence } from "@/lib/completion-rate";
import type { Db } from "./accounts";
import { completionsBetween, listExceptions } from "./completions";
import { listHabits } from "./habits";

/**
 * The user's repeating-habit occurrences from `from` to `to` (inclusive),
 * each with whether it was done, for the Calendar's completion rings (#24).
 */
export function habitOccurrencesBetween(db: Db, userId: string, from: string, to: string): RateOccurrence[] {
  if (from > to) return [];
  return occurrencesBetween(
    listHabits(db, userId),
    listExceptions(db, userId),
    completionsBetween(db, userId, from, to),
    from,
    to,
  );
}
