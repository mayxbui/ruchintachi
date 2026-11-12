# RuchinTachi contributor guide

RuchinTachi is a habit planner and tracker inspired by Tomodachi Life. See [README.md](README.md) for setup, contribution instructions, and asset credits.

## Before implementing

1. Read the relevant route, data layer, and tests. For Next.js changes, consult the installed documentation under `node_modules/next/dist/docs`.
2. Get maintainer approval for the implementation plan before writing code.
3. Create a feature branch. Verify the diff and checks before publishing or merging.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, layouts, and server actions |
| `src/components/` | Shared UI, including navigation and the Getting Started guide |
| `src/lib/` | Domain logic, authentication helpers, and Vitest unit tests |
| `src/db/` | Drizzle schema, SQLite queries, and database tests |
| `src/data/` | Generated treasure catalogue and player-facing changelog |
| `drizzle/` | Generated SQL migrations and snapshots |
| `scripts/`, `deploy/` | Catalogue and sprite tools, deployment, and backups |

## Examples

- **Repeat rule changes.** Start with the recurrence logic and its Vitest coverage in `src/lib/`. For a monthly habit starting January 31, check what happens in February and that March follows the same rule. When testing an edit to this day and future, verify that the earlier series and its completion rows are preserved.
- **Schema changes.** Edit `src/db/schema.ts`, run `pnpm db:generate`, review the generated SQL, then run `pnpm db:migrate` against a disposable database. Include the generated files with the schema change.
- **Friend progress.** For any Town query, verify that a pending request and a disabled share-progress flag both prevent access to progress numbers. For an accepted friend with sharing enabled, assert the response contains only the computed percentage and streak for progress.
- **UI changes.** Check the phone layout with the bottom navigation and timer visible, then check desktop. For a new interactive control, verify that it can be reached and used with a keyboard.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · SQLite + Drizzle ORM · Argon2 password hashing with cookie sessions · Vitest. Package manager: **pnpm** (never mix in npm/yarn lockfiles). Deployed to an Azure VM behind Caddy, run with systemd. Everything must stay free; don't add paid services.

## Git/GitHub

Always:
- create issues for ideas, fixes
- create new branch for new feature
- get approved by @mayxbui before merge branches 

## Domain rules (keep these consistent)

- **Habit** = the definition (name, icon, repeat rule, start date, end condition). Yes/no only.
- **Occurrence** = one scheduled instance of a habit on a date. Generate from the repeat rule; don't store future rows.
- **Completion** = habit id + local date (`YYYY-MM-DD`) + timestamp.
- Repeat rules: `none | daily | weekly (weekdays) | monthly (day of month) | annually`; end: `never | on date | after N`. Use RRULE semantics.
- **Edits/deletes** of a repeating habit: "only this day" (add an exception date) or "this day and future" (split the habit: end the old series the day before, start a new one). Past occurrences and completions never change.
- **"Today"** comes from the user's time zone setting. Only today's occurrences can be checked; no backfill.
- **Day types**: **complete** (≥1 repeating habit scheduled, all done), **missed** (repeating habits scheduled, not all done), **empty** (no repeating habits). One-off tasks (repeat: none) never count. A **repaired** day counts as empty. Logic in `src/lib/streak.ts`.
- **Weekly gift** (replaces the daily gift and the perfect-week reward): for each finished week (user's week start), N = complete days; roll N times from food, goods and treasure and keep the highest price; N = 0 → no gift. Awarded on the server idempotently (unique user + week) for every finished week not yet rewarded, when Chronicle opens; the reveal plays once (`revealed_at`). Weeks start from `WEEKLY_GIFT_START`. Logic in `src/lib/weekly-gift.ts`.
- **Coins**: per day min(2 × repeating habits done, 10) + 20 on a complete day + min(2 × streak, 20) on a complete day; max 50. `coin_ledger` row per user + date + reason (`day | repair`); a day's row is only ever raised. Balance = sum. Private. Logic in `src/lib/coins.ts`.
- **Streak repair**: when yesterday was missed and the streak before it is ≥ 1, buy a repair for 100 coins until today ends; at most one per week (week of the missed day). Logic in `src/lib/streak.ts` (`repairOffer`).
- **Rarity**: drop weight is inversely related to the treasure's price. Duplicates allowed; inventory stores quantity.
- **Calendar** (on Progress): each finished day shows its end-of-day mood face (from `mood_log`), a patch on repaired days, the week's gift on its last day. Today shows its number. No duck stamp.
- **Mood**: the user's 0–100 score shown as five coloured segments (`MoodMeter`) with a round face at the score whose expression matches the level, best to worst: Lovestruck (pink, 85+) · Overjoyed (orange, 65+) · Content (yellow, 40+, **starting mood 50**) · Gloomy (blue, 20+) · Fuming (red). Names are tentative. Repeating habits only: complete day +8, each missed habit −4 (max −12/day), perfect week +12 (mood only); days with no habits don't move it; today can only lift it. Finished days are saved in `mood_log`. History shown as faces on the Progress calendar. Logic in `src/lib/mood.ts`.
- **Friends**: every player has a unique, shareable **friend code**. Adding a code sends a request; once accepted, both can see each other in Town. Either side can remove the friend.
- **Today's %** = completed ÷ scheduled occurrences for the user's own "today" (their time zone). A day with no tasks shows "no tasks today", not 0% or 100%.
- **Streak** = consecutive complete days, ending today or yesterday; empty and repaired days are skipped (don't break or extend it).
- **Group habit** (tentative): a habit owned by a group; each member ticks it on their own chronicle; group streak = days every member completed it.
- Award gifts and clothing on the server, idempotently (unique per user+date / user+week), so they can't be claimed twice.

## Navigation

Navbar, in this order: **My Chronicle** (today's tasks, habit list) · **Progress** (mood bar, calendar of mood faces and gifts, inventory) · **Town** (tentative: friends, friend code, leaderboard + cheers, groups; hidden unless `FEATURE_TOWN=true`, so the deployed site leaves it out) · **Settings** (time zone, week start, page background, share progress, account, recovery, delete account, Q&A). Bottom tab bar on phones, top bar on desktop. The **streak and coin** pills sit as one group right of the navbar (top-right corner on phones).

## Assets

- Sprites come from The Spriters Resource and are Nintendo's copyright. Keep the project non-commercial, keep the disclaimer in the README and site footer, and credit the rippers.
- The treasure catalogue is data (JSON: id, name, category, price, sprite path), not hard-coded in components. Rarity is derived from price. Prices come from the community price sheet: https://docs.google.com/spreadsheets/d/1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y (import it with a script into the JSON; don't hand-type).
- Logo: `public/ruchintachi-logo.webp` (yellow blob, bold black wordmark, blue/green/red subtitle) sets the colour palette and the playful, rounded UI style. Visual reference: tomoboard.com — most UI elements should feel close to it (rounded cards, soft colours).

## Conventions

- Mobile-first layouts; must work at phone width.
- Keep repeat-rule expansion, gift rolls, perfect-week and mood logic in pure functions with Vitest tests, separate from UI and DB code.
- Never commit secrets or the SQLite database file; use `.env` (gitignored).
- Reference the GitHub issue number in commit messages and PRs when there is one.

## Commands

```bash
pnpm install          # native builds (better-sqlite3, esbuild) are approved in pnpm-workspace.yaml
pnpm dev              # http://localhost:3000
pnpm test             # Vitest, pure logic in src/lib/*.test.ts
pnpm lint
pnpm build
pnpm db:generate      # after editing src/db/schema.ts → new SQL in drizzle/
pnpm db:migrate       # apply migrations to DATABASE_PATH (default ./data/ruchintachi.db)
```

- Keep TypeScript on 6.x until typescript-eslint supports TS 7.
- Never edit files in `drizzle/` by hand; change the schema and regenerate.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
