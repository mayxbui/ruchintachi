"use client";

import { IconPlus } from "@tabler/icons-react";
import { useActionState } from "react";
import { HABIT_NAME_MAX } from "@/lib/habit-form";
import { quickAddTaskAction } from "./actions";

/**
 * Type a name, press Enter: a one-off task for today. React resets the
 * input after each successful add.
 */
export function QuickAdd() {
  const [state, formAction, pending] = useActionState(quickAddTaskAction, {});
  return (
    <form action={formAction} className="mb-3">
      <div className="flex items-center gap-2 rounded-full bg-white py-1 pr-2 pl-4 shadow-pop focus-within:ring-4 focus-within:ring-sunny">
        <input
          name="name"
          aria-label="Add a task for today"
          placeholder="Add a task for today…"
          required
          maxLength={HABIT_NAME_MAX}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-1.5 px-1 shadow-none outline-none"
        />
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
