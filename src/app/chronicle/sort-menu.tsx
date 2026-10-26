"use client";

import { IconArrowsSort, IconCheck } from "@tabler/icons-react";
import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { popoverClass } from "@/components/dropdown";
import { useDismiss } from "@/components/use-dismiss";
import { HABIT_SORTS, SORT_LABELS, type HabitSort } from "@/lib/sort-habits";
import { setSortAction } from "./actions";

/**
 * The sort menu on Today and Tasks: how tasks are ordered, and whether
 * ticked tasks drop to the bottom of Today. Saved per user, so it's the
 * same on every device.
 */
export function SortMenu({
  sort,
  doneLast,
  align = "right",
}: {
  sort: HabitSort;
  doneLast: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const [shown, setShown] = useOptimistic({ sort, doneLast });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function save(next: { sort: HabitSort; doneLast: boolean }) {
    setError(undefined);
    startTransition(async () => {
      setShown(next);
      const result = await setSortAction(next.sort, next.doneLast);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex min-w-0 items-center gap-1.5 bg-white px-3 py-1.5 font-bold text-slate-500 transition hover:text-ink"
      >
        <IconArrowsSort aria-hidden className="size-5" stroke={2.25} />
        <span className="sr-only">Sort: </span>
        {SORT_LABELS[shown.sort]}
      </button>
      {open && (
        <div className={`${popoverClass} w-60 ${align === "right" ? "right-0" : "left-0"}`}>
          <p className="px-3 pt-1 pb-2 text-sm font-bold text-caption">Sort tasks by</p>
          <div role="radiogroup" aria-label="Sort tasks by">
            {HABIT_SORTS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={shown.sort === value}
                onClick={() => save({ ...shown, sort: value })}
                className="flex w-full min-w-0 items-center justify-between rounded-2xl bg-transparent px-3 py-2 text-left font-bold shadow-none transition hover:bg-white/70"
              >
                {SORT_LABELS[value]}
                {shown.sort === value && <IconCheck aria-hidden className="size-5" stroke={3} />}
              </button>
            ))}
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-3 py-2 font-bold">
            <input
              type="checkbox"
              checked={shown.doneLast}
              onChange={(e) => save({ ...shown, doneLast: e.target.checked })}
              className="size-5 accent-leaf"
            />
            Move done tasks to the bottom
          </label>
          {shown.sort === "custom" && (
            <p className="px-3 pt-2 text-sm text-caption">Drag tasks on the Tasks tab to set the order.</p>
          )}
          {error && (
            <p role="alert" className="px-3 pt-2 text-cherry">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
