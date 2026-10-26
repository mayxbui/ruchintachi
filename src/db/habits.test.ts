import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { createHabit, getHabit, listHabits, reorderHabits, splitHabit } from "./habits";
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
    expect(listHabits(db, may)).toEqual([
      { id, ...water, listId: null, position: 0, createdAt: expect.any(Date) },
    ]);
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

describe("custom order", () => {
  const order = (db: ReturnType<typeof createTestDb>, userId: string) =>
    listHabits(db, userId)
      .sort((a, b) => a.position - b.position)
      .map((h) => h.name);

  it("puts new habits at the end, per user", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const a = createHabit(db, may, { ...water, name: "A" });
    const b = createHabit(db, may, { ...water, name: "B" });
    const k = createHabit(db, kai, { ...water, name: "K" });
    expect(getHabit(db, may, a)?.position).toBe(0);
    expect(getHabit(db, may, b)?.position).toBe(1);
    expect(getHabit(db, kai, k)?.position).toBe(0);
  });

  it("reorders all or some habits, keeping the others' slots", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const [a, b, c, d] = ["A", "B", "C", "D"].map((name) => createHabit(db, may, { ...water, name }));
    expect(reorderHabits(db, may, [d, c, b, a])).toBe(true);
    expect(order(db, may)).toEqual(["D", "C", "B", "A"]);
    // Only C and A shown (say, one list): swap them; D and B stay put.
    expect(reorderHabits(db, may, [a, c])).toBe(true);
    expect(order(db, may)).toEqual(["D", "A", "B", "C"]);
  });

  it("rejects another user's habit and saves nothing", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const a = createHabit(db, may, { ...water, name: "A" });
    const b = createHabit(db, may, { ...water, name: "B" });
    const k = createHabit(db, kai, { ...water, name: "K" });
    expect(reorderHabits(db, may, [b, k, a])).toBe(false);
    expect(order(db, may)).toEqual(["A", "B"]);
  });

  it("a split keeps the habit's spot", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const a = createHabit(db, may, { ...water, name: "A", frequency: "daily", weekdays: null });
    createHabit(db, may, { ...water, name: "B" });
    reorderHabits(db, may, [a]); // no-op order, positions now 0 and 1
    const next = splitHabit(db, may, a, "2026-10-27", { ...water, name: "A2", startDate: "2026-10-28" })!;
    expect(getHabit(db, may, next)?.position).toBe(getHabit(db, may, a)?.position);
  });
});
