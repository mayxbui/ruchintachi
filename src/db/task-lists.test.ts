import { describe, expect, it } from "vitest";
import type { NewHabit } from "@/lib/habit-form";
import { LISTS_MAX } from "@/lib/task-lists";
import { createAccount, deleteAccount } from "./accounts";
import { createHabit, getHabit, splitHabit } from "./habits";
import * as schema from "./schema";
import {
  createTaskList,
  deleteTaskList,
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
