import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

/**
 * Apply any pending migrations from `drizzle/` to the database at `dbPath`.
 * Runs once at production server start (see src/instrumentation.ts), so the
 * VM doesn't need drizzle-kit. Uses its own connection because ./index
 * imports "server-only", which instrumentation can't load.
 */
export function runMigrations(
  dbPath = process.env.DATABASE_PATH ?? "./data/ruchintachi.db",
  migrationsFolder = path.join(process.cwd(), "drizzle"),
) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  try {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    migrate(drizzle(sqlite), { migrationsFolder });
  } finally {
    sqlite.close();
  }
}
