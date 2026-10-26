"use client";

import { IconCheck, IconHourglassHigh, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { iconEmoji } from "@/lib/habit-icons";
import { formatClock, parseMinutes, remainingMs, TIMER_MAX_MINUTES, TIMER_PRESETS } from "@/lib/timer";
import { doneLast as moveDoneLast } from "@/lib/sort-habits";
import { dayProgress, type DayItem } from "@/lib/today";
import { toggleCompletionAction } from "./actions";
import { TaskText } from "./task-text";
import { useTimer } from "./timer";

/**
 * Slides list rows from where they were to where they are now (FLIP), so a
 * ticked task glides to the bottom instead of jumping. Skipped for users
 * who prefer reduced motion.
 */
function useSlideOnReorder(order: string) {
  const els = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top;
      const before = tops.current.get(id);
      tops.current.set(id, top);
      if (reduce || before === undefined || before === top) return;
      el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
        duration: 350,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
    });
  }, [order]);
  return (id: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  };
}

/**
 * Today's tasks as big round yes/no checkboxes. Ticks show at once and roll
 * back on error. With `doneLast`, ticked tasks move below the rest.
 */
export function TodayList({
  items,
  today,
  doneLast,
}: {
  items: DayItem[];
  today: string;
  doneLast: boolean;
}) {
  const [shown, change] = useOptimistic(
    items,
    (current, update: { habitId: string; done: boolean }) =>
      current.map((item) => (item.habitId === update.habitId ? { ...item, ...update } : item)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [timerFor, setTimerFor] = useState<string | null>(null); // task whose timer picker is open
  const timer = useTimer();
  const ordered = doneLast ? moveDoneLast(shown) : shown;
  const slideRef = useSlideOnReorder(ordered.map((i) => i.habitId).join());

  if (shown.length === 0) {
    return <p className="text-caption">No tasks today. Enjoy the day off! 🌴</p>;
  }

  const { done, total } = dayProgress(shown);

  function toggle(item: DayItem) {
    setError(undefined);
    startTransition(async () => {
      change({ habitId: item.habitId, done: !item.done });
      const result = await toggleCompletionAction(item.habitId, !item.done);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-caption" aria-live="polite">
        {done === total ? `All ${total} done! 🎉` : `${done} of ${total} done`}
      </p>
      <ul className="space-y-3">
        {ordered.map((item) => (
          <li key={item.habitId} ref={slideRef(item.habitId)} className="rounded-2xl bg-white shadow-pop">
            <div className="flex items-center gap-1 pr-2">
              <label className="flex shrink-0 cursor-pointer items-center gap-3 py-3 pl-4">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(item)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border-3 border-leaf bg-white text-white transition peer-checked:bg-leaf peer-focus-visible:ring-4 peer-focus-visible:ring-sky"
                >
                  {item.done && <IconCheck className="size-5" stroke={3.5} />}
                </span>
                <span className="w-8 shrink-0 text-center text-2xl" aria-hidden>
                  {iconEmoji(item.icon) ?? "•"}
                </span>
              </label>
              <div className="min-w-0 flex-1 py-3 pl-3">
                <TaskText
                  habitId={item.habitId}
                  name={item.name}
                  note={item.note}
                  done={item.done}
                  scope="today"
                />
              </div>
              <TimerButton
                item={item}
                open={timerFor === item.habitId}
                onToggle={() => setTimerFor((id) => (id === item.habitId ? null : item.habitId))}
              />
              <Link
                href={`/chronicle/${item.habitId}/edit?date=${today}`}
                aria-label={`Edit ${item.name}`}
                className="shrink-0 rounded-full p-2 text-caption transition hover:bg-sand hover:text-ink"
              >
                <IconPencil className="size-5" stroke={2.25} />
              </Link>
            </div>
            {timerFor === item.habitId && (
              <TimerPicker
                onStart={(minutes) => {
                  timer.start(item.habitId, item.name, minutes);
                  setTimerFor(null);
                }}
              />
            )}
          </li>
        ))}
      </ul>
      <FormMessage error={error} />
    </div>
  );
}

/** Hourglass that opens the timer picker; shows the time left while this task's timer runs. */
function TimerButton({ item, open, onToggle }: { item: DayItem; open: boolean; onToggle: () => void }) {
  const { state, now } = useTimer();
  const mine = state.status !== "idle" && state.habitId === item.habitId;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`Timer for ${item.name}`}
      className={`flex min-w-0 shrink-0 items-center gap-1 p-2 shadow-none transition hover:bg-sand ${
        mine ? "text-tangerine" : "text-caption hover:text-ink"
      }`}
    >
      <IconHourglassHigh aria-hidden className="size-5" stroke={2.25} />
      {mine && state.status !== "done" && (
        <span className="font-mono text-sm font-bold tabular-nums">{formatClock(remainingMs(state, now))}</span>
      )}
    </button>
  );
}

/** Minutes picker under a task: presets or a custom number, then Start. */
function TimerPicker({ onStart }: { onStart: (minutes: number) => void }) {
  const [custom, setCustom] = useState("");
  const minutes = parseMinutes(custom);
  return (
    <div className="flex flex-wrap items-center gap-2 border-t-2 border-sand px-4 py-3">
      {TIMER_PRESETS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onStart(m)}
          className="min-w-0 bg-sand px-3 py-1.5 font-bold transition hover:bg-sunny"
        >
          {m} min
        </button>
      ))}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (minutes) onStart(minutes);
        }}
      >
        <label className="sr-only" htmlFor="timer-minutes">
          Custom minutes
        </label>
        <input
          id="timer-minutes"
          type="number"
          min={1}
          max={TIMER_MAX_MINUTES}
          step={1}
          inputMode="numeric"
          placeholder="min"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="w-20 bg-white px-3 py-1.5 shadow-pop outline-none focus:ring-4 focus:ring-sunny"
        />
        <button
          type="submit"
          disabled={!minutes}
          className="min-w-0 bg-tangerine px-4 py-1.5 font-bold text-white disabled:opacity-50"
        >
          Start
        </button>
      </form>
    </div>
  );
}
