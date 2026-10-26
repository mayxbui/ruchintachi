"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { completedHabitIds, listExceptions, setCompletion } from "@/db/completions";
import { awardDailyGift, dailyGiftOn } from "@/db/gifts";
import {
  clearException,
  createHabit,
  deleteHabit,
  endHabit,
  getHabit,
  listHabits,
  renameHabit,
  setException,
  setHabitIcon,
  setHabitNote,
  splitHabit,
  updateHabit,
  reorderHabits,
} from "@/db/habits";
import { setSortSettings } from "@/db/accounts";
import { createTaskList, setHabitList } from "@/db/task-lists";
import { requireUser } from "@/lib/auth/session";
import { dailyGiftPool, earnsDailyGift } from "@/lib/daily-gift";
import { todayIn } from "@/lib/dates";
import { rollGift } from "@/lib/gift-roll";
import {
  isEditableDay,
  nextOccurrence,
  planFutureDelete,
  planFutureEdit,
  sameSeries,
  seriesFrom,
  type EditScope,
} from "@/lib/habit-edit";
import { HABIT_NAME_MAX, HABIT_NOTE_MAX, readHabitForm, validateHabit } from "@/lib/habit-form";
import { isHabitIcon } from "@/lib/habit-icons";
import type { Item } from "@/lib/items";
import { occurrenceOn } from "@/lib/repeat-rule";
import { isHabitSort, type HabitSort } from "@/lib/sort-habits";
import { LISTS_MAX, NEW_LIST, validateListName } from "@/lib/task-lists";
import { itemsOn } from "@/lib/today";

export type HabitFormState = { error?: string };

/**
 * Where create/edit/delete send the user afterwards: the tab (and Tasks
 * filter) they came from. Anything else goes to Today.
 */
export type ReturnTo = string;
const backTo = (path: string): ReturnTo =>
  /^\/chronicle(\/tasks(\?list=[\w-]+)?)?$/.test(path) ? path : "/chronicle";

/**
 * The form's list choice: null for no list, or a list id (ownership is
 * checked when it's saved). "+ New list" checks the name and makes the list;
 * call this after the task itself is valid, so a bad task leaves no stray list.
 */
function resolveListId(userId: string, formData: FormData): { listId: string | null } | { error: string } {
  const choice = String(formData.get("listId") ?? "");
  if (choice !== NEW_LIST) return { listId: choice || null };
  const result = validateListName(String(formData.get("newListName") ?? ""));
  if ("error" in result) return result;
  const listId = createTaskList(db, userId, result.name);
  return listId ? { listId } : { error: `You can have up to ${LISTS_MAX} lists.` };
}

export async function createHabitAction(
  returnTo: ReturnTo,
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await requireUser();
  const result = validateHabit(readHabitForm(formData), todayIn(user.timeZone));
  if ("error" in result) return { error: result.error };

  const list = resolveListId(user.id, formData);
  if ("error" in list) return { error: list.error };

  const id = createHabit(db, user.id, result.habit);
  if (list.listId) setHabitList(db, user.id, id, list.listId);
  revalidatePath("/chronicle", "layout");
  redirect(backTo(returnTo));
}

/**
 * Ticks or unticks one of today's tasks. "Today" is always the server's idea
 * of the user's local date, so past or future days can't be changed.
 */
export async function toggleCompletionAction(
  habitId: string,
  done: boolean,
): Promise<{ error?: string; gift?: DailyGift }> {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const habit = getHabit(db, user.id, habitId);
  if (!habit) return { error: "That task doesn't exist." };

  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  if (!occurrenceOn(habit, today, exceptions)) {
    return { error: "That task isn't on for today." };
  }

  setCompletion(db, user.id, habitId, today, done);
  const gift = done ? awardDailyGiftIfEarned(user.id, today) : undefined;
  revalidatePath("/chronicle", "layout");
  return gift ? { gift } : {};
}

export type DailyGift = Pick<Item, "id" | "name" | "sprite">;

/**
 * Awards today's gift once every task scheduled today is done. Returns the
 * gift only when this call awarded it; unticking later never takes it back,
 * and ticking again never rolls a second one.
 */
function awardDailyGiftIfEarned(userId: string, today: string): DailyGift | undefined {
  if (dailyGiftOn(db, userId, today)) return undefined;
  const items = itemsOn(listHabits(db, userId), listExceptions(db, userId), completedHabitIds(db, userId, today), today);
  if (!earnsDailyGift(items)) return undefined;

  const item = rollGift(dailyGiftPool());
  if (!item || !awardDailyGift(db, userId, today, item.id)) return undefined;
  return { id: item.id, name: item.name, sprite: item.sprite };
}

/** Saves the sort menu: the order and whether done tasks drop to the bottom. */
export async function setSortAction(sort: HabitSort, doneLast: boolean): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!isHabitSort(sort) || typeof doneLast !== "boolean") return { error: "Pick a sort order." };
  setSortSettings(db, user.id, sort, doneLast);
  revalidatePath("/chronicle", "layout");
  return {};
}

/** Saves a dragged custom order. Ids that aren't all the user's are rejected. */
export async function reorderHabitsAction(orderedIds: string[]): Promise<{ error?: string }> {
  const user = await requireUser();
  const valid =
    Array.isArray(orderedIds) && orderedIds.length <= 1000 && orderedIds.every((id) => typeof id === "string");
  if (!valid || !reorderHabits(db, user.id, orderedIds)) {
    return { error: "Couldn't save that order. Try again." };
  }
  revalidatePath("/chronicle", "layout");
  return {};
}

export type QuickAddState = { error?: string; added?: number };

/** The quick "Add a task" box on Today: a one-off task for today, made at once. */
export async function quickAddTaskAction(
  _prev: QuickAddState,
  formData: FormData,
): Promise<QuickAddState> {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const result = validateHabit(
    {
      name: String(formData.get("name") ?? ""),
      icon: "",
      note: "",
      startDate: today,
      frequency: "none",
      weekdays: [],
      interval: "",
      monthWeek: "",
      monthWeekday: "",
      endType: "never",
      endDate: "",
      endCount: "",
    },
    today,
  );
  if ("error" in result) return { error: result.error };

  createHabit(db, user.id, result.habit);
  revalidatePath("/chronicle", "layout");
  return { added: Date.now() };
}

/**
 * Renames one of today's tasks in place. A one-off is renamed outright; a
 * repeating task is renamed for today only (the edit page changes the series).
 */
export async function renameTodayAction(habitId: string, rawName: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const found = await editableHabit(habitId, today);
  if ("error" in found) return { error: found.error };
  const { habit } = found;

  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give the task a name." };
  if (name.length > HABIT_NAME_MAX) {
    return { error: `Keep the name to ${HABIT_NAME_MAX} characters or fewer.` };
  }

  if (habit.frequency === "none") renameHabit(db, user.id, habitId, name);
  else if (name === habit.name) clearException(db, user.id, habitId, today);
  else setException(db, user.id, habitId, today, name);
  revalidatePath("/chronicle", "layout");
  return {};
}

/**
 * Renames a task from the Tasks tab: the whole task from its next day on,
 * like "this day and future". A task with past days is split there, so past
 * days keep the old name.
 */
export async function renameSeriesAction(habitId: string, rawName: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const habit = getHabit(db, user.id, habitId);
  if (!habit) return { error: "That task doesn't exist." };
  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  const next = nextOccurrence(habit, exceptions, today);
  if (!next) return { error: "That task has no days left to rename." };

  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give the task a name." };
  if (name.length > HABIT_NAME_MAX) {
    return { error: `Keep the name to ${HABIT_NAME_MAX} characters or fewer.` };
  }

  const plan = planFutureEdit(habit, next);
  if (habit.frequency === "none" || plan.kind === "replace") {
    renameHabit(db, user.id, habitId, name);
  } else {
    const from = seriesFrom(habit, next);
    splitHabit(db, user.id, habitId, plan.oldEndDate, {
      name,
      icon: from.icon && isHabitIcon(from.icon) ? from.icon : null,
      note: from.note,
      startDate: from.startDate,
      frequency: from.frequency,
      weekdays: from.weekdays,
      interval: from.interval,
      monthWeek: from.monthWeek,
      monthWeekday: from.monthWeekday,
      endType: from.endType,
      endDate: from.endDate,
      endCount: from.endCount,
    });
  }
  revalidatePath("/chronicle", "layout");
  return {};
}

/** Changes a task's icon from its row (Today or Tasks). Null removes it. */
export async function setIconAction(habitId: string, icon: string | null): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!getHabit(db, user.id, habitId)) return { error: "That task doesn't exist." };
  if (icon !== null && !isHabitIcon(icon)) return { error: "Pick an icon from the list." };
  setHabitIcon(db, user.id, habitId, icon);
  revalidatePath("/chronicle", "layout");
  return {};
}

/** Edits a task's note in place (Today or Tasks). An empty note removes it. */
export async function setNoteAction(habitId: string, rawNote: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!getHabit(db, user.id, habitId)) return { error: "That task doesn't exist." };
  const note = rawNote.trim();
  if (note.length > HABIT_NOTE_MAX) {
    return { error: `Keep the note to ${HABIT_NOTE_MAX} characters or fewer.` };
  }
  setHabitNote(db, user.id, habitId, note || null);
  revalidatePath("/chronicle", "layout");
  return {};
}

/** Loads one of the user's habits and checks `date` is a day they may change. */
async function editableHabit(habitId: string, date: string) {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const habit = getHabit(db, user.id, habitId);
  if (!habit) return { error: "That task doesn't exist." } as const;
  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  if (!isEditableDay(habit, exceptions, date, today)) {
    return { error: "That day can't be changed. Past days stay as they were." } as const;
  }
  return { user, today, habit } as const;
}

/**
 * Edits a habit from `date`. "day" renames only that date; "future" changes
 * the series from that date on (a one-off habit is always edited whole).
 */
export async function editHabitAction(
  habitId: string,
  date: string,
  scope: EditScope,
  returnTo: ReturnTo,
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const found = await editableHabit(habitId, date);
  if ("error" in found) return { error: found.error };
  const { user, today, habit } = found;
  const repeating = habit.frequency !== "none";

  if (scope === "day" && repeating) {
    const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
    if (!name) return { error: "Give the task a name." };
    if (name.length > HABIT_NAME_MAX) {
      return { error: `Keep the name to ${HABIT_NAME_MAX} characters or fewer.` };
    }
    // Back to the series name: drop the override rather than store a copy.
    if (name === habit.name) clearException(db, user.id, habitId, date);
    else setException(db, user.id, habitId, date, name);
  } else {
    const values = readHabitForm(formData);
    // A repeating series always changes from the chosen day; a one-off can move.
    if (repeating) values.startDate = date;
    const result = validateHabit(values, today);
    if ("error" in result) return { error: result.error };
    const list = resolveListId(user.id, formData);
    if ("error" in list) return { error: list.error };

    // Only the list changed (or nothing): no need to touch, or split, the series.
    let savedId: string | null = habitId;
    if (!sameSeries(result.habit, seriesFrom(habit, date))) {
      const plan = planFutureEdit(habit, result.habit.startDate);
      if (!repeating || plan.kind === "replace") {
        updateHabit(db, user.id, habitId, result.habit);
      } else {
        savedId = splitHabit(db, user.id, habitId, plan.oldEndDate, result.habit);
      }
    }
    if (savedId) setHabitList(db, user.id, savedId, list.listId);
  }

  revalidatePath("/chronicle", "layout");
  redirect(backTo(returnTo));
}

/** Deletes `date` only ("day") or `date` and every later day ("future"). */
export async function deleteHabitAction(
  habitId: string,
  date: string,
  scope: EditScope,
  returnTo: ReturnTo,
): Promise<HabitFormState> {
  const found = await editableHabit(habitId, date);
  if ("error" in found) return { error: found.error };
  const { user, habit } = found;

  if (scope === "day" && habit.frequency !== "none") {
    setException(db, user.id, habitId, date, null);
    setCompletion(db, user.id, habitId, date, false); // a skipped day has nothing to tick
  } else {
    const plan = planFutureDelete(habit, date);
    if (plan.kind === "delete") deleteHabit(db, user.id, habitId);
    else endHabit(db, user.id, habitId, plan.endDate);
  }

  revalidatePath("/chronicle", "layout");
  redirect(backTo(returnTo));
}
