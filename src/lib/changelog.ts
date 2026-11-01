// Changelog for players. The data lives in src/data/changelog.json; every
// entry is checked with the owner before it's added.
import data from "@/data/changelog.json";

export const releaseTags = ["feature", "fix", "improvement"] as const;
export type ReleaseTag = (typeof releaseTags)[number];

export interface ReleaseSection {
  heading: string;
  changes: string[];
}

export interface Release {
  version: string; // "1.2.0"
  date: string; // "YYYY-MM-DD"
  title: string;
  tag: ReleaseTag;
  /** Major releases get the special box, a summary and sections. */
  major?: boolean;
  summary?: string;
  changes?: string[];
  sections?: ReleaseSection[];
}

function isRealDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

const VERSION = /^\d+\.\d+\.\d+$/;

/** Newer version first: compares "1.10.0" > "1.9.2" by number, not text. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}

const filled = (list: string[]) => list.length > 0 && list.every((c) => c.trim());

/** Checks every release and returns them newest first. Throws on a bad entry. */
export function sortReleases(entries: Release[]): Release[] {
  const seen = new Set<string>();
  for (const r of entries) {
    const where = `changelog ${r.version}`;
    if (!VERSION.test(r.version)) throw new Error(`Bad version in changelog: "${r.version}"`);
    if (seen.has(r.version)) throw new Error(`Duplicate version in changelog: ${r.version}`);
    seen.add(r.version);
    if (!isRealDate(r.date)) throw new Error(`Bad date in ${where}: "${r.date}"`);
    if (!r.title.trim()) throw new Error(`Missing title in ${where}`);
    if (!releaseTags.includes(r.tag)) throw new Error(`Unknown tag in ${where}: "${r.tag}"`);
    const hasChanges = r.changes !== undefined && filled(r.changes);
    const hasSections =
      r.sections !== undefined &&
      r.sections.length > 0 &&
      r.sections.every((s) => s.heading.trim() && filled(s.changes));
    if (!hasChanges && !hasSections) throw new Error(`No changes in ${where}`);
  }
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || compareVersions(a.version, b.version),
  );
}

export const releases = sortReleases(data as Release[]);

/** "2026-10-28" -> "October 28, 2026". */
export function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
