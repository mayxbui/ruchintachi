import { and, eq, sql } from "drizzle-orm";
import { coinsForDay } from "@/lib/coins";
import { currentStreak } from "@/lib/streak";
import type { Db } from "./accounts";
import { coinLedger } from "./schema";
import { dayHistory } from "./streak";

/** The user's coins: the sum of their ledger. */
export function coinBalance(db: Db, userId: string): number {
  return (
    db
      .select({ total: sql<number>`coalesce(sum(${coinLedger.amount}), 0)` })
      .from(coinLedger)
      .where(eq(coinLedger.userId, userId))
      .get()?.total ?? 0
  );
}

/**
 * Raises what `date` has earned to `total` and returns the coins gained.
 * Never lowers it: unticking keeps the coins, and ticking again never pays twice.
 */
export function recordDayCoins(db: Db, userId: string, date: string, total: number): number {
  return db.transaction((tx) => {
    const stored =
      tx
        .select({ amount: coinLedger.amount })
        .from(coinLedger)
        .where(and(eq(coinLedger.userId, userId), eq(coinLedger.date, date), eq(coinLedger.reason, "day")))
        .get()?.amount ?? 0;
    if (total <= stored) return 0;
    tx.insert(coinLedger)
      .values({ userId, date, reason: "day", amount: total })
      .onConflictDoUpdate({
        target: [coinLedger.userId, coinLedger.date, coinLedger.reason],
        set: { amount: total },
      })
      .run();
    return total - stored;
  });
}

/** Pays what today's habits have earned so far (#28); returns the coins gained. */
export function earnTodayCoins(db: Db, userId: string, today: string): number {
  const history = dayHistory(db, userId, today);
  const streak = currentStreak(today, history.typeOf, history.earliest);
  return recordDayCoins(db, userId, today, coinsForDay(history.itemsFor(today), streak));
}
