// Short human summary of a repeat rule, e.g. "Every Mon, Wed · 10 times".

import type { WeekStart } from "./dates";
import type { RepeatRule } from "./repeat-rule";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/** "25 Oct 2026" */
export function formatDate(date: string): string {
  return fullDate.format(utc(date));
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

type Describable = Pick<
  RepeatRule,
  "startDate" | "frequency" | "weekdays" | "endType" | "endDate" | "endCount"
>;

export function describeRule(rule: Describable, weekStart: WeekStart = "monday"): string {
  const day = Number(rule.startDate.slice(8, 10));
  let repeat: string;
  switch (rule.frequency) {
    case "none":
      return `Once, on ${formatDate(rule.startDate)}`;
    case "daily":
      repeat = "Every day";
      break;
    case "weekly": {
      const days = rule.weekdays?.length ? rule.weekdays : [utc(rule.startDate).getUTCDay()];
      // List days in the user's week order.
      const key = (d: number) => (weekStart === "monday" ? (d + 6) % 7 : d);
      const sorted = [...new Set(days)].sort((a, b) => key(a) - key(b));
      repeat = sorted.length === 7 ? "Every day" : `Every ${sorted.map((d) => WEEKDAYS[d]).join(", ")}`;
      break;
    }
    case "monthly":
      repeat = `Every month on the ${ordinal(day)}`;
      break;
    case "annually":
      repeat = `Every year on ${dayMonth.format(utc(rule.startDate))}`;
      break;
  }

  if (rule.endType === "on_date" && rule.endDate) {
    return `${repeat} · until ${formatDate(rule.endDate)}`;
  }
  if (rule.endType === "after_count" && rule.endCount) {
    return `${repeat} · ${rule.endCount === 1 ? "once" : `${rule.endCount} times`}`;
  }
  return repeat;
}
