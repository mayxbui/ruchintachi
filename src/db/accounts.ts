import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { generateFriendCode } from "@/lib/auth/tokens";
import * as schema from "./schema";
import { users } from "./schema";

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
export function deleteAccount(db: Db, userId: string): void {
  db.delete(users).where(eq(users.id, userId)).run();
}
