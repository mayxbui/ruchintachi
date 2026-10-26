import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { createHabit, listHabits } from "./habits";
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

const water: NewHabit = {
  name: "Drink water",
  icon: "water",
  note: "After lunch",
  startDate: "2026-10-25",
  frequency: "weekly",
  weekdays: [1, 3],
  endType: "after_count",
  endDate: null,
  endCount: 10,
};

describe("habits", () => {
  it("stores a habit and reads it back, weekdays included", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const id = createHabit(db, may, water);
    expect(listHabits(db, may)).toEqual([{ id, ...water, listId: null }]);
  });

  it("lists only the user's own habits", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    createHabit(db, may, water);
    createHabit(db, kai, { ...water, name: "Run" });
    expect(listHabits(db, may).map((h) => h.name)).toEqual(["Drink water"]);
    expect(listHabits(db, kai).map((h) => h.name)).toEqual(["Run"]);
  });
});
