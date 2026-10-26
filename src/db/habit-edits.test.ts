import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { completedHabitIds, listExceptions, setCompletion } from "./completions";
import {
  createHabit,
  clearException,
  deleteHabit,
  endHabit,
  getHabit,
  listHabits,
  renameHabit,
  setException,
  setHabitNote,
  splitHabit,
  updateHabit,
} from "./habits";
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
  name: "Water",
  icon: "water",
  note: null,
  startDate: "2026-10-20",
  frequency: "daily",
  weekdays: null,
  endType: "never",
  endDate: null,
  endCount: null,
};

describe("setException", () => {
  it("renames or skips one day, replacing an earlier exception", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const id = createHabit(db, may, daily);
    setException(db, may, id, "2026-10-26", "Tea");
    setException(db, may, id, "2026-10-26", null);
    expect(listExceptions(db, may)).toEqual([{ habitId: id, date: "2026-10-26", overrideName: null }]);
  });

  it("clearException puts a day back to the series", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const id = createHabit(db, may, daily);
    setException(db, may, id, "2026-10-26", "Tea");
    clearException(db, may, id, "2026-10-26");
    expect(listExceptions(db, may)).toEqual([]);
  });

  it("ignores another user's habit", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const id = createHabit(db, may, daily);
    setException(db, kai, id, "2026-10-26", null);
    expect(listExceptions(db, may)).toEqual([]);
  });
});

describe("splitHabit", () => {
  it("ends the old series, starts a linked new one, and moves later exceptions and ticks", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const old = createHabit(db, may, daily);
    setCompletion(db, may, old, "2026-10-25", true); // past: stays
    setCompletion(db, may, old, "2026-10-26", true); // today: moves
    setException(db, may, old, "2026-10-24", null); // past: stays
    setException(db, may, old, "2026-10-30", "Tea"); // future: moves

    const next = { ...daily, name: "Sparkling water", startDate: "2026-10-26" };
    const newId = splitHabit(db, may, old, "2026-10-25", next)!;

    expect(getHabit(db, may, old)).toMatchObject({ name: "Water", endType: "on_date", endDate: "2026-10-25" });
    const row = db.select().from(schema.habits).where(eq(schema.habits.id, newId)).get();
    expect(row).toMatchObject({ name: "Sparkling water", startDate: "2026-10-26", previousHabitId: old });
    expect(completedHabitIds(db, may, "2026-10-25")).toEqual(new Set([old]));
    expect(completedHabitIds(db, may, "2026-10-26")).toEqual(new Set([newId]));
    expect(listExceptions(db, may)).toEqual(
      expect.arrayContaining([
        { habitId: old, date: "2026-10-24", overrideName: null },
        { habitId: newId, date: "2026-10-30", overrideName: "Tea" },
      ]),
    );
  });

  it("does nothing to another user's habit", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const old = createHabit(db, may, daily);
    expect(splitHabit(db, kai, old, "2026-10-25", { ...daily, startDate: "2026-10-26" })).toBeNull();
    expect(listHabits(db, may)).toHaveLength(1);
    expect(listHabits(db, kai)).toHaveLength(0);
  });
});

describe("endHabit", () => {
  it("keeps days up to the end, drops exceptions and ticks after it", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const id = createHabit(db, may, daily);
    setCompletion(db, may, id, "2026-10-25", true);
    setCompletion(db, may, id, "2026-10-26", true);
    setException(db, may, id, "2026-10-25", "Tea");
    setException(db, may, id, "2026-10-28", null);

    endHabit(db, may, id, "2026-10-25");

    expect(getHabit(db, may, id)).toMatchObject({ endType: "on_date", endDate: "2026-10-25" });
    expect(completedHabitIds(db, may, "2026-10-25")).toEqual(new Set([id]));
    expect(completedHabitIds(db, may, "2026-10-26")).toEqual(new Set());
    expect(listExceptions(db, may)).toEqual([{ habitId: id, date: "2026-10-25", overrideName: "Tea" }]);
  });
});

describe("updateHabit / deleteHabit", () => {
  it("change or remove only the user's own habit", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const id = createHabit(db, may, daily);

    updateHabit(db, kai, id, { ...daily, name: "Hacked" });
    deleteHabit(db, kai, id);
    expect(getHabit(db, may, id)?.name).toBe("Water");

    updateHabit(db, may, id, { ...daily, name: "Tea" });
    expect(getHabit(db, may, id)?.name).toBe("Tea");
    deleteHabit(db, may, id);
    expect(getHabit(db, may, id)).toBeUndefined();
  });
});

describe("setHabitNote", () => {
  it("sets and clears the owner's note only", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const id = createHabit(db, may, daily);
    setHabitNote(db, kai, id, "Hacked");
    expect(getHabit(db, may, id)?.note).toBe(daily.note);
    setHabitNote(db, may, id, "With lemon");
    expect(getHabit(db, may, id)?.note).toBe("With lemon");
    setHabitNote(db, may, id, null);
    expect(getHabit(db, may, id)?.note).toBeNull();
  });
});

describe("renameHabit", () => {
  it("renames the owner's habit only", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const id = createHabit(db, may, { ...daily, frequency: "none" });
    renameHabit(db, kai, id, "Hacked");
    expect(getHabit(db, may, id)?.name).toBe(daily.name);
    renameHabit(db, may, id, "Call grandma");
    expect(getHabit(db, may, id)?.name).toBe("Call grandma");
  });
});
