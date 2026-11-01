import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { coinBalance, recordDayCoins } from "./coins";
import { setCompletion } from "./completions";
import { createHabit } from "./habits";
import { buyRepair, dayHistory, repairOfferFor, streakFor } from "./streak";
import { createTestDb } from "./test-db";

type TestDb = ReturnType<typeof createTestDb>;

function addUser(db: TestDb) {
  const user = createAccount(db, { username: "may", passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  return user.id;
}

const daily: NewHabit = {
  name: "Drink water",
  icon: "water",
  note: null,
  startDate: "2026-10-26",
  frequency: "daily",
  weekdays: null,
  interval: 1,
  monthWeek: null,
  monthWeekday: null,
  endType: "never",
  endDate: null,
  endCount: null,
};

describe("dayHistory", () => {
  it("classifies days from the first repeating habit on, ignoring one-off tasks", () => {
    const db = createTestDb();
    const may = addUser(db);
    const water = createHabit(db, may, daily);
    createHabit(db, may, { ...daily, name: "Call mum", frequency: "none", startDate: "2026-10-20" });
    setCompletion(db, may, water, "2026-10-26", true);

    const history = dayHistory(db, may, "2026-10-28");
    expect(history.earliest).toBe("2026-10-26");
    expect(history.typeOf("2026-10-25")).toBe("empty");
    expect(history.typeOf("2026-10-26")).toBe("complete");
    expect(history.typeOf("2026-10-27")).toBe("missed");
    expect(history.typeOf("2026-10-29")).toBe("empty"); // after today
  });
});

describe("streakFor", () => {
  it("counts complete days ending today or yesterday", () => {
    const db = createTestDb();
    const may = addUser(db);
    const water = createHabit(db, may, daily);
    for (const date of ["2026-10-27", "2026-10-28", "2026-10-29"]) setCompletion(db, may, water, date, true);

    expect(streakFor(db, may, "2026-10-30")).toBe(3); // today not done yet
    setCompletion(db, may, water, "2026-10-30", true);
    expect(streakFor(db, may, "2026-10-30")).toBe(4);
    expect(streakFor(db, may, "2026-10-31")).toBe(4);
    expect(streakFor(db, may, "2026-11-01")).toBe(0); // missed the 31st
  });

  it("is 0 with no habits", () => {
    const db = createTestDb();
    expect(streakFor(db, addUser(db), "2026-10-30")).toBe(0);
  });
});

describe("buyRepair", () => {
  /** Water done Oct 27–29, missed Oct 30; today is Oct 31 (a Saturday). */
  function setUp(coins: number) {
    const db = createTestDb();
    const id = addUser(db);
    const user = { id, weekStart: "monday" as const };
    const water = createHabit(db, id, { ...daily, startDate: "2026-10-27" });
    for (const date of ["2026-10-27", "2026-10-28", "2026-10-29"]) setCompletion(db, id, water, date, true);
    recordDayCoins(db, id, "2026-10-29", coins);
    return { db, user, water };
  }

  it("offers yesterday's miss with the streak it saves", () => {
    const { db, user } = setUp(0);
    expect(streakFor(db, user.id, "2026-10-31")).toBe(0);
    expect(repairOfferFor(db, user, "2026-10-31")).toEqual({ date: "2026-10-30", streak: 3 });
    // The offer ends with the day.
    expect(repairOfferFor(db, user, "2026-11-01")).toBeNull();
  });

  it("needs 100 coins", () => {
    const { db, user } = setUp(99);
    expect(buyRepair(db, user, "2026-10-31")).toEqual({ error: "A repair costs 100 coins." });
    expect(coinBalance(db, user.id)).toBe(99);
  });

  it("takes 100 coins, restores the streak, and only once", () => {
    const { db, user, water } = setUp(130);
    expect(buyRepair(db, user, "2026-10-31")).toEqual({ date: "2026-10-30" });
    expect(coinBalance(db, user.id)).toBe(30);
    expect(dayHistory(db, user.id, "2026-10-31").typeOf("2026-10-30")).toBe("empty");
    expect(streakFor(db, user.id, "2026-10-31")).toBe(3);
    expect(buyRepair(db, user, "2026-10-31")).toEqual({ error: "There's no streak to repair today." });
    expect(coinBalance(db, user.id)).toBe(30);

    // The repaired day neither breaks nor extends the streak.
    setCompletion(db, user.id, water, "2026-10-31", true);
    expect(streakFor(db, user.id, "2026-10-31")).toBe(4);
  });

  it("allows one repair per week", () => {
    const { db, user, water } = setUp(500);
    buyRepair(db, user, "2026-10-31"); // repairs Fri Oct 30
    // Oct 31 done, Nov 1 (Sunday, same week) missed: no second repair.
    setCompletion(db, user.id, water, "2026-10-31", true);
    expect(repairOfferFor(db, user, "2026-11-02")).toBeNull();
  });
});
