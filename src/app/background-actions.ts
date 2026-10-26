"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { isBackgroundId } from "@/lib/backgrounds";

/** Saves the page background picked from the navbar. Ids must come from the list. */
export async function setBackgroundAction(background: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!isBackgroundId(background)) return { error: "Pick one of the backgrounds." };
  db.update(users).set({ background }).where(eq(users.id, user.id)).run();
  revalidatePath("/", "layout");
  return {};
}
