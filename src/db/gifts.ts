import { and, asc, between, eq, sql } from "drizzle-orm";
import type { Db } from "./accounts";
import { dailyGifts, inventory } from "./schema";

/**
 * Gives the user `itemId` as the gift for `date` and adds it to their
 * inventory, in one transaction. Idempotent: the unique (user, date) key
 * means a day's gift is awarded once; later calls change nothing and
 * return false.
 */
export function awardDailyGift(db: Db, userId: string, date: string, itemId: string): boolean {
  return db.transaction((tx) => {
    const { changes } = tx
      .insert(dailyGifts)
      .values({ userId, date, itemId })
      .onConflictDoNothing()
      .run();
    if (changes === 0) return false;

    tx.insert(inventory)
      .values({ userId, itemId, quantity: 1 })
      .onConflictDoUpdate({
        target: [inventory.userId, inventory.itemId],
        set: { quantity: sql`${inventory.quantity} + 1` },
      })
      .run();
    return true;
  });
}

/** The id of the item the user was given on `date`, if any. */
export function dailyGiftOn(db: Db, userId: string, date: string): string | undefined {
  return db
    .select({ itemId: dailyGifts.itemId })
    .from(dailyGifts)
    .where(and(eq(dailyGifts.userId, userId), eq(dailyGifts.date, date)))
    .get()?.itemId;
}

/** The user's daily gifts from `from` to `to` (inclusive), oldest first. For the calendar. */
export function dailyGiftsBetween(
  db: Db,
  userId: string,
  from: string,
  to: string,
): { date: string; itemId: string }[] {
  return db
    .select({ date: dailyGifts.date, itemId: dailyGifts.itemId })
    .from(dailyGifts)
    .where(and(eq(dailyGifts.userId, userId), between(dailyGifts.date, from, to)))
    .orderBy(asc(dailyGifts.date))
    .all();
}
