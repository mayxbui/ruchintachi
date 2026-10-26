"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import type { WeekStart } from "@/lib/dates";
import { HABIT_NAME_MAX } from "@/lib/habit-form";
import type { EditScope } from "@/lib/habit-edit";
import type { HabitFormState } from "../../actions";
import { HabitForm, type HabitFormInitial } from "../../habit-form";

type FormAction = (prev: HabitFormState, formData: FormData) => Promise<HabitFormState>;
type DeleteAction = () => Promise<HabitFormState>;

const SCOPES: { value: EditScope; label: string }[] = [
  { value: "day", label: "Only this day" },
  { value: "future", label: "This day and future" },
];

/**
 * Edit panel for one day of a habit. Repeating habits choose a scope first:
 * "only this day" can rename or skip that date; "this day and future" edits
 * the whole series from that date on. One-off habits are edited whole.
 */
export function EditHabit({
  repeating,
  dateLabel,
  dayName,
  returnTo,
  today,
  weekStart,
  initial,
  lists,
  editDay,
  editFuture,
  deleteDay,
  deleteFuture,
}: {
  repeating: boolean;
  dateLabel: string;
  dayName: string;
  returnTo: string;
  today: string;
  weekStart: WeekStart;
  initial: HabitFormInitial;
  lists: { id: string; name: string }[];
  editDay: FormAction;
  editFuture: FormAction;
  deleteDay: DeleteAction;
  deleteFuture: DeleteAction;
}) {
  const [scope, setScope] = useState<EditScope>(repeating ? "day" : "future");
  const deleteAction = scope === "day" ? deleteDay : deleteFuture;
  const deleteLabel = !repeating
    ? "Delete task"
    : scope === "day"
      ? "Skip this day"
      : "Delete this day and future";

  return (
    <div className="space-y-6">
      <p className="text-caption">
        {repeating ? `Changing ${dateLabel}` : `On ${dateLabel}`}. Past days stay as they were.
      </p>

      {repeating && (
        <fieldset>
          <legend className="sr-only">What to change</legend>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <label key={s.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value={s.value}
                  checked={scope === s.value}
                  onChange={() => setScope(s.value)}
                  className="peer sr-only"
                />
                <span className="block rounded-full bg-white px-4 py-2 font-bold text-slate-500 shadow-pop transition peer-checked:bg-tangerine peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sky">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {scope === "day" && repeating ? (
        <RenameDay key="day" action={editDay} dayName={dayName} returnTo={returnTo} />
      ) : (
        <HabitForm
          key="future"
          today={today}
          weekStart={weekStart}
          action={editFuture}
          initial={initial}
          lists={lists}
          lockStartDate={repeating}
          cancelHref={returnTo}
          submitLabel="Save"
          pendingLabel="Saving…"
        />
      )}

      <DeleteButton key={`delete-${scope}`} action={deleteAction} label={deleteLabel} />
    </div>
  );
}

/** "Only this day": give that one date a different name. */
function RenameDay({
  action,
  dayName,
  returnTo,
}: {
  action: FormAction;
  dayName: string;
  returnTo: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [name, setName] = useState(dayName);
  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block font-bold">Name for this day</span>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={HABIT_NAME_MAX}
          autoComplete="off"
          className="w-full bg-white px-4 py-3 shadow-pop outline-none focus:ring-4 focus:ring-sunny"
        />
      </label>
      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        <Link href={returnTo} className="font-bold text-caption hover:brightness-75">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Red delete button that asks once before deleting. */
function DeleteButton({ action, label }: { action: DeleteAction; label: string }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`${label}?`)) e.preventDefault();
      }}
      className="space-y-3 border-t-2 border-sand-deep pt-5"
    >
      <FormMessage error={state.error} />
      <SubmitButton tone="cherry" pendingLabel="Deleting…">
        {label}
      </SubmitButton>
    </form>
  );
}
