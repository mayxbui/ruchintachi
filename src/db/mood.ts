import { desc, eq } from "drizzle-orm";
import { addDays, startOfWeek, todayIn, type WeekStart } from "@/lib/dates";
import {
  MOOD_START,
  clampMood,
  dayMoodChange,
  replayMood,
  type DayHabits,
} from "@/lib/mood";
import { itemsOn } from "@/lib/today";
import type { Db } from "./accounts";
import { completionsBetween, listExceptions } from "./completions";
import { listHabits } from "./habits";
import { moodLog, users } from "./schema";

/** The user's latest end-of-day mood, if any day has been scored. */
export function lastMoodEntry(db: Db, userId: string): { date: string; mood: number } | undefined {
  return db
    .select({ date: moodLog.date, mood: moodLog.mood })
    .from(moodLog)
    .where(eq(moodLog.userId, userId))
    .orderBy(desc(moodLog.date))
    .get();
}

/** Saves end-of-day moods. A day already saved keeps its first value. */
export function saveMoodEntries(db: Db, userId: string, entries: { date: string; mood: number }[]): void {
  if (entries.length === 0) return;
  db.transaction((tx) => {
    for (const { date, mood } of entries) {
      tx.insert(moodLog).values({ userId, date, mood }).onConflictDoNothing().run();
    }
  });
}

/**
 * The Mii's mood right now, 0–100 (#25). Finished days are scored once and
 * kept in `mood_log` (past days can't change, so the log is the history the
 * mood chart reads); days since the last saved one are scored and saved
 * here. Today then adds its lift if every habit is already done.
 */
export function currentMood(
  db: Db,
  user: { id: string; timeZone: string; weekStart: WeekStart },
  now: Date = new Date(),
): number {
  const today = todayIn(user.timeZone, now);
  const yesterday = addDays(today, -1);
  const last = lastMoodEntry(db, user.id);
  let from = last ? addDays(last.date, 1) : signUpDay(db, user.id, user.timeZone);
  if (from > today) from = today; // a clock or time zone change can put the log ahead

  // Only repeating habits move the mood, so carry-over tasks need no scheduling.
  const habits = listHabits(db, user.id).filter((h) => h.frequency !== "none");
  const exceptions = listExceptions(db, user.id);
  const done = completionsBetween(db, user.id, startOfWeek(from, user.weekStart), today);
  const cache = new Map<string, DayHabits>();
  const itemsFor = (date: string): DayHabits => {
    if (!cache.has(date)) cache.set(date, itemsOn(habits, exceptions, done.get(date) ?? new Set(), date));
    return cache.get(date)!;
  };

  const dates: string[] = [];
  for (let date = from; date <= yesterday; date = addDays(date, 1)) dates.push(date);
  const scored = replayMood(last?.mood ?? MOOD_START, dates, itemsFor, user.weekStart);
  saveMoodEntries(db, user.id, scored);

  const endOfYesterday = scored.at(-1)?.mood ?? last?.mood ?? MOOD_START;
  return clampMood(endOfYesterday + dayMoodChange(itemsFor(today), false));
}

/** The user's local date when they signed up. */
function signUpDay(db: Db, userId: string, timeZone: string): string {
  const row = db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return row ? todayIn(timeZone, row.createdAt) : todayIn(timeZone);
}
