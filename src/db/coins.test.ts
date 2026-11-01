import { describe, expect, it } from "vitest";
import { createAccount } from "./accounts";
import { coinBalance, earnTodayCoins, recordDayCoins } from "./coins";
import { setCompletion } from "./completions";
import { createHabit } from "./habits";
import { createTestDb } from "./test-db";

function addUser(db: ReturnType<typeof createTestDb>, username: string) {
  const user = createAccount(db, { username, passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  return user.id;
}

describe("recordDayCoins", () => {
  it("only ever raises a day's coins and returns the gain", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    expect(coinBalance(db, may)).toBe(0);

    expect(recordDayCoins(db, may, "2026-11-01", 2)).toBe(2);
    expect(recordDayCoins(db, may, "2026-11-01", 24)).toBe(22);
    // Unticking (a lower total) keeps the coins; re-ticking pays nothing new.
    expect(recordDayCoins(db, may, "2026-11-01", 2)).toBe(0);
    expect(recordDayCoins(db, may, "2026-11-01", 24)).toBe(0);
    expect(coinBalance(db, may)).toBe(24);
  });

  it("sums days and keeps users apart", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    recordDayCoins(db, may, "2026-11-01", 24);
    recordDayCoins(db, may, "2026-11-02", 30);
    recordDayCoins(db, kai, "2026-11-01", 4);
    expect(coinBalance(db, may)).toBe(54);
    expect(coinBalance(db, kai)).toBe(4);
  });
});

describe("earnTodayCoins", () => {
  it("pays today's habits with the streak bonus, once", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const habit = {
      name: "Water",
      icon: null,
      note: null,
      startDate: "2026-10-30",
      frequency: "daily" as const,
      weekdays: null,
      interval: 1,
      monthWeek: null,
      monthWeekday: null,
      endType: "never" as const,
      endDate: null,
      endCount: null,
    };
    const water = createHabit(db, may, habit);
    const walk = createHabit(db, may, { ...habit, name: "Walk" });
    setCompletion(db, may, water, "2026-10-31", true);
    setCompletion(db, may, walk, "2026-10-31", true);

    setCompletion(db, may, water, "2026-11-01", true);
    expect(earnTodayCoins(db, may, "2026-11-01")).toBe(2);
    setCompletion(db, may, walk, "2026-11-01", true);
    // 4 for two habits, 20 for the complete day, 4 for a 2-day streak.
    expect(earnTodayCoins(db, may, "2026-11-01")).toBe(26);
    expect(earnTodayCoins(db, may, "2026-11-01")).toBe(0);
    expect(coinBalance(db, may)).toBe(28);
  });
});
