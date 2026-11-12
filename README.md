# RuchinTachi

RuchinTachi is a habit planner and tracker inspired by *Tomodachi Life: Living the Dream*.

Plan your day, build up streaks and collect weekly gifts as you complete habits.

## Features

- **My Chronicle** groups today's tasks and repeating habits in one place. Organize tasks into lists and use the timer.
- **Progress** shows mood history, weekly gifts, and your treasure collection. Complete a day of repeating habits to qualify for that week's gift. Open My Chronicle after the week ends to reveal it.
- **Settings** lets you choose a time zone, week start, and page background, and manage your account and recovery code.
- **Getting started** stays in the upper-right as you move between pages. **Q&A** opens the help section in Settings. Release notes live under **Settings → What's new**.

Accounts use a username and password. Today's checkboxes follow your chosen time zone. Town is experimental and can be enabled locally with `FEATURE_TOWN=true`.


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
