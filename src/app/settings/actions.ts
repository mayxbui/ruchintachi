"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { deleteAccount, resetAccount } from "@/db/accounts";
import { users } from "@/db/schema";
import { isValidTimeZone } from "@/lib/auth/credentials";
import { allowAttempt, clearAttempts, TOO_MANY_ATTEMPTS } from "@/lib/auth/limits";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { endSession, requireUser, type CurrentUser } from "@/lib/auth/session";
import { generateRecoveryCode, normalizeRecoveryCode } from "@/lib/auth/tokens";

export type SettingsState = {
  error?: string;
  saved?: boolean;
  recoveryCode?: string;
};

/** Re-checks the password before a sensitive change. Returns an error or null. */
async function checkPassword(user: CurrentUser, password: string) {
  if (!(await allowAttempt(user.username))) return TOO_MANY_ATTEMPTS;
  const row = db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .get();
  if (!row || !(await verifySecret(row.passwordHash, password))) {
    return "That password isn't right.";
  }
  clearAttempts(user.username);
  return null;
}

export async function updatePreferences(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const timeZone = String(formData.get("timeZone") ?? "");
  const weekStart = formData.get("weekStart");
  if (!isValidTimeZone(timeZone)) return { error: "Pick a time zone from the list." };
  if (weekStart !== "monday" && weekStart !== "sunday") {
    return { error: "Pick Monday or Sunday." };
  }

  db.update(users).set({ timeZone, weekStart }).where(eq(users.id, user.id)).run();
  revalidatePath("/", "layout");
  return { saved: true };
}

/** Replaces the recovery code; the old one stops working. */
export async function regenerateRecoveryCode(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const error = await checkPassword(user, String(formData.get("password") ?? ""));
  if (error) return { error };

  const recoveryCode = generateRecoveryCode();
  db.update(users)
    .set({ recoveryCodeHash: await hashSecret(normalizeRecoveryCode(recoveryCode)) })
    .where(eq(users.id, user.id))
    .run();
  return { recoveryCode };
}

/**
 * Starts the account over (see resetAccount): needs the username typed out
 * and the password, like deleting. Keeps the account, friends and settings.
 */
export async function resetAccountAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const typed = String(formData.get("confirmUsername") ?? "").trim().toLowerCase();
  if (typed !== user.username) {
    return { error: "Type your username exactly to confirm." };
  }
  const error = await checkPassword(user, String(formData.get("password") ?? ""));
  if (error) return { error };

  resetAccount(db, user.id);
  // Streak, coins and mood change on every page.
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteAccountAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const typed = String(formData.get("confirmUsername") ?? "").trim().toLowerCase();
  if (typed !== user.username) {
    return { error: "Type your username exactly to confirm." };
  }
  const error = await checkPassword(user, String(formData.get("password") ?? ""));
  if (error) return { error };

  deleteAccount(db, user.id);
  await endSession();
  redirect("/sign-up");
}
