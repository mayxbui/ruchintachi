"use client";

import { IconCalendarDue, IconPlus, IconX } from "@tabler/icons-react";
import { useActionState, useCallback, useRef, useState } from "react";
import { MonthCalendar } from "@/components/date-picker";
import { useDismiss } from "@/components/use-dismiss";
import type { WeekStart } from "@/lib/dates";
import { dueLabel } from "@/lib/due-date";
import { HABIT_NAME_MAX } from "@/lib/habit-form";
import { quickAddTaskAction } from "./actions";

/**
 * Type a name, press Enter: a one-off task for today. The calendar button
 * gives it a due date, so it stays on Today until it's ticked (or deleted).
 * React resets the input after each successful add; the due date clears too.
 */
export function QuickAdd({ today, weekStart }: { today: string; weekStart: WeekStart }) {
  const [state, formAction, pending] = useActionState(quickAddTaskAction, {});
  // The picked due date belongs to one add: a new `added` starts it empty.
  const [due, setDue] = useState({ date: "", for: state.added });
  const dueDate = due.for === state.added ? due.date : "";
  const pick = (date: string) => setDue({ date, for: state.added });

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);
  const label = dueDate ? dueLabel(dueDate, today).text : null;

  return (
    <form action={formAction} className="mb-3">
      <input type="hidden" name="dueDate" value={dueDate} />
      <div className="relative flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-4 shadow-pop focus-within:ring-4 focus-within:ring-sunny">
        <input
          name="name"
          aria-label="Add a task for today"
          placeholder="Add a task for today…"
          required
          maxLength={HABIT_NAME_MAX}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-1.5 px-1 shadow-none outline-none"
        />
        {/* The calendar hangs under the whole bar (full width on phones). */}
        <div ref={ref} className="shrink-0">
          {label ? (
            <span className="flex items-center rounded-full bg-tangerine/15 text-sm font-bold text-tangerine">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={`${label}. Change due date`}
                className="flex min-w-0 items-center gap-1 bg-transparent py-1 pr-1 pl-2 shadow-none"
              >
                <IconCalendarDue aria-hidden className="size-4" stroke={2.5} />
                <span className="max-w-28 truncate">{label}</span>
              </button>
              <button
                type="button"
                onClick={() => pick("")}
                aria-label="Remove due date"
                className="min-w-0 bg-transparent py-1 pr-2 pl-0.5 shadow-none hover:brightness-75"
              >
                <IconX aria-hidden className="size-3.5" stroke={3} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label="Add a due date"
              data-hint="Add a due date"
              className="flex min-w-0 items-center justify-center rounded-full bg-transparent p-2 text-caption shadow-none transition hover:bg-sand hover:text-ink"
            >
              <IconCalendarDue className="size-5" stroke={2.25} />
            </button>
          )}
          {open && (
            <div
              role="dialog"
              aria-label="Due date"
              className="absolute top-full right-0 left-0 z-20 mt-3 rounded-3xl bg-sunny p-2 shadow-pop sm:left-auto sm:w-72"
            >
              <p className="px-2 pb-2 text-sm font-bold">Due by… it stays on Today until done</p>
              <MonthCalendar
                value={dueDate}
                onPick={(date) => {
                  pick(date);
                  setOpen(false);
                }}
                min={today}
                today={today}
                weekStart={weekStart}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          aria-label="Add task"
          className="flex min-w-0 shrink-0 items-center justify-center bg-leaf p-2 text-white shadow-none transition hover:brightness-105 disabled:opacity-60"
        >
          <IconPlus className="size-5" stroke={3} />
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 px-4 text-cherry">
          {state.error}
        </p>
      )}
    </form>
  );
}
