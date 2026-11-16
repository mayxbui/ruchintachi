# RuchinTachi

RuchinTachi is a habit planner and tracker inspired by *Tomodachi Life: Living the Dream*.

Plan your day, build up streaks and collect weekly gifts as you complete habits.

## Features

- **My Chronicle** groups today's tasks and repeating habits in one place. Organize tasks into lists and use the timer.
- **Progress** shows mood history, weekly gifts, and your treasure collection. Complete a day of repeating habits to qualify for that week's gift. Open My Chronicle after the week ends to reveal it.
- **Settings** lets you choose a time zone, week start, and page background, and manage your account and recovery code.

Accounts use a username and password. Today's checkboxes follow your chosen time zone. Town is experimental and can be enabled locally with `FEATURE_TOWN=true`.


## Progress

<!-- progress:start -->
**Overall: 89%** (39 of 44 issues closed)

`██████████████████░░`

| Milestone | Progress | Done |
|---|---|---|
| [M1 · Project setup](https://github.com/mayxbui/ruchintachi/milestone/1) | `████████████████████` 100% | 4/4 ✅ |
| [M2 · Accounts & Mii](https://github.com/mayxbui/ruchintachi/milestone/2) | `████████████████████` 100% | 4/4 ✅ |
| [M3 · Habits & check-off](https://github.com/mayxbui/ruchintachi/milestone/3) | `████████████████████` 100% | 11/11 ✅ |
| [M4 · Calendar & daily gift (MVP)](https://github.com/mayxbui/ruchintachi/milestone/4) | `████████████████████` 100% | 6/6 ✅ |
| [M5 · Deploy to Azure](https://github.com/mayxbui/ruchintachi/milestone/5) | `████████████████████` 100% | 4/4 ✅ |
| [M6 · Charts & Mii mood](https://github.com/mayxbui/ruchintachi/milestone/6) | `████████████████████` 100% | 5/5 ✅ |
| [M7 · Weekly gift, coins & streak repair](https://github.com/mayxbui/ruchintachi/milestone/7) | `████████████████████` 100% | 4/4 ✅ |
| [M8 · Friends & Town](https://github.com/mayxbui/ruchintachi/milestone/8) | `░░░░░░░░░░░░░░░░░░░░` 0% | 0/4 |
| [M9 · Polish & extras](https://github.com/mayxbui/ruchintachi/milestone/9) | `██████████░░░░░░░░░░` 50% | 1/2 |

<sub>Updated automatically from GitHub issues.</sub>
<!-- progress:end -->

## Contributing

Open an issue to describe the behavior you want to change or report a bug with reproduction steps. In a pull request, link the issue when applicable, describe what you verified, and include phone and desktop screenshots for visual changes. Keep credentials, recovery codes, and SQLite files out of commits and screenshots.

```sh
pnpm test
pnpm lint
pnpm build
```

See [AGENTS.md](AGENTS.md) for the repo map, database workflow, and privacy and scheduling rules.

## Asset credits

RuchinTachi is an independent, non-commercial fan project. Tomodachi Life and its game assets belong to [Nintendo](https://www.nintendo.com/us/store/products/tomodachi-life-living-the-dream-switch/).

- Sprite rips come from [The Spriters Resource contributors](https://www.spriters-resource.com/nintendo_switch/tomodachilifelivingthedream/).
- Treasure icons come from [tlmodding/ltd-images](https://github.com/tlmodding/ltd-images). Run `pnpm sprites:build` to regenerate the treasure WebPs.
- Treasure names and prices come from [the community spreadsheet by echocolat, phil_macrocheira, and superspazzy](https://docs.google.com/spreadsheets/d/1iPb1freZ57gP7tBDMbvIUi3cDvIE979COqlDsRTYu3Y). Run `pnpm catalogue:import` to refresh `src/data/items.json`.
