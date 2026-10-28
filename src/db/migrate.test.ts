import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { runMigrations } from "./migrate";

let dir: string | undefined;

afterEach(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function tableNames(dbPath: string) {
  const sqlite = new Database(dbPath, { readonly: true });
  const rows = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all() as { name: string }[];
  sqlite.close();
  return rows.map((r) => r.name);
}

describe("runMigrations", () => {
  it("creates the database file and folder and applies every migration", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ruchintachi-migrate-"));
    const dbPath = path.join(dir, "nested", "app.db");

    runMigrations(dbPath, "drizzle");

    const tables = tableNames(dbPath);
    expect(tables).toContain("__drizzle_migrations");
    expect(tables).toContain("users");
  });

  it("is safe to run again on an up-to-date database", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ruchintachi-migrate-"));
    const dbPath = path.join(dir, "app.db");

    runMigrations(dbPath, "drizzle");
    const before = tableNames(dbPath).sort();
    runMigrations(dbPath, "drizzle");

    expect(tableNames(dbPath).sort()).toEqual(before);
  });
});
