// Calendar-date helpers. A "date" here is always a local "YYYY-MM-DD"
// string; time zones are applied before values reach these functions.

export type WeekStart = "monday" | "sunday";

/** Today's date in the given IANA time zone, e.g. "Asia/Tokyo". */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** First day of the week containing `date`, per the user's setting. */
export function startOfWeek(date: string, weekStart: WeekStart): string {
  const day = toUtc(date).getUTCDay(); // 0 = Sunday
  const offset = weekStart === "monday" ? (day + 6) % 7 : day;
  return addDays(date, -offset);
}

/** The seven dates of the week containing `date`. */
export function weekDates(date: string, weekStart: WeekStart): string[] {
  const first = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}
