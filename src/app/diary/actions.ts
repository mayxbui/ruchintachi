"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { createHabit } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { readHabitForm, validateHabit } from "@/lib/habit-form";

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
