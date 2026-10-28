"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  createTaskList,
  deleteTaskList,
  deleteTaskListAndTasks,
  getTaskList,
  renameTaskList,
} from "@/db/task-lists";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { LISTS_MAX, validateListName } from "@/lib/task-lists";

export type ListFormState = { error?: string; saved?: number };

/** Makes a new list and opens it on the Tasks tab. */
export async function createListAction(
  _prev: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  const user = await requireUser();
  const result = validateListName(String(formData.get("name") ?? ""));
  if ("error" in result) return { error: result.error };

  const id = createTaskList(db, user.id, result.name);
  if (!id) return { error: `You can have up to ${LISTS_MAX} lists.` };
  revalidatePath("/chronicle", "layout");
  redirect(`/chronicle/tasks?list=${id}`);
}

/** Renames one of the user's lists in place (double-click its name on Tasks). */
export async function renameListAction(listId: string, rawName: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!getTaskList(db, user.id, listId)) return { error: "That list doesn't exist." };
  const result = validateListName(typeof rawName === "string" ? rawName : "");
  if ("error" in result) return { error: result.error };

  renameTaskList(db, user.id, listId, result.name);
  revalidatePath("/chronicle", "layout");
  return {};
}

/**
 * Deletes a list. "keep" leaves its tasks, unlisted; "delete" removes them
 * from today on (past days stay in the user's history).
 */
export async function deleteListAction(listId: string, tasks: "keep" | "delete"): Promise<void> {
  const user = await requireUser();
  if (tasks === "delete") deleteTaskListAndTasks(db, user.id, listId, todayIn(user.timeZone));
  else deleteTaskList(db, user.id, listId);
  revalidatePath("/chronicle", "layout");
  redirect("/chronicle/tasks?list=all");
}
