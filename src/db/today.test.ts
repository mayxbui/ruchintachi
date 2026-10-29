import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { setCompletion } from "./completions";
import { createHabit } from "./habits";
import { createTestDb } from "./test-db";
import { todayItems } from "./today";

function addUser(db: ReturnType<typeof createTestDb>, username: string) {
  const user = createAccount(db, { username, passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  return user.id;
}

const habit = (name: string, extra: Partial<NewHabit> = {}): NewHabit => ({
  name,
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
  ...extra,
});

describe("todayItems", () => {
  it("lists today's habits in the chosen order, with what's done", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const water = createHabit(db, may, habit("Water"));
    createHabit(db, may, habit("Read"));
    createHabit(db, may, habit("Gym", { frequency: "weekly", weekdays: [1] })); // Mondays only
    setCompletion(db, may, water, "2026-10-29", true);

    const items = todayItems(db, may, "2026-10-29", "name-asc");
    expect(items.map((i) => [i.name, i.done])).toEqual([
      ["Read", false],
      ["Water", true],
    ]);
  });

  it("carries an undone task with a due date onto today", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    createHabit(db, may, habit("Essay", { frequency: "none", startDate: "2026-10-26", dueDate: "2026-10-27" }));
    createHabit(db, may, habit("Old one-off", { frequency: "none", startDate: "2026-10-26" }));

    expect(todayItems(db, may, "2026-10-29", "name-asc").map((i) => i.name)).toEqual(["Essay"]);
  });

  it("never shows another user's habits", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const pat = addUser(db, "pat");
    createHabit(db, pat, habit("Pat's habit"));
    expect(todayItems(db, may, "2026-10-29", "name-asc")).toEqual([]);
  });
});
