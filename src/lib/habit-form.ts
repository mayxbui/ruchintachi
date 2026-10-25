// Create-habit form rules. Pure: the server action reads the form into
// HabitFormValues, validates against the user's "today", and inserts the
// normalised result.

import { isHabitIcon, type HabitIcon } from "./habit-icons";
import { expandOccurrences, type EndType, type Frequency } from "./repeat-rule";

export const HABIT_NAME_MAX = 40;
export const END_COUNT_MAX = 999;

const FREQUENCIES: Frequency[] = ["none", "daily", "weekly", "monthly", "annually"];
const END_TYPES: EndType[] = ["never", "on_date", "after_count"];

/** The form exactly as submitted, before any checks. */
export interface HabitFormValues {
  name: string;
  icon: string;
  startDate: string;
  frequency: string;
  weekdays: string[];
  endType: string;
  endDate: string;
  endCount: string;
}

/** A valid habit, ready to insert. Fields that don't apply are null. */
export interface NewHabit {
  name: string;
  icon: HabitIcon;
  startDate: string;
  frequency: Frequency;
  weekdays: number[] | null;
  endType: EndType;
  endDate: string | null;
  endCount: number | null;
}

export function readHabitForm(formData: FormData): HabitFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    name: text("name"),
    icon: text("icon"),
    startDate: text("startDate"),
    frequency: text("frequency"),
    weekdays: formData.getAll("weekdays").map(String),
    endType: text("endType"),
    endDate: text("endDate"),
    endCount: text("endCount"),
  };
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

/**
 * Checks the form and returns the habit to store, or an error message.
 * `today` is the user's local date; a habit can't start before it, since
 * past days can't be ticked.
 */
export function validateHabit(
  values: HabitFormValues,
  today: string,
): { habit: NewHabit } | { error: string } {
  const name = values.name.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give your habit a name." };
  if (name.length > HABIT_NAME_MAX) {
    return { error: `Keep the name to ${HABIT_NAME_MAX} characters or fewer.` };
  }

  if (!isHabitIcon(values.icon)) return { error: "Pick an icon." };

  if (!isIsoDate(values.startDate)) return { error: "Pick a start date." };
  if (values.startDate < today) return { error: "The start date can't be in the past." };

  const frequency = values.frequency as Frequency;
  if (!FREQUENCIES.includes(frequency)) return { error: "Pick how often it repeats." };

  let weekdays: number[] | null = null;
  if (frequency === "weekly") {
    weekdays = [...new Set(values.weekdays.map(Number))]
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    if (weekdays.length === 0) return { error: "Pick at least one day of the week." };
  }

  // A one-off habit has nothing to end.
  const endType = frequency === "none" ? "never" : (values.endType as EndType);
  if (!END_TYPES.includes(endType)) return { error: "Pick when it ends." };

  let endDate: string | null = null;
  let endCount: number | null = null;
  if (endType === "on_date") {
    if (!isIsoDate(values.endDate)) return { error: "Pick an end date." };
    if (values.endDate < values.startDate) {
      return { error: "The end date can't be before the start date." };
    }
    endDate = values.endDate;
  } else if (endType === "after_count") {
    endCount = Number(values.endCount);
    if (!Number.isInteger(endCount) || endCount < 1 || endCount > END_COUNT_MAX) {
      return { error: `End after 1–${END_COUNT_MAX} times.` };
    }
  }

  const habit: NewHabit = {
    name,
    icon: values.icon,
    startDate: values.startDate,
    frequency,
    weekdays,
    endType,
    endDate,
    endCount,
  };

  // e.g. every 31st, ending on the 30th of the same month.
  if (endDate && expandOccurrences(habit, habit.startDate, endDate).length === 0) {
    return { error: "This habit would never come up before its end date." };
  }
  return { habit };
}
