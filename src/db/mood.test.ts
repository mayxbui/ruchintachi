import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { setCompletion } from "./completions";
import { createHabit, deleteHabit } from "./habits";
import { currentMood, lastMoodEntry } from "./mood";
import * as schema from "./schema";
import { createTestDb } from "./test-db";

type TestDb = ReturnType<typeof createTestDb>;

/** A UTC user who signed up on `signUp`, Monday weeks. */
function addUser(db: TestDb, signUp: string) {
  const user = createAccount(db, { username: "may", passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  db.update(schema.users)
    .set({ createdAt: new Date(`${signUp}T09:00:00Z`) })
    .where(eq(schema.users.id, user.id))
    .run();
  return { id: user.id, timeZone: "UTC", weekStart: "monday" as const };
}

const daily: NewHabit = {
  name: "Drink water",
  icon: "water",
  note: null,
  startDate: "2026-10-26", // a Monday
  frequency: "daily",
  weekdays: null,
  interval: 1,
  monthWeek: null,
  monthWeekday: null,
  endType: "never",
  endDate: null,
  endCount: null,
};

const at = (date: string) => new Date(`${date}T12:00:00Z`);

describe("currentMood", () => {
  it("starts at Content with nothing to score", () => {
    const db = createTestDb();
    const user = addUser(db, "2026-10-26");
    expect(currentMood(db, user, at("2026-10-26"))).toBe(50);
    expect(lastMoodEntry(db, user.id)).toBeUndefined();
  });

  it("scores finished days, saves them, and lifts today once it's complete", () => {
    const db = createTestDb();
    const user = addUser(db, "2026-10-26");
    const water = createHabit(db, user.id, daily);
    setCompletion(db, user.id, water, "2026-10-26", true);
    // 27th missed; 28th is today and not done yet.
    expect(currentMood(db, user, at("2026-10-28"))).toBe(50 + 8 - 4);
    expect(lastMoodEntry(db, user.id)).toEqual({ date: "2026-10-27", mood: 54 });

    setCompletion(db, user.id, water, "2026-10-28", true);
    expect(currentMood(db, user, at("2026-10-28"))).toBe(62);
  });

  it("keeps finished days as saved, even if the habit is deleted later", () => {
    const db = createTestDb();
    const user = addUser(db, "2026-10-26");
    const water = createHabit(db, user.id, daily);
    setCompletion(db, user.id, water, "2026-10-26", true);
    expect(currentMood(db, user, at("2026-10-27"))).toBe(58);

    deleteHabit(db, user.id, water);
    expect(currentMood(db, user, at("2026-10-27"))).toBe(58);
  });

  it("adds the perfect-week bonus when the week ends", () => {
    const db = createTestDb();
    const user = addUser(db, "2026-10-26");
    const water = createHabit(db, user.id, daily);
    for (let day = 26; day <= 31; day++) setCompletion(db, user.id, water, `2026-10-${day}`, true);
    setCompletion(db, user.id, water, "2026-11-01", true);
    // Seven complete days (7 × 8 = 56) and the bonus (12), capped at 100.
    expect(currentMood(db, user, at("2026-11-02"))).toBe(100);
    expect(lastMoodEntry(db, user.id)).toEqual({ date: "2026-11-01", mood: 100 });
  });

  it("days without habits don't move the mood", () => {
    const db = createTestDb();
    const user = addUser(db, "2026-10-20");
    createHabit(db, user.id, daily); // starts on the 26th
    expect(currentMood(db, user, at("2026-10-26"))).toBe(50);
    expect(lastMoodEntry(db, user.id)).toEqual({ date: "2026-10-25", mood: 50 });
  });
});
