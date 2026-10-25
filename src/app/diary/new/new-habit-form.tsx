"use client";

import Link from "next/link";
import { useActionState, useState, type ComponentProps, type ReactNode } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form";
import type { WeekStart } from "@/lib/dates";
import { describeRule } from "@/lib/describe-rule";
import { END_COUNT_MAX, HABIT_NAME_MAX } from "@/lib/habit-form";
import { HABIT_ICONS, type HabitIcon } from "@/lib/habit-icons";
import type { EndType, Frequency } from "@/lib/repeat-rule";
import { createHabitAction } from "../actions";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "none", label: "Just once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Yearly" },
];

const END_TYPES: { value: EndType; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "on_date", label: "On a date" },
  { value: "after_count", label: "After a number of times" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const inputClass =
  "w-full bg-white px-4 py-3 shadow-pop outline-none focus:ring-4 focus:ring-sunny";

/** A pill that acts as a radio button or checkbox. */
function Pill({
  children,
  ...input
}: { children: ReactNode } & ComponentProps<"input">) {
  return (
    <label className="cursor-pointer">
      <input className="peer sr-only" {...input} />
      <span className="block rounded-full bg-white px-4 py-2 font-bold text-slate-500 shadow-pop transition peer-checked:bg-tangerine peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sky">
        {children}
      </span>
    </label>
  );
}

export function NewHabitForm({ today, weekStart }: { today: string; weekStart: WeekStart }) {
  const [state, formAction] = useActionState(createHabitAction, {});
  // Controlled fields, so nothing is lost when the server sends back an error.
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIcon>("star");
  const [startDate, setStartDate] = useState(today);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [endType, setEndType] = useState<EndType>("never");
  const [endDate, setEndDate] = useState("");
  const [endCount, setEndCount] = useState("10");

  const weekOrder = weekStart === "monday" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const startWeekday = new Date(`${startDate || today}T00:00:00Z`).getUTCDay();

  function chooseFrequency(value: Frequency) {
    setFrequency(value);
    // Weekly starts with the start date's weekday ticked.
    if (value === "weekly" && weekdays.length === 0) setWeekdays([startWeekday]);
  }

  function toggleWeekday(day: number) {
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  const summary =
    startDate &&
    describeRule(
      {
        startDate,
        frequency,
        weekdays,
        endType,
        endDate: endDate || null,
        endCount: Number(endCount) || null,
      },
      weekStart,
    );

  return (
    <form action={formAction} className="space-y-6">
      <TextField
        label="Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={HABIT_NAME_MAX}
        placeholder="Drink a glass of water"
        autoComplete="off"
      />

      <fieldset>
        <legend className="mb-2 font-bold">Icon</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(HABIT_ICONS) as [HabitIcon, string][]).map(([key, emoji]) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name="icon"
                value={key}
                checked={icon === key}
                onChange={() => setIcon(key)}
                className="peer sr-only"
                aria-label={key}
              />
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-pop transition peer-checked:bg-sunny peer-checked:ring-4 peer-checked:ring-tangerine peer-focus-visible:ring-4 peer-focus-visible:ring-sky">
                {emoji}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1 block font-bold">Start date</span>
        <input
          type="date"
          name="startDate"
          value={startDate}
          min={today}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className={inputClass}
        />
      </label>

      <fieldset>
        <legend className="mb-2 font-bold">Repeats</legend>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <Pill
              key={f.value}
              type="radio"
              name="frequency"
              value={f.value}
              checked={frequency === f.value}
              onChange={() => chooseFrequency(f.value)}
            >
              {f.label}
            </Pill>
          ))}
        </div>
      </fieldset>

      {frequency === "weekly" && (
        <fieldset>
          <legend className="mb-2 font-bold">On these days</legend>
          <div className="flex flex-wrap gap-2">
            {weekOrder.map((day) => (
              <Pill
                key={day}
                type="checkbox"
                name="weekdays"
                value={day}
                checked={weekdays.includes(day)}
                onChange={() => toggleWeekday(day)}
              >
                {WEEKDAY_LABELS[day]}
              </Pill>
            ))}
          </div>
        </fieldset>
      )}

      {frequency !== "none" && (
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">Ends</legend>
          <div className="flex flex-wrap gap-2">
            {END_TYPES.map((e) => (
              <Pill
                key={e.value}
                type="radio"
                name="endType"
                value={e.value}
                checked={endType === e.value}
                onChange={() => setEndType(e.value)}
              >
                {e.label}
              </Pill>
            ))}
          </div>
          {endType === "on_date" && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Last day</span>
              <input
                type="date"
                name="endDate"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className={inputClass}
              />
            </label>
          )}
          {endType === "after_count" && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold">How many times</span>
              <input
                type="number"
                name="endCount"
                value={endCount}
                min={1}
                max={END_COUNT_MAX}
                step={1}
                onChange={(e) => setEndCount(e.target.value)}
                required
                className={inputClass}
              />
            </label>
          )}
        </fieldset>
      )}

      {summary && (
        <p className="rounded-2xl bg-sunny/30 px-4 py-3">
          <span className="mr-2 text-xl">{HABIT_ICONS[icon]}</span>
          <span className="font-bold">{name.trim() || "New habit"}</span>
          <span className="block text-caption">{summary}</span>
        </p>
      )}

      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Adding…">Add habit</SubmitButton>
        <Link href="/diary" className="font-bold text-sky underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
