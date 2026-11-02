import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { getItem } from "@/lib/items";
import { createAccount } from "./accounts";
import { setCompletion } from "./completions";
import { createHabit } from "./habits";
import { listInventory } from "./inventory";
import { createTestDb } from "./test-db";
import {
  awardFinishedWeeks,
  awardWeeklyGift,
  lastRewardedWeek,
  markWeeklyGiftRevealed,
  unrevealedWeeklyGifts,
  weeklyGiftsBetween,
} from "./weekly-gifts";

type TestDb = ReturnType<typeof createTestDb>;

function addUser(db: TestDb, username = "may") {
  const user = createAccount(db, { username, passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  return { id: user.id, weekStart: "monday" as const };
}

const daily: NewHabit = {
  name: "Drink water",
  icon: null,
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

describe("awardWeeklyGift", () => {
  it("awards a week's gift once and adds it to the inventory once", () => {
    const db = createTestDb();
    const may = addUser(db).id;
    expect(awardWeeklyGift(db, may, "2026-11-02", "abokado")).toBe(true);
    expect(awardWeeklyGift(db, may, "2026-11-02", "bacon")).toBe(false);
    expect(listInventory(db, may)).toEqual([{ itemId: "abokado", quantity: 1 }]);
    expect(lastRewardedWeek(db, may)).toBe("2026-11-02");
  });
});

describe("awardFinishedWeeks", () => {
  it("rewards each finished week with a complete day, once", () => {
    const db = createTestDb();
    const user = addUser(db);
    const water = createHabit(db, user.id, daily);
    // Week of Nov 2: two complete days. Week of Nov 9: none.
    setCompletion(db, user.id, water, "2026-11-03", true);
    setCompletion(db, user.id, water, "2026-11-05", true);

    awardFinishedWeeks(db, user, "2026-11-08"); // first week not over yet
    expect(unrevealedWeeklyGifts(db, user.id)).toEqual([]);

    awardFinishedWeeks(db, user, "2026-11-17");
    awardFinishedWeeks(db, user, "2026-11-17");
    const gifts = unrevealedWeeklyGifts(db, user.id);
    expect(gifts.map((g) => g.weekStartDate)).toEqual(["2026-11-02"]);
    expect(getItem(gifts[0].itemId)?.category).not.toBe("clothing");
    expect(listInventory(db, user.id)).toEqual([{ itemId: gifts[0].itemId, quantity: 1 }]);
  });

  it("pays nothing for weeks before weekly gifts began", () => {
    const db = createTestDb();
    const user = addUser(db);
    const water = createHabit(db, user.id, daily);
    setCompletion(db, user.id, water, "2026-10-27", true); // week of Oct 26
    awardFinishedWeeks(db, user, "2026-11-03");
    expect(unrevealedWeeklyGifts(db, user.id)).toEqual([]);
  });
});

describe("markWeeklyGiftRevealed", () => {
  it("plays each reveal once, per user", () => {
    const db = createTestDb();
    const may = addUser(db).id;
    const kai = addUser(db, "kai").id;
    awardWeeklyGift(db, may, "2026-11-02", "abokado");
    awardWeeklyGift(db, may, "2026-11-09", "bacon");
    awardWeeklyGift(db, kai, "2026-11-02", "bacon");

    markWeeklyGiftRevealed(db, may, "2026-11-02");
    expect(unrevealedWeeklyGifts(db, may)).toEqual([{ weekStartDate: "2026-11-09", itemId: "bacon" }]);
    expect(unrevealedWeeklyGifts(db, kai)).toHaveLength(1);
  });
});

describe("weeklyGiftsBetween", () => {
  it("places each gift on its week's last day", () => {
    const db = createTestDb();
    const may = addUser(db).id;
    awardWeeklyGift(db, may, "2026-10-26", "abokado"); // shows Nov 1
    awardWeeklyGift(db, may, "2026-11-23", "bacon"); // shows Nov 29
    awardWeeklyGift(db, may, "2026-11-30", "bacon"); // shows Dec 6
    expect(weeklyGiftsBetween(db, may, "2026-11-01", "2026-11-30")).toEqual([
      { date: "2026-11-01", itemId: "abokado" },
      { date: "2026-11-29", itemId: "bacon" },
    ]);
  });
});
