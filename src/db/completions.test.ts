import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { completedHabitIds, listExceptions, setCompletion } from "./completions";
import { createHabit, getHabit } from "./habits";
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

const daily: NewHabit = {
  name: "Drink water",
  icon: "water",
  note: null,
  startDate: "2026-10-01",
  frequency: "daily",
  weekdays: null,
  interval: 1,
  monthWeek: null,
  monthWeekday: null,
  endType: "never",
  endDate: null,
  endCount: null,
};

describe("completions", () => {
  it("ticks and unticks a day; ticking twice keeps one row", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const water = createHabit(db, may, daily);

    setCompletion(db, may, water, "2026-10-26", true);
    setCompletion(db, may, water, "2026-10-26", true);
    expect(db.select().from(schema.completions).all()).toHaveLength(1);
    expect(completedHabitIds(db, may, "2026-10-26")).toEqual(new Set([water]));
    expect(completedHabitIds(db, may, "2026-10-27")).toEqual(new Set());

    setCompletion(db, may, water, "2026-10-26", false);
    expect(completedHabitIds(db, may, "2026-10-26")).toEqual(new Set());
  });

  it("never reads or removes another user's completions", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const kaiWater = createHabit(db, kai, daily);
    setCompletion(db, kai, kaiWater, "2026-10-26", true);

    expect(completedHabitIds(db, may, "2026-10-26")).toEqual(new Set());
    setCompletion(db, may, kaiWater, "2026-10-26", false);
    expect(completedHabitIds(db, kai, "2026-10-26")).toEqual(new Set([kaiWater]));
  });

  it("getHabit only finds the user's own habit", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const water = createHabit(db, may, daily);
    expect(getHabit(db, may, water)?.name).toBe("Drink water");
    expect(getHabit(db, kai, water)).toBeUndefined();
  });

  it("lists exceptions only for the user's habits", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const water = createHabit(db, may, daily);
    const kaiWater = createHabit(db, kai, daily);
    db.insert(schema.habitExceptions)
      .values([
        { habitId: water, date: "2026-10-26", overrideName: "Tea" },
        { habitId: kaiWater, date: "2026-10-26" },
      ])
      .run();
    expect(listExceptions(db, may)).toEqual([
      { habitId: water, date: "2026-10-26", overrideName: "Tea" },
    ]);
  });
});
