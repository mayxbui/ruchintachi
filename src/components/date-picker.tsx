"use client";

import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useCallback, useId, useRef, useState } from "react";
import type { WeekStart } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { popoverClass, triggerClass } from "./dropdown";
import { useDismiss } from "./use-dismiss";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthTitle = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;
/** [year, zero-based month] of a YYYY-MM-DD date. */
const monthOf = (date: string): [number, number] => [
  Number(date.slice(0, 4)),
  Number(date.slice(5, 7)) - 1,
];

/**
 * A month calendar in the site's style: the inside of the date picker's
 * popover. Days before `min` can't be picked; it opens on `value`'s month
 * (or `min`'s). With `onClear` it has a Clear button while a day is picked.
 */
export function MonthCalendar({
  value,
  onPick,
  min,
  today,
  weekStart,
  onClear,
}: {
  value: string;
  onPick: (date: string) => void;
  min: string;
  today: string;
  weekStart: WeekStart;
  onClear?: () => void;
}) {
  const [[year, month], setView] = useState(() => monthOf(value || min));

  function shift(by: number) {
    const d = new Date(Date.UTC(year, month + by, 1));
    setView([d.getUTCFullYear(), d.getUTCMonth()]);
  }

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const startDay = weekStart === "monday" ? 1 : 0;
  const blanks = (firstWeekday - startDay + 7) % 7;
  const headers = [...WEEKDAYS.slice(startDay), ...WEEKDAYS.slice(0, startDay)];
  const canGoBack = iso(year, month, 1) > min;

  const navClass =
    "flex size-9 min-w-0 items-center justify-center rounded-full bg-white text-caption shadow-none transition hover:bg-sand disabled:opacity-30 disabled:hover:bg-white";

  return (
    <div className="rounded-2xl bg-white p-2">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className={navClass}
        >
          <IconChevronLeft aria-hidden stroke={2.5} className="size-5" />
        </button>
        <span className="font-bold" aria-live="polite">
          {monthTitle.format(new Date(Date.UTC(year, month, 1)))}
        </span>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className={navClass}>
          <IconChevronRight aria-hidden stroke={2.5} className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {headers.map((d) => (
          <span key={d} className="py-1 text-xs font-bold text-caption">
            {d}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = iso(year, month, i + 1);
          const isSelected = date === value;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              disabled={date < min}
              aria-label={formatDate(date)}
              aria-pressed={isSelected}
              onClick={() => onPick(date)}
              className={`mx-auto flex size-9 min-w-0 items-center justify-center rounded-full text-sm font-bold shadow-none transition disabled:cursor-default disabled:opacity-30 ${
                isSelected
                  ? "bg-tangerine text-white"
                  : `bg-white hover:bg-sunny/60 disabled:hover:bg-white ${isToday ? "ring-2 ring-sunny-deep" : ""}`
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 w-full min-w-0 rounded-full bg-transparent py-1.5 text-sm font-bold text-caption shadow-none transition hover:bg-sand hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * A labelled date field that opens a month calendar in the site's style.
 * Dates are YYYY-MM-DD strings, posted through a hidden input called `name`.
 * Days before `min` can't be picked. With `onClear` the field is optional:
 * empty shows `placeholder`, and the calendar has a Clear button.
 */
export function DatePicker({
  label,
  name,
  value,
  onChange,
  min,
  today,
  weekStart,
  align = "left",
  onClear,
  placeholder = "Pick a day",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (date: string) => void;
  min: string;
  today: string;
  weekStart: WeekStart;
  /** Which edge the calendar lines up with; use "right" in a right-hand column. */
  align?: "left" | "right";
  onClear?: () => void;
  placeholder?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  return (
    <div ref={ref} className="relative min-w-0">
      <span id={`${id}-label`} className="mb-1 block font-bold">
        {label}
      </span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={triggerClass}
      >
        <span id={`${id}-value`} className={`truncate ${value ? "" : "text-slate-400"}`}>
          {value ? formatDate(value) : placeholder}
        </span>
        <IconCalendar aria-hidden stroke={2.25} className="size-5 shrink-0 text-caption" />
      </button>

      {open && (
        // Mounted on each open, so the calendar starts on the picked month.
        <div
          role="dialog"
          aria-labelledby={`${id}-label`}
          className={`${popoverClass} w-72 ${align === "right" ? "right-0" : "left-0"}`}
        >
          <MonthCalendar
            value={value}
            onPick={(date) => {
              onChange(date);
              setOpen(false);
            }}
            min={min}
            today={today}
            weekStart={weekStart}
            onClear={
              onClear &&
              (() => {
                onClear();
                setOpen(false);
              })
            }
          />
        </div>
      )}
    </div>
  );
}
