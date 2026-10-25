import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { createAccount } from "@/db/accounts";
import { DEV_PASSWORD, DEV_USERNAME, isDevAutoSignIn } from "./dev-sign-in";
import { hashSecret } from "./password";
import {
  generateRecoveryCode,
  generateSessionToken,
  hashToken,
  normalizeRecoveryCode,
} from "./tokens";

const COOKIE = "ruchi_session";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  username: string;
  friendCode: string;
  timeZone: string;
  weekStart: "monday" | "sunday";
};

/** Starts a session for `userId` and sets the cookie. Call from a server action. */
export async function startSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  db.insert(sessions)
    .values({
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + maxAge * 1000),
    })
    .run();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

/** Ends the current session (row and cookie). Call from a server action. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Never returns password or recovery hashes. */
const userFields = {
  id: users.id,
  username: users.username,
  friendCode: users.friendCode,
  timeZone: users.timeZone,
  weekStart: users.weekStart,
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  const row = token
    ? db
        .select(userFields)
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(
          and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())),
        )
        .get()
    : undefined;
  if (row) return row;
  return isDevAutoSignIn() ? getOrCreateDevUser() : null;
});

/** The local "dev" account used by DEV_AUTO_SIGNIN; created on first use. */
async function getOrCreateDevUser(): Promise<CurrentUser> {
  const find = () =>
    db.select(userFields).from(users).where(eq(users.username, DEV_USERNAME)).get();
  const existing = find();
  if (existing) return existing;
  createAccount(db, {
    username: DEV_USERNAME,
    passwordHash: await hashSecret(DEV_PASSWORD),
    recoveryCodeHash: await hashSecret(normalizeRecoveryCode(generateRecoveryCode())),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  });
  // Two requests may race to create it; either way it exists now.
  return find()!;
}

/** The signed-in user; redirects to sign-in when there is none. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For sign-in/sign-up pages: signed-in users go straight home. */
export async function redirectIfSignedIn(): Promise<void> {
  if (await getCurrentUser()) redirect("/chronicle");
}

/** Client IP as forwarded by Caddy, used only as a rate-limit key. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
