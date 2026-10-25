"use client";

import { IconCheck } from "@tabler/icons-react";
import { useOptimistic, useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { iconEmoji } from "@/lib/habit-icons";
import { dayProgress, type DayItem } from "@/lib/today";
import { toggleCompletionAction } from "./actions";

/** Today's tasks as big round yes/no checkboxes. Ticks show at once and roll back on error. */
export function TodayList({ items }: { items: DayItem[] }) {
  const [shown, setDone] = useOptimistic(items, (current, change: { habitId: string; done: boolean }) =>
    current.map((item) => (item.habitId === change.habitId ? { ...item, done: change.done } : item)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  if (shown.length === 0) {
    return <p className="text-caption">No tasks today. Enjoy the day off! 🌴</p>;
  }

  const { done, total } = dayProgress(shown);

  function toggle(item: DayItem) {
    setError(undefined);
    startTransition(async () => {
      setDone({ habitId: item.habitId, done: !item.done });
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
        {shown.map((item) => (
          <li key={item.habitId}>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop">
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
              <span
                className={`min-w-0 font-bold break-words transition ${
                  item.done ? "text-caption line-through" : ""
                }`}
              >
                {item.name}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <FormMessage error={error} />
    </div>
  );
}
