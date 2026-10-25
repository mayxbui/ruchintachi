import { createHash, randomBytes, randomInt } from "node:crypto";

// Session tokens live only in the cookie; the database keeps their hash,
// so a leaked database can't be used to sign in.

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Crockford base32: no I, L, O or U, so codes are easy to copy by hand.
const RECOVERY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A one-time recovery code like "7K2Q-M9XD-4TPA-HB3W" (80 bits). */
export function generateRecoveryCode(): string {
  const chars = Array.from(
    { length: 16 },
    () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
  );
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

/** Accepts the code however it was typed: any case, spaces or dashes, O for 0. */
export function normalizeRecoveryCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

/** Friend codes look like Nintendo's: "1234-5678-9012". */
export function generateFriendCode(): string {
  const digits = Array.from({ length: 12 }, () => randomInt(10)).join("");
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}
