import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { setCompletion } from "./completions";
import { createHabit } from "./habits";
import { dayHistory, streakFor } from "./streak";
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
