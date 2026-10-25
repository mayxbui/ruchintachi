# Ruchintachi — Habit Planner & Tracker

![Ruchintachi logo](ruchintachi-logo.png)

A habit tracker inspired by **Tomodachi Life: Living the Dream**. Create a Mii, give it habits to work on, and watch your calendar fill up with gifts as you keep your habits.

> Status: **planning** — see the [milestones](../../milestones) for progress.

## Features

### 1. Accounts & your Mii
- Sign up with a **username + password only**. No email, no real name, no personal information.
- At sign-up you get a one-time **recovery code** (the only way back in if you forget the password, since there's no email).
- Create your Mii from **preset options and colours** (a full face builder may come later).
- What's stored per account: username, password hash, Mii appearance, habits/plan, completions, items, settings. Nothing else.
- You can delete your account and all its data.

### 2. Habits
- Each habit is a **yes/no checkbox** for the day.
- Repeat options: **none**, **daily**, **weekly** (pick weekdays), **monthly** (day of month), **annually**.
- End conditions: **never**, **on a date**, or **after N occurrences**.
- Editing or deleting a repeating habit asks: **"only this day"** or **"this day and all future days"**. Past days are never changed.
- You can only check off **today**. No backfilling past days, no vacation mode.

### 3. Progress tracking
- **Calendar view** — every day you finished all your tasks shows the gift you got that day, so keeping a habit fills the calendar with items.
- **Bar view** — completion rate per habit and per week.
- **Mood line** — a line chart of your Mii's happiness over time.

### 4. Daily gift
- Finish **every task scheduled today** → your Mii gives you one random gift (custom item, food, goods/prezzie, treasure or object).
- **A day with no tasks gives no gift**, and doesn't count as a miss either.
- **Rarity is based on the item's in-game price**: the more expensive the item, the less likely it drops.
- **Duplicates are allowed** and counted (the inventory shows ×2, ×3, …).

### 5. Weekly clothing reward
- A **perfect week** = every task scheduled during that week was ticked. Days with no tasks don't count against you. A week with no tasks at all gives no reward.
- A perfect week lets you gift your Mii a **random clothing item**, also weighted by price, and the Mii wears it.

### 6. Mii mood
- The Mii's happiness goes up when you complete days and perfect weeks, and down when you miss scheduled tasks.

### Settings
- **Time zone**: "today" follows your time zone (detected from your browser, changeable in settings).
- **Week start**: Monday or Sunday.

## Tech stack

Everything is free and open source, and runs on one Azure VM.

| Part | Choice | Why |
|---|---|---|
| App | **Next.js** (React, TypeScript) | Frontend and backend in one project; huge community, easy to find help |
| Styling | **Tailwind CSS** | Fast to build the rounded, colourful Tomodachi look |
| Database | **SQLite** + **Drizzle ORM** | A single file on the VM: no database server to run or pay for; easy to back up |
| Auth | Username + password, hashed with **Argon2**, session cookie | No email or third-party login needed, so no personal data |
| Dates & repeats | **date-fns** / **date-fns-tz** + **rrule** | Time zones and repeat rules with known edge-case behaviour |
| Charts | **Recharts** | Bar and mood-line charts |
| Tests | **Vitest** | Unit tests for repeat rules, gift rolls and perfect-week logic |
| Hosting | **Azure VM** + **Caddy** (reverse proxy, automatic free HTTPS) + **systemd** to keep the app running | |

## Still to decide

- [ ] Item prices: The Spriters Resource has sprites but no prices. Prices need collecting by hand (e.g. from a Tomodachi Life wiki) into the item catalogue.
- [ ] Exact mood formula (how much a completed/missed day moves it, and the range).
- [ ] Domain name, or just the VM's IP / Azure DNS name.
- [ ] Who can sign up: only you, invite codes, or anyone with the link.

## References

- Item sprites: [The Spriters Resource — Tomodachi Life: Living the Dream](https://www.spriters-resource.com/nintendo_switch/tomodachilifelivingthedream/)
- Visual/UX reference: [tomoboard.com](https://www.tomoboard.com/)

## Disclaimer

Ruchintachi is an unofficial, non-commercial, personal fan project. It is not affiliated with or endorsed by Nintendo. Tomodachi Life and its sprites and assets are trademarks and copyright of Nintendo. Sprite rips courtesy of the contributors at The Spriters Resource.
