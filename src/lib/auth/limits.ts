import "server-only";
import { RateLimiter } from "@/lib/rate-limit";
import { clientIp } from "./session";

// Kept out of the "use server" files so these can't be called as actions.

const MINUTE = 60_000;
const signUpsPerIp = new RateLimiter(10, 60 * MINUTE);
const attemptsPerIp = new RateLimiter(30, 15 * MINUTE);
const attemptsPerUser = new RateLimiter(10, 15 * MINUTE);

export const TOO_MANY_ATTEMPTS =
  "Too many attempts. Wait 15 minutes and try again.";

/** Counts a password or recovery-code check against the IP and the account. */
export async function allowAttempt(account: string): Promise<boolean> {
  const ipOk = attemptsPerIp.consume(await clientIp());
  const accountOk = attemptsPerUser.consume(account);
  return ipOk && accountOk;
}

/** Call after a successful check so the account's counter starts over. */
export function clearAttempts(account: string): void {
  attemptsPerUser.reset(account);
}

export async function allowSignUp(): Promise<boolean> {
  return signUpsPerIp.consume(await clientIp());
}
