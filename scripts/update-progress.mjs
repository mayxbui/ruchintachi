// Rewrites the progress section of README.md from the GitHub issues:
// one bar per milestone plus an overall bar. Runs locally (needs `gh` signed in)
// and in .github/workflows/readme-progress.yml.
//
//   node scripts/update-progress.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const REPO = process.env.GITHUB_REPOSITORY ?? "mayxbui/ruchintachi";
const README = new URL("../README.md", import.meta.url);
const START = "<!-- progress:start -->";
const END = "<!-- progress:end -->";
const BAR_WIDTH = 20;

function gh(path) {
  const out = execFileSync("gh", ["api", "--paginate", "--slurp", path], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out).flat();
}

function bar(done, total) {
  const filled = total === 0 ? 0 : Math.round((done / total) * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

function percent(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Pull requests come back from the issues endpoint too; skip them.
// Issues closed as "not planned" (duplicates, won't do) don't count either way.
const issues = gh(`repos/${REPO}/issues?state=all&per_page=100`).filter(
  (i) => !i.pull_request && i.state_reason !== "not_planned",
);

const groups = new Map(); // milestone number (0 = none) -> { title, url, done, total }
for (const issue of issues) {
  const m = issue.milestone;
  const key = m ? m.number : 0;
  if (!groups.has(key)) {
    groups.set(key, {
      title: m ? m.title : "No milestone",
      url: m ? m.html_url : null,
      done: 0,
      total: 0,
    });
  }
  const g = groups.get(key);
  g.total += 1;
  if (issue.state === "closed") g.done += 1;
}

// Milestones in order, "No milestone" last.
const rows = [...groups.entries()]
  .sort(([a], [b]) => (a === 0) - (b === 0) || a - b)
  .map(([, g]) => g);

const done = rows.reduce((n, g) => n + g.done, 0);
const total = rows.reduce((n, g) => n + g.total, 0);

const section = [
  START,
  `**Overall: ${percent(done, total)}%** (${done} of ${total} issues closed)`,
  "",
  `\`${bar(done, total)}\``,
  "",
  "| Milestone | Progress | Done |",
  "|---|---|---|",
  ...rows.map((g) => {
    const name = g.url ? `[${g.title}](${g.url})` : g.title;
    const check = g.done === g.total ? " ✅" : "";
    return `| ${name} | \`${bar(g.done, g.total)}\` ${percent(g.done, g.total)}% | ${g.done}/${g.total}${check} |`;
  }),
  "",
  "<sub>Updated automatically from GitHub issues.</sub>",
  END,
].join("\n");

const readme = readFileSync(README, "utf8");
const from = readme.indexOf(START);
const to = readme.indexOf(END);
if (from === -1 || to === -1) {
  throw new Error(`README.md needs ${START} and ${END} markers`);
}
const next = readme.slice(0, from) + section + readme.slice(to + END.length);

if (next === readme) {
  console.log("Progress unchanged.");
} else {
  writeFileSync(README, next);
  console.log(`Progress updated: ${done}/${total} (${percent(done, total)}%).`);
}
