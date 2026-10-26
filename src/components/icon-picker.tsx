"use client";

import { useCallback, useRef, useState } from "react";
import { HABIT_ICONS, type HabitIcon } from "@/lib/habit-icons";
import { useDismiss } from "./use-dismiss";

/**
 * A task's icon as a button that opens the icon grid. No icon shows a
 * faint dashed box that firms up on hover. `size` "lg" sits beside the
 * name in the task form; "sm" sits in a task row.
 */
export function IconPicker({
  value,
  onChange,
  size = "lg",
  label,
}: {
  value: HabitIcon | null;
  onChange: (icon: HabitIcon | null) => void;
  size?: "lg" | "sm";
  label?: string; // the task's name, for screen readers
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  function choose(icon: HabitIcon | null) {
    setOpen(false);
    if (icon !== value) onChange(icon);
  }

  const box = size === "lg" ? "size-12 text-2xl" : "size-9 rounded-xl text-xl";
  const what = label ? ` for ${label}` : "";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={value ? `Icon${what}: ${value}. Change icon` : `Pick an icon${what}`}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex min-w-0 items-center justify-center outline-none transition focus-visible:ring-4 focus-visible:ring-sky ${box} ${
          value
            ? size === "lg"
              ? "bg-white shadow-pop"
              : "bg-transparent shadow-none hover:bg-sand/60"
            : "border-3 border-dashed border-caption bg-white/60 opacity-10 shadow-none hover:opacity-60"
        }`}
      >
        {value && HABIT_ICONS[value]}
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-2 w-max rounded-3xl bg-sunny p-3 shadow-pop">
          <div className="grid grid-cols-4 gap-1">
            {(Object.entries(HABIT_ICONS) as [HabitIcon, string][]).map(([key, emoji]) => (
              <button
                key={key}
                type="button"
                onClick={() => choose(key)}
                aria-label={key}
                aria-pressed={value === key}
                className={`flex size-11 min-w-0 items-center justify-center rounded-2xl bg-white text-2xl transition hover:bg-sand/80 ${
                  value === key ? "bg-sunny ring-2 ring-tangerine" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => choose(null)}
            className="mt-1 w-full rounded-2xl bg-white px-3 py-2 text-sm font-bold text-caption transition hover:bg-sunny/50"
          >
            No icon
          </button>
        </div>
      )}
    </div>
  );
}
