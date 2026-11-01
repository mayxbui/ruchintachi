import { eq } from "drizzle-orm";
import { REPAIR_COST } from "@/lib/coins";
import { addDays, type WeekStart } from "@/lib/dates";
import { currentStreak, dayType, repairOffer, streakEndingAt, type DayHabits, type DayType } from "@/lib/streak";
import { itemsOn } from "@/lib/today";
import type { Db } from "./accounts";
import { coinBalance } from "./coins";
import { completionsBetween, listExceptions } from "./completions";
import { listHabits } from "./habits";
import { coinLedger, streakRepairs } from "./schema";

/** The user's past days, read lazily: what was scheduled and what kind of day it was. */
export interface DayHistory {
  /** The first day any repeating habit was scheduled; earlier days are empty. */
  earliest: string;
  /** Days bought back with a streak repair (#82), oldest first. */
  repaired: string[];
  itemsFor(date: string): DayHabits;
  /** Repaired days count as empty. */
  typeOf(date: string): DayType;
}

/** Dates the user has repaired (#82), oldest first. */
export function listRepairs(db: Db, userId: string): string[] {
  return db
    .select({ date: streakRepairs.date })
    .from(streakRepairs)
    .where(eq(streakRepairs.userId, userId))
    .orderBy(streakRepairs.date)
    .all()
    .map((r) => r.date);
}

/**
 * Loads the user's repeating habits, exceptions, completions and repairs up
 * to `today` once, for the streak, coins, weekly gift and calendar. One-off
 * tasks never count, so carry-over tasks need no scheduling.
 */
export function dayHistory(db: Db, userId: string, today: string): DayHistory {
  const habits = listHabits(db, userId).filter((h) => h.frequency !== "none");
  const earliest = habits.reduce((min, h) => (h.startDate < min ? h.startDate : min), addDays(today, 1));
  const exceptions = listExceptions(db, userId);
  const done = completionsBetween(db, userId, earliest, today);
  const repaired = listRepairs(db, userId);
  const repairedSet = new Set(repaired);
  const cache = new Map<string, DayHabits>();
  const itemsFor = (date: string): DayHabits => {
    if (date > today || date < earliest) return [];
    if (!cache.has(date)) cache.set(date, itemsOn(habits, exceptions, done.get(date) ?? new Set(), date));
    return cache.get(date)!;
  };
  return { earliest, repaired, itemsFor, typeOf: (date) => dayType(itemsFor(date), repairedSet.has(date)) };
}

/** The user's current streak (#35). */
export function streakFor(db: Db, userId: string, today: string): number {
  const history = dayHistory(db, userId, today);
  return currentStreak(today, history.typeOf, history.earliest);
}

/** Today's streak repair offer (#82): the missed day and the streak it saves, or null. */
export function repairOfferFor(
  db: Db,
  user: { id: string; weekStart: WeekStart },
  today: string,
): { date: string; streak: number } | null {
  const history = dayHistory(db, user.id, today);
  const date = repairOffer(today, history.typeOf, history.earliest, history.repaired, user.weekStart);
  if (!date) return null;
  return { date, streak: streakEndingAt(addDays(date, -1), history.typeOf, history.earliest) };
}

/**
 * Buys today's streak repair in one transaction: checks the offer and that
 * the balance covers REPAIR_COST, then adds the −100 ledger row and the
 * repair. Returns the repaired date, or an error.
 */
export function buyRepair(
  db: Db,
  user: { id: string; weekStart: WeekStart },
  today: string,
): { date: string } | { error: string } {
  return db.transaction(() => {
    const offer = repairOfferFor(db, user, today);
    if (!offer) return { error: "There's no streak to repair today." };
    if (coinBalance(db, user.id) < REPAIR_COST) return { error: `A repair costs ${REPAIR_COST} coins.` };
    db.insert(coinLedger)
      .values({ userId: user.id, date: offer.date, reason: "repair", amount: -REPAIR_COST })
      .run();
    db.insert(streakRepairs).values({ userId: user.id, date: offer.date }).run();
    return { date: offer.date };
  });
}
