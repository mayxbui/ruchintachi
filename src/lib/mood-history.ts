// Mood line chart data (#26). Pure: the Mii page loads the saved end-of-day
// moods and today's live mood; these functions pick the range and line up
// one point per day for the chart.

import { addDays } from "./dates";

export const MOOD_RANGES = {
  week: { label: "Week", days: 7 },
  month: { label: "Month", days: 30 },
  quarter: { label: "3 months", days: 90 },
} as const;

export type MoodRange = keyof typeof MOOD_RANGES;

export const DEFAULT_MOOD_RANGE: MoodRange = "month";

/** The range in the URL, or Month for anything else. */
export function parseMoodRange(raw: string | undefined): MoodRange {
  return raw && Object.hasOwn(MOOD_RANGES, raw) ? (raw as MoodRange) : DEFAULT_MOOD_RANGE;
}

/** First day shown for `range`, counting today as its last day. */
export function moodRangeStart(today: string, range: MoodRange): string {
  return addDays(today, -(MOOD_RANGES[range].days - 1));
}

/** One day on the chart. `mood` is null before the user signed up. */
export interface MoodPoint {
  date: string;
  mood: number | null;
  today: boolean;
}

/**
 * Every day from `from` to `today`: saved end-of-day moods, then today's
 * live mood on the end. Days with nothing saved (before sign-up) are null,
 * so the line starts where the history does.
 */
export function moodSeries(
  saved: readonly { date: string; mood: number }[],
  from: string,
  today: string,
  todayMood: number,
): MoodPoint[] {
  const byDate = new Map(saved.map((entry) => [entry.date, entry.mood]));
  const points: MoodPoint[] = [];
  for (let date = from; date < today; date = addDays(date, 1)) {
    points.push({ date, mood: byDate.get(date) ?? null, today: false });
  }
  points.push({ date: today, mood: todayMood, today: true });
  return points;
}

/** A line needs two points: before the first full day there is only today. */
export function hasMoodHistory(points: readonly MoodPoint[]): boolean {
  return points.filter((point) => point.mood !== null).length >= 2;
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-28" → "28 Oct", for the chart's axis and tooltip. */
export function shortDate(date: string): string {
  return dayMonth.format(new Date(`${date}T00:00:00Z`));
}
