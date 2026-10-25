import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const dbPath = process.env.DATABASE_PATH ?? "./data/ruchintachi.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: dbPath },
});
