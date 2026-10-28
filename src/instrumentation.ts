// Runs once when the Next.js server starts.
export async function register() {
  // Production only: in dev, keep using `pnpm db:migrate`.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { runMigrations } = await import("./db/migrate");
    runMigrations();
  }
}
