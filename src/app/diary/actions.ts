"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { listExceptions, setCompletion } from "@/db/completions";
import {
  clearException,
  createHabit,
  deleteHabit,
  endHabit,
  getHabit,
  setException,
  splitHabit,
  updateHabit,
} from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { isEditableDay, planFutureDelete, planFutureEdit, type EditScope } from "@/lib/habit-edit";
import { HABIT_NAME_MAX, readHabitForm, validateHabit } from "@/lib/habit-form";
import { occurrenceOn } from "@/lib/repeat-rule";

export type HabitFormState = { error?: string };

export async function createHabitAction(
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await requireUser();
  const result = validateHabit(readHabitForm(formData), todayIn(user.timeZone));
  if ("error" in result) return { error: result.error };

  createHabit(db, user.id, result.habit);
  revalidatePath("/diary");
  redirect("/diary");
}

/**
 * Ticks or unticks one of today's tasks. "Today" is always the server's idea
 * of the user's local date, so past or future days can't be changed.
 */
export async function toggleCompletionAction(
  habitId: string,
  done: boolean,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const habit = getHabit(db, user.id, habitId);
  if (!habit) return { error: "That task doesn't exist." };

  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  if (!occurrenceOn(habit, today, exceptions)) {
    return { error: "That task isn't on for today." };
  }

  setCompletion(db, user.id, habitId, today, done);
  revalidatePath("/diary");
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

    const plan = planFutureEdit(habit, result.habit.startDate);
    if (!repeating || plan.kind === "replace") {
      updateHabit(db, user.id, habitId, result.habit);
    } else {
      splitHabit(db, user.id, habitId, plan.oldEndDate, result.habit);
    }
  }

  revalidatePath("/diary");
  redirect("/diary");
}

/** Deletes `date` only ("day") or `date` and every later day ("future"). */
export async function deleteHabitAction(
  habitId: string,
  date: string,
  scope: EditScope,
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

  revalidatePath("/diary");
  redirect("/diary");
}
