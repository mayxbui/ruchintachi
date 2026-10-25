// Username and password rules. Accounts hold no personal information,
// so the username is the only identifier we keep.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Usernames are case-insensitive; we store them lowercased. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns an error message, or null when the (normalized) username is fine. */
export function usernameError(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only use letters, numbers and underscores.";
  }
  return null;
}

export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (password.length > PASSWORD_MAX) {
    return `Password must be at most ${PASSWORD_MAX} characters.`;
  }
  return null;
}

/** True when `timeZone` is an IANA zone this runtime understands. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
