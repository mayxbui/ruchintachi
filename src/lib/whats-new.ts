// "What's new" updates for players. The data lives in src/data/whats-new.json;
// add an entry there when a change players will notice ships.
import data from "@/data/whats-new.json";

export interface Update {
  date: string; // "YYYY-MM-DD"
  title: string;
  changes: string[];
}

function isRealDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** Checks every entry and returns them newest first. Throws on a bad entry. */
export function sortUpdates(entries: Update[]): Update[] {
  for (const entry of entries) {
    if (!isRealDate(entry.date)) throw new Error(`Bad date in what's new: "${entry.date}"`);
    if (!entry.title.trim()) throw new Error(`Missing title in what's new on ${entry.date}`);
    if (entry.changes.length === 0 || entry.changes.some((c) => !c.trim())) {
      throw new Error(`Empty change in what's new on ${entry.date}`);
    }
  }
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export const updates = sortUpdates(data);

/** "2026-10-28" -> "28 October 2026". */
export function formatUpdateDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
