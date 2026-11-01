import { eq, getTableColumns, getTableName, is } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { createAccount, deleteAccount } from "./accounts";
import * as schema from "./schema";
import { createTestDb } from "./test-db";

function addUser(db: ReturnType<typeof createTestDb>, username: string) {
  const user = createAccount(db, {
    username,
    passwordHash: "p",
    recoveryCodeHash: "r",
    timeZone: "UTC",
  });
  if (!user) throw new Error("username taken");
  return user.id;
}

/** Gives `userId` one row in every table that holds user data. */
function fillEverything(
  db: ReturnType<typeof createTestDb>,
  userId: string,
  friendId: string,
) {
  const habitId = `habit-${userId}`;
  db.insert(schema.sessions)
    .values({ id: `s-${userId}`, userId, expiresAt: new Date(Date.now() + 1e6) })
    .run();
  db.insert(schema.miis)
    .values({ userId, name: "Mii", appearance: {} })
    .run();
  const listId = `list-${userId}`;
  db.insert(schema.taskLists).values({ id: listId, userId, name: "Health", position: 0 }).run();
  db.insert(schema.habits)
    .values({ id: habitId, userId, name: "Water", startDate: "2026-10-01", frequency: "daily", listId })
    .run();
  db.insert(schema.habitExceptions).values({ habitId, date: "2026-10-02" }).run();
  db.insert(schema.completions).values({ habitId, userId, date: "2026-10-01" }).run();
  db.insert(schema.inventory).values({ userId, itemId: "apple", quantity: 2 }).run();
  db.insert(schema.dailyGifts).values({ userId, date: "2026-10-01", itemId: "apple" }).run();
  db.insert(schema.weeklyRewards)
    .values({ userId, weekStartDate: "2026-09-28", itemId: "hat" })
    .run();
  db.insert(schema.coinLedger).values({ userId, date: "2026-10-01", reason: "day", amount: 24 }).run();
  db.insert(schema.moodLog).values({ userId, date: "2026-10-01", mood: 60 }).run();
  // Friend links in both directions.
  db.insert(schema.friendships)
    .values({ requesterId: userId, addresseeId: friendId, status: "accepted" })
    .run();
}

// Every table in the schema, so a new table is checked automatically.
const userTables: SQLiteTable[] = Object.values(schema).filter((t) =>
  is(t, SQLiteTable),
);

/** Counts rows in every table that mention `userId` in any column. */
function rowsMentioning(db: ReturnType<typeof createTestDb>, userId: string) {
  const found: Record<string, number> = {};
  for (const table of userTables) {
    const rows = db.select().from(table).all() as Record<string, unknown>[];
    const columns = Object.keys(getTableColumns(table));
    const n = rows.filter((row) =>
      columns.some((c) => String(row[c]).includes(userId)),
    ).length;
    if (n > 0) found[getTableName(table)] = n;
  }
  return found;
}

describe("createAccount", () => {
  it("gives each user a friend code and rejects a taken username", () => {
    const db = createTestDb();
    const id = addUser(db, "may");
    const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    expect(user?.friendCode).toMatch(/^\d{4}-\d{4}-\d{4}$/);
    expect(
      createAccount(db, { username: "may", passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" }),
    ).toBeNull();
  });
});

describe("deleteAccount", () => {
  it("removes every row of the user, friend links on both sides, and nothing else", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const zoe = addUser(db, "zoe");
    fillEverything(db, may, kai);
    fillEverything(db, kai, zoe);
    // zoe -> may link, so may is the addressee on one side too.
    db.insert(schema.friendships).values({ requesterId: zoe, addresseeId: may }).run();

    expect(Object.keys(rowsMentioning(db, may)).sort()).toEqual(
      userTables.map(getTableName).sort(),
    );

    deleteAccount(db, may);

    expect(rowsMentioning(db, may)).toEqual({});
    // kai's data is untouched, apart from the friend link to may.
    expect(rowsMentioning(db, kai)).toMatchObject({
      users: 1,
      task_lists: 1,
      habits: 1,
      habit_exceptions: 1,
      completions: 1,
      friendships: 1, // kai -> zoe
    });
  });
});
