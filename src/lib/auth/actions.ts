"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { createAccount } from "@/db/accounts";
import { sessions, users } from "@/db/schema";
import {
  isValidTimeZone,
  normalizeUsername,
  passwordError,
  usernameError,
} from "./credentials";
import {
  allowAttempt,
  allowSignUp,
  clearAttempts,
  TOO_MANY_ATTEMPTS,
} from "./limits";
import { dummyVerify, hashSecret, verifySecret } from "./password";
import { endSession, startSession } from "./session";
import { generateRecoveryCode, normalizeRecoveryCode } from "./tokens";

export type AuthState = {
  error?: string;
  username?: string;
  /** Shown once, right after sign-up or a password reset. */
  recoveryCode?: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = normalizeUsername(field(formData, "username"));
  const password = field(formData, "password");
  const timeZone = field(formData, "timeZone");

  const error =
    usernameError(username) ??
    passwordError(password) ??
    (password !== field(formData, "confirm") ? "Passwords don't match." : null);
  if (error) return { error, username };
  if (!(await allowSignUp())) {
    return { error: "Too many sign-ups. Try again in an hour.", username };
  }

  const recoveryCode = generateRecoveryCode();
  const user = createAccount(db, {
    username,
    passwordHash: await hashSecret(password),
    recoveryCodeHash: await hashSecret(normalizeRecoveryCode(recoveryCode)),
    timeZone: isValidTimeZone(timeZone) ? timeZone : "UTC",
  });
  if (!user) return { error: "That username is taken.", username };

  await startSession(user.id);
  return { recoveryCode };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = normalizeUsername(field(formData, "username"));
  const password = field(formData, "password");
  if (!(await allowAttempt(username))) return { error: TOO_MANY_ATTEMPTS, username };

  const user = db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .get();
  const ok = user
    ? await verifySecret(user.passwordHash, password)
    : await dummyVerify(password);
  if (!user || !ok) return { error: "Wrong username or password.", username };

  clearAttempts(username);
  await startSession(user.id);
  redirect("/diary");
}

/** Sets a new password with the recovery code, then issues a new code. */
export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = normalizeUsername(field(formData, "username"));
  const code = normalizeRecoveryCode(field(formData, "code"));
  const password = field(formData, "password");

  const error =
    passwordError(password) ??
    (password !== field(formData, "confirm") ? "Passwords don't match." : null);
  if (error) return { error, username };
  if (!(await allowAttempt(username))) return { error: TOO_MANY_ATTEMPTS, username };

  const user = db
    .select({ id: users.id, recoveryCodeHash: users.recoveryCodeHash })
    .from(users)
    .where(eq(users.username, username))
    .get();
  const ok = user
    ? await verifySecret(user.recoveryCodeHash, code)
    : await dummyVerify(code);
  if (!user || !ok) {
    return { error: "Wrong username or recovery code.", username };
  }

  // The old code is used up: replace it, and sign out every other device.
  const recoveryCode = generateRecoveryCode();
  const passwordHash = await hashSecret(password);
  const recoveryCodeHash = await hashSecret(normalizeRecoveryCode(recoveryCode));
  db.transaction((tx) => {
    tx.update(users)
      .set({ passwordHash, recoveryCodeHash })
      .where(eq(users.id, user.id))
      .run();
    tx.delete(sessions).where(eq(sessions.userId, user.id)).run();
  });

  clearAttempts(username);
  await startSession(user.id);
  return { recoveryCode };
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/sign-in");
}
