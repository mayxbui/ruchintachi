import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { LISTS_MAX } from "@/lib/task-lists";
import { createAccount, deleteAccount } from "./accounts";
import { completedHabitIds, setCompletion } from "./completions";
import { createHabit, getHabit, listHabits, splitHabit } from "./habits";
import * as schema from "./schema";
import {
  createTaskList,
  deleteTaskList,
  deleteTaskListAndTasks,
  getTaskList,
  listTaskLists,
  renameTaskList,
  setHabitList,
} from "./task-lists";
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
  icon: null,
  note: null,
  startDate: "2026-10-20",
  frequency: "daily",
  weekdays: null,
  interval: 1,
  monthWeek: null,
  monthWeekday: null,
  endType: "never",
  endDate: null,
  endCount: null,
};

describe("task lists", () => {
  it("creates lists in order, owner-only", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const health = createTaskList(db, may, "Health")!;
    const study = createTaskList(db, may, "Study")!;
    createTaskList(db, kai, "Kai's");

    expect(listTaskLists(db, may)).toEqual([
      { id: health, name: "Health" },
      { id: study, name: "Study" },
    ]);
    expect(getTaskList(db, kai, health)).toBeUndefined();
  });

  it(`stops at ${LISTS_MAX} lists`, () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    for (let i = 0; i < LISTS_MAX; i++) expect(createTaskList(db, may, `L${i}`)).not.toBeNull();
    expect(createTaskList(db, may, "One too many")).toBeNull();
  });

  it("renames only the owner's list", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const id = createTaskList(db, may, "Helth")!;
    renameTaskList(db, kai, id, "Hacked");
    expect(getTaskList(db, may, id)?.name).toBe("Helth");
    renameTaskList(db, may, id, "Health");
    expect(getTaskList(db, may, id)?.name).toBe("Health");
  });

  it("deleting a list keeps its tasks, unlisted", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const list = createTaskList(db, may, "Health")!;
    const habit = createHabit(db, may, water);
    setHabitList(db, may, habit, list);

    deleteTaskList(db, kai, list); // not Kai's: nothing happens
    expect(getHabit(db, may, habit)?.listId).toBe(list);

    deleteTaskList(db, may, list);
    expect(listTaskLists(db, may)).toEqual([]);
    expect(getHabit(db, may, habit)).toMatchObject({ name: "Drink water", listId: null });
  });

  it("deleting a list with its tasks removes them from today on, keeping the past", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const today = "2026-10-26";
    const list = createTaskList(db, may, "Health")!;
    const other = createTaskList(db, may, "Study")!;
    const inList = (habit: NewHabit) => {
      const id = createHabit(db, may, habit);
      setHabitList(db, may, id, list);
      return id;
    };
    const started = inList(water); // since 20 Oct: has past days
    const upcoming = inList({ ...water, name: "Later", startDate: "2026-10-30" });
    const finished = inList({ ...water, name: "Done", endType: "on_date", endDate: "2026-10-22" });
    const elsewhere = createHabit(db, may, water);
    setHabitList(db, may, elsewhere, other);
    setCompletion(db, may, started, "2026-10-25", true);
    setCompletion(db, may, started, today, true);

    deleteTaskListAndTasks(db, kai, list, today); // not Kai's: nothing happens
    expect(listHabits(db, may)).toHaveLength(4);

    deleteTaskListAndTasks(db, may, list, today);
    expect(getTaskList(db, may, list)).toBeUndefined();
    expect(getHabit(db, may, upcoming)).toBeUndefined();
    expect(getHabit(db, may, started)).toMatchObject({ endDate: "2026-10-25", listId: null });
    expect(completedHabitIds(db, may, "2026-10-25")).toEqual(new Set([started])); // past stays
    expect(completedHabitIds(db, may, today)).toEqual(new Set());
    expect(getHabit(db, may, finished)).toMatchObject({ endDate: "2026-10-22", listId: null });
    expect(getHabit(db, may, elsewhere)?.listId).toBe(other);
  });

  it("only files a user's task under their own list", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    const mayList = createTaskList(db, may, "Health")!;
    const kaiList = createTaskList(db, kai, "Kai's")!;
    const habit = createHabit(db, may, water);

    setHabitList(db, may, habit, kaiList);
    expect(getHabit(db, may, habit)?.listId).toBeNull();
    setHabitList(db, kai, habit, kaiList);
    expect(getHabit(db, may, habit)?.listId).toBeNull();
    setHabitList(db, may, habit, mayList);
    expect(getHabit(db, may, habit)?.listId).toBe(mayList);
    setHabitList(db, may, habit, null);
    expect(getHabit(db, may, habit)?.listId).toBeNull();
  });

  it("a split series stays in its list", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const list = createTaskList(db, may, "Health")!;
    const habit = createHabit(db, may, water);
    setHabitList(db, may, habit, list);
    const next = splitHabit(db, may, habit, "2026-10-25", { ...water, startDate: "2026-10-26" })!;
    expect(getHabit(db, may, next)?.listId).toBe(list);
  });

  it("account deletion removes the user's lists", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const list = createTaskList(db, may, "Health")!;
    setHabitList(db, may, createHabit(db, may, water), list);
    deleteAccount(db, may);
    expect(db.select().from(schema.taskLists).all()).toEqual([]);
    expect(db.select().from(schema.habits).all()).toEqual([]);
  });
});
