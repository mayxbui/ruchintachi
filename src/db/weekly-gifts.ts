import { and, asc, between, desc, eq, isNull, sql } from "drizzle-orm";
import { addDays, type WeekStart } from "@/lib/dates";
import { rollWeeklyGift, weeklyGiftPool, weeksDue } from "@/lib/weekly-gift";
import type { Db } from "./accounts";
import { inventory, weeklyRewards } from "./schema";
import { dayHistory } from "./streak";

/**
 * Gives the user `itemId` as the gift for the week starting `weekStartDate`
 * and adds it to their inventory, in one transaction. Idempotent: the unique
 * (user, week) key means a week's gift is awarded once; later calls change
 * nothing and return false.
 */
export function awardWeeklyGift(db: Db, userId: string, weekStartDate: string, itemId: string): boolean {
  return db.transaction((tx) => {
    const { changes } = tx
      .insert(weeklyRewards)
      .values({ userId, weekStartDate, itemId })
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

/** Start date of the user's latest rewarded week, if any. */
export function lastRewardedWeek(db: Db, userId: string): string | undefined {
  return db
    .select({ week: weeklyRewards.weekStartDate })
    .from(weeklyRewards)
    .where(eq(weeklyRewards.userId, userId))
    .orderBy(desc(weeklyRewards.weekStartDate))
    .get()?.week;
}

/**
 * Awards the gift for every finished week not yet rewarded (#27), rolled
 * once per complete day in it. A week with no complete days gets nothing.
 * Run when the user opens My Chronicle.
 */
export function awardFinishedWeeks(
  db: Db,
  user: { id: string; weekStart: WeekStart },
  today: string,
  random: () => number = Math.random,
): void {
  const weeks = weeksDue(today, user.weekStart, lastRewardedWeek(db, user.id));
  if (weeks.length === 0) return;
  const history = dayHistory(db, user.id, today);
  const pool = weeklyGiftPool();
  for (const week of weeks) {
    let completeDays = 0;
    for (let i = 0; i < 7; i++) if (history.typeOf(addDays(week, i)) === "complete") completeDays++;
    const item = rollWeeklyGift(completeDays, pool, random);
    if (item) awardWeeklyGift(db, user.id, week, item.id);
  }
}

/** Gifts whose reveal hasn't played yet, oldest first. */
export function unrevealedWeeklyGifts(db: Db, userId: string): { weekStartDate: string; itemId: string }[] {
  return db
    .select({ weekStartDate: weeklyRewards.weekStartDate, itemId: weeklyRewards.itemId })
    .from(weeklyRewards)
    .where(and(eq(weeklyRewards.userId, userId), isNull(weeklyRewards.revealedAt)))
    .orderBy(asc(weeklyRewards.weekStartDate))
    .all();
}

/** Marks a week's gift as revealed, so its reveal plays only once. */
export function markWeeklyGiftRevealed(db: Db, userId: string, weekStartDate: string): void {
  db.update(weeklyRewards)
    .set({ revealedAt: new Date() })
    .where(
      and(
        eq(weeklyRewards.userId, userId),
        eq(weeklyRewards.weekStartDate, weekStartDate),
        isNull(weeklyRewards.revealedAt),
      ),
    )
    .run();
}

/**
 * The user's weekly gifts shown on the calendar, each on its week's last
 * day, for last days from `from` to `to` (inclusive), oldest first.
 */
export function weeklyGiftsBetween(db: Db, userId: string, from: string, to: string): { date: string; itemId: string }[] {
  return db
    .select({ weekStartDate: weeklyRewards.weekStartDate, itemId: weeklyRewards.itemId })
    .from(weeklyRewards)
    .where(and(eq(weeklyRewards.userId, userId), between(weeklyRewards.weekStartDate, addDays(from, -6), addDays(to, -6))))
    .orderBy(asc(weeklyRewards.weekStartDate))
    .all()
    .map(({ weekStartDate, itemId }) => ({ date: addDays(weekStartDate, 6), itemId }));
}
