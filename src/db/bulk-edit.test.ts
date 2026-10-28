import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { createAccount } from "./accounts";
import { bulkDeleteHabits, bulkMoveHabits } from "./bulk-edit";
import { carryOverDoneDates, completedHabitIds, setCompletion } from "./completions";
import { createHabit, getHabit } from "./habits";
import { createTaskList, setHabitList } from "./task-lists";
import { createTestDb } from "./test-db";

const today = "2026-10-28";

function addUser(db: ReturnType<typeof createTestDb>, username: string) {
  const user = createAccount(db, { username, passwordHash: "p", recoveryCodeHash: "r", timeZone: "UTC" });
  if (!user) throw new Error("username taken");
  return user.id;
}

const habit = (extra: Partial<NewHabit> = {}): NewHabit => ({
  name: "Drink water",
  icon: null,
  note: null,
  startDate: today,
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

describe("bulkDeleteHabits", () => {
  it("deletes new tasks and ends old ones yesterday, keeping past ticks", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const fresh = createHabit(db, may, habit());
    const old = createHabit(db, may, habit({ startDate: "2026-10-01" }));
    setCompletion(db, may, old, "2026-10-20", true);

    expect(bulkDeleteHabits(db, may, [fresh, old], today)).toBe(true);
    expect(getHabit(db, may, fresh)).toBeUndefined();
    expect(getHabit(db, may, old)).toMatchObject({ endType: "on_date", endDate: "2026-10-27" });
    expect(completedHabitIds(db, may, "2026-10-20").has(old)).toBe(true);
  });

  it("deletes an overdue carry-over task outright", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const parcel = createHabit(db, may, habit({ frequency: "none", startDate: "2026-10-20", dueDate: "2026-10-25" }));
    expect(bulkDeleteHabits(db, may, [parcel], today)).toBe(true);
    expect(getHabit(db, may, parcel)).toBeUndefined();
  });

  it("does nothing if any task isn't the user's", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const mine = createHabit(db, may, habit());
    const theirs = createHabit(db, kai, habit());

    expect(bulkDeleteHabits(db, may, [mine, theirs], today)).toBe(false);
    expect(getHabit(db, may, mine)).toBeDefined();
    expect(getHabit(db, kai, theirs)).toBeDefined();
  });
});

describe("bulkMoveHabits", () => {
  it("moves tasks into a list, or out of every list", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const health = createTaskList(db, may, "Health")!;
    const a = createHabit(db, may, habit());
    const b = createHabit(db, may, habit());

    expect(bulkMoveHabits(db, may, [a, b], health)).toBe(true);
    expect([getHabit(db, may, a)?.listId, getHabit(db, may, b)?.listId]).toEqual([health, health]);
    expect(bulkMoveHabits(db, may, [a], null)).toBe(true);
    expect(getHabit(db, may, a)?.listId).toBeNull();
  });

  it("rejects someone else's list or task", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const kaiList = createTaskList(db, kai, "Kai's")!;
    const mayList = createTaskList(db, may, "Mine")!;
    const mine = createHabit(db, may, habit());
    const theirs = createHabit(db, kai, habit());
    setHabitList(db, kai, theirs, kaiList);

    expect(bulkMoveHabits(db, may, [mine], kaiList)).toBe(false);
    expect(bulkMoveHabits(db, may, [mine, theirs], mayList)).toBe(false);
    expect(getHabit(db, may, mine)?.listId).toBeNull();
    expect(getHabit(db, kai, theirs)?.listId).toBe(kaiList);
  });
});

describe("carryOverDoneDates", () => {
  it("maps only carry-over tasks to the day they were ticked", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const parcel = createHabit(db, may, habit({ frequency: "none", dueDate: "2026-10-30" }));
    const water = createHabit(db, may, habit());
    setCompletion(db, may, parcel, today, true);
    setCompletion(db, may, water, today, true);
    expect(carryOverDoneDates(db, may)).toEqual(new Map([[parcel, today]]));
  });
});
