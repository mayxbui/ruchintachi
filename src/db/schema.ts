import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { backgroundIds } from "../lib/backgrounds";

// Dates the user sees ("today", a habit's day) are local calendar dates
// stored as "YYYY-MM-DD" text. Instants are unix-ms integers.
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

// Accounts hold no personal information: username + hashes only.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  recoveryCodeHash: text("recovery_code_hash").notNull(),
  friendCode: text("friend_code").notNull().unique(),
  timeZone: text("time_zone").notNull().default("UTC"),
  weekStart: text("week_start", { enum: ["monday", "sunday"] })
    .notNull()
    .default("monday"),
  // How My Chronicle orders tasks (see src/lib/sort-habits.ts).
  taskSort: text("task_sort", {
    enum: ["next", "due", "name-asc", "name-desc", "newest", "oldest", "repeat", "custom"],
  })
    .notNull()
    .default("next"),
  doneLast: integer("done_last", { mode: "boolean" }).notNull().default(true),
  // Page background picked in Settings (#43); see src/lib/backgrounds.ts.
  background: text("background", { enum: backgroundIds }).notNull().default("og"),
  createdAt: createdAt(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // hash of the session token
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

// One row per pair. requester sent the code; addressee accepts.
export const friendships = sqliteTable(
  "friendships",
  {
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted"] })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.requesterId, t.addresseeId] }),
    index("friendships_addressee_idx").on(t.addresseeId),
    check("friendships_not_self", sql`${t.requesterId} <> ${t.addresseeId}`),
  ],
);

// Preset-based Mii. `appearance` is JSON of preset ids and colours.
export const miis = sqliteTable("miis", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  appearance: text("appearance", { mode: "json" }).notNull(),
  outfitItemId: text("outfit_item_id"), // item catalogue id, null = default clothes
  mood: integer("mood").notNull().default(50), // 0–100; 50 = Content
});

// The user's own named task lists (e.g. Health, Study). Private to the owner.
export const taskLists = sqliteTable(
  "task_lists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("task_lists_user_idx").on(t.userId)],
);

// A habit series. "This day and future" edits end one series and start
// a new one linked by previousHabitId.
export const habits = sqliteTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"), // null = no icon
    note: text("note"),
    startDate: text("start_date").notNull(),
    frequency: text("frequency", {
      enum: ["none", "daily", "weekly", "monthly", "annually"],
    }).notNull(),
    weekdays: text("weekdays", { mode: "json" }).$type<number[]>(), // 0=Sun..6=Sat, weekly only
    interval: integer("interval").notNull().default(1), // every N days/weeks/months/years
    // Monthly on the nth weekday (1..4, -1 = last; 0=Sun..6=Sat). Both null = same day of the month.
    monthWeek: integer("month_week"),
    monthWeekday: integer("month_weekday"),
    endType: text("end_type", { enum: ["never", "on_date", "after_count"] })
      .notNull()
      .default("never"),
    endDate: text("end_date"),
    endCount: integer("end_count"),
    // One-off tasks only: a deadline. Until it's ticked the task carries over
    // to each new "today" (see src/lib/due-date.ts).
    dueDate: text("due_date"),
    previousHabitId: text("previous_habit_id"),
    // At most one list. Deleting a list unlists its tasks (done in code:
    // SQLite's ADD COLUMN migration can't carry ON DELETE SET NULL).
    listId: text("list_id").references(() => taskLists.id),
    // The user's own order (the Custom sort). Ties fall back to created date.
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

// "Only this day" edits/deletes. A null overrideName means skipped that day.
export const habitExceptions = sqliteTable(
  "habit_exceptions",
  {
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    overrideName: text("override_name"),
  },
  (t) => [primaryKey({ columns: [t.habitId, t.date] })],
);

export const completions = sqliteTable(
  "completions",
  {
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    completedAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.habitId, t.date] }),
    index("completions_user_date_idx").on(t.userId, t.date),
  ],
);

export const inventory = sqliteTable(
  "inventory",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);

// One gift per user per day; the unique key makes awarding idempotent.
export const dailyGifts = sqliteTable(
  "daily_gifts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    itemId: text("item_id").notNull(),
    awardedAt: createdAt(),
  },
  (t) => [uniqueIndex("daily_gifts_user_date_uq").on(t.userId, t.date)],
);

// One gift per user per week (#27).
export const weeklyRewards = sqliteTable(
  "weekly_rewards",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStartDate: text("week_start_date").notNull(),
    itemId: text("item_id").notNull(),
    awardedAt: createdAt(),
  },
  (t) => [uniqueIndex("weekly_rewards_user_week_uq").on(t.userId, t.weekStartDate)],
);

// Mood at the end of each day, for the mood line chart.
export const moodLog = sqliteTable(
  "mood_log",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    mood: integer("mood").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);

// Coins (#28): one row per user, day and reason. "day" is what that day's
// habits earned (only ever raised); "repair" is a streak repair's cost (#82).
// The balance is the sum. Private to the owner.
export const coinLedger = sqliteTable(
  "coin_ledger",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    reason: text("reason", { enum: ["day", "repair"] }).notNull(),
    amount: integer("amount").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("coin_ledger_user_date_reason_uq").on(t.userId, t.date, t.reason)],
);
