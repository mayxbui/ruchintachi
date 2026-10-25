"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { listExceptions, setCompletion } from "@/db/completions";
import { createHabit, getHabit } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { readHabitForm, validateHabit } from "@/lib/habit-form";
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
