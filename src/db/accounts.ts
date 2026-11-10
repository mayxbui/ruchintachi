import { eq, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { generateFriendCode } from "@/lib/auth/tokens";
import type { HabitSort } from "@/lib/sort-habits";
import * as schema from "./schema";
import {
  coinLedger,
  completions,
  habitExceptions,
  habits,
  inventory,
  moodLog,
  streakRepairs,
  taskLists,
  users,
  weeklyRewards,
} from "./schema";

// Takes the db as an argument so tests can run against an in-memory copy.
export type Db = BetterSQLite3Database<typeof schema>;

function isUniqueViolation(err: unknown, column: string): boolean {
  return (
    err instanceof Error &&
    /UNIQUE constraint failed/.test(err.message) &&
    err.message.includes(column)
  );
}

/** Creates a user with a fresh friend code. Returns null if the username is taken. */
export function createAccount(
  db: Db,
  input: {
    username: string;
    passwordHash: string;
    recoveryCodeHash: string;
    timeZone: string;
  },
): { id: string; friendCode: string } | null {
  const id = crypto.randomUUID();
  // 10^12 codes, so a clash is rare; retry a few times if one happens.
  for (let attempt = 0; attempt < 5; attempt++) {
    const friendCode = generateFriendCode();
    try {
      db.insert(users).values({ id, friendCode, ...input }).run();
      return { id, friendCode };
    } catch (err) {
      if (isUniqueViolation(err, "users.username")) return null;
      if (!isUniqueViolation(err, "users.friend_code")) throw err;
    }
  }
  throw new Error("Could not generate a unique friend code");
}

/**
 * Deletes the user and every row that belongs to them. All user-owned
 * tables reference users.id with ON DELETE CASCADE (friend links on both
 * sides included), so removing the user row removes everything.
 */
/** Saves how My Chronicle sorts tasks and whether done tasks drop to the bottom. */
export function setSortSettings(db: Db, userId: string, taskSort: HabitSort, doneLast: boolean): void {
  db.update(users).set({ taskSort, doneLast }).where(eq(users.id, userId)).run();
}

export function deleteAccount(db: Db, userId: string): void {
  db.delete(users).where(eq(users.id, userId)).run();
}

/**
 * Starts the user over: deletes their habits and tasks (with lists, skipped
 * days and completions), items, weekly gifts, coins, streak repairs and mood
 * history, in one transaction. Keeps the account itself: username, password,
 * recovery code, friend code, friends, sessions and settings. With no
 * history left, the streak and coins are 0 and the mood starts again at 50.
 */
export function resetAccount(db: Db, userId: string): void {
  db.transaction((tx) => {
    const habitIds = tx.select({ id: habits.id }).from(habits).where(eq(habits.userId, userId)).all().map((h) => h.id);
    if (habitIds.length > 0) {
      tx.delete(habitExceptions).where(inArray(habitExceptions.habitId, habitIds)).run();
      tx.delete(completions).where(inArray(completions.habitId, habitIds)).run();
    }
    tx.delete(completions).where(eq(completions.userId, userId)).run();
    // Habits point at their task list, so they go first.
    tx.delete(habits).where(eq(habits.userId, userId)).run();
    tx.delete(taskLists).where(eq(taskLists.userId, userId)).run();
    tx.delete(inventory).where(eq(inventory.userId, userId)).run();
    tx.delete(weeklyRewards).where(eq(weeklyRewards.userId, userId)).run();
    tx.delete(coinLedger).where(eq(coinLedger.userId, userId)).run();
    tx.delete(streakRepairs).where(eq(streakRepairs.userId, userId)).run();
    tx.delete(moodLog).where(eq(moodLog.userId, userId)).run();
  });
}
