// Local-testing shortcut: with DEV_AUTO_SIGNIN=true in .env and the app
// running under `pnpm dev`, everyone who has no session is treated as the
// "dev" user. `next build` / `next start` set NODE_ENV=production, so the
// flag does nothing on the server even if it is set there by mistake.

export const DEV_USERNAME = "dev";
// Only ever used for the local dev account, so Settings actions that ask
// for a password (new recovery code, delete account) can be tried too.
export const DEV_PASSWORD = "dev-password";

export function isDevAutoSignIn(
  env: { NODE_ENV?: string; DEV_AUTO_SIGNIN?: string } = process.env,
): boolean {
  return env.NODE_ENV === "development" && env.DEV_AUTO_SIGNIN === "true";
}
