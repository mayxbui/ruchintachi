"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { DatePicker } from "@/components/date-picker";
import { Dropdown } from "@/components/dropdown";
import { FormMessage, SubmitButton } from "@/components/form";
import { IconPicker } from "@/components/icon-picker";
import type { WeekStart } from "@/lib/dates";
import { describeRule, formatDate } from "@/lib/describe-rule";
import { END_COUNT_MAX, HABIT_NAME_MAX, HABIT_NOTE_MAX } from "@/lib/habit-form";
import { HABIT_ICONS, type HabitIcon } from "@/lib/habit-icons";
import { LIST_NAME_MAX, NEW_LIST } from "@/lib/task-lists";
import type { EndType, Frequency } from "@/lib/repeat-rule";
import type { HabitFormState } from "./actions";

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
  { value: "after_count", label: "# times" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fieldClass = "w-full bg-white py-3 shadow-pop outline-none focus:ring-4 focus:ring-sunny";
const inputClass = `${fieldClass} px-4`;
// Half-width fields sit two to a row, so they're tighter on phones.
const pairedClass = `${fieldClass} px-2.5 text-[15px] sm:px-4 sm:text-lg`;

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

/** Starting values when editing an existing habit. */
export interface HabitFormInitial {
  name: string;
  icon: HabitIcon | null;
  note: string | null;
  startDate: string;
  frequency: Frequency;
  weekdays: number[] | null;
  endType: EndType;
  endDate: string | null;
  endCount: number | null;
  listId?: string | null;
}

/**
 * The create/edit task form. `lockStartDate` keeps the start date fixed
 * (a "this day and future" edit starts on the chosen day).
 */
export function HabitForm({
  today,
  weekStart,
  action,
  initial,
  lists = [],
  defaultListId,
  lockStartDate = false,
  cancelHref = "/chronicle",
  submitLabel,
  pendingLabel,
}: {
  today: string;
  weekStart: WeekStart;
  action: (prev: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  initial?: HabitFormInitial;
  /** The user's own lists. "+ New list" makes one when the task is saved. */
  lists?: { id: string; name: string }[];
  /** List picked to start with when creating (opened from that list). */
  defaultListId?: string;
  lockStartDate?: boolean;
  cancelHref?: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  // Controlled fields, so nothing is lost when the server sends back an error.
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState<HabitIcon | null>(initial?.icon ?? null);
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? []);
  const [endType, setEndType] = useState<EndType>(initial?.endType ?? "never");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [endCount, setEndCount] = useState(String(initial?.endCount ?? 10));
  const [note, setNote] = useState(initial?.note ?? "");
  const [listId, setListId] = useState(initial?.listId ?? defaultListId ?? "");
  const [newListName, setNewListName] = useState("");

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
      <div>
        <label htmlFor="habit-name" className="mb-1 block font-bold">
          Name
        </label>
        <div className="flex gap-2">
          <input type="hidden" name="icon" value={icon ?? ""} />
          <IconPicker value={icon} onChange={setIcon} />
          <input
            id="habit-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={HABIT_NAME_MAX}
            placeholder="Drink a glass of water"
            autoComplete="off"
            className={`min-w-0 flex-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {lockStartDate ? (
          <div className="min-w-0">
            <span className="mb-1 block font-bold">Starts</span>
            <input type="hidden" name="startDate" value={startDate} />
            <p className={`${pairedClass} truncate`}>{formatDate(startDate)}</p>
          </div>
        ) : (
          <DatePicker
            label="Start date"
            name="startDate"
            value={startDate}
            onChange={setStartDate}
            min={today}
            today={today}
            weekStart={weekStart}
          />
        )}
        <Dropdown
          label="Repeats"
          name="frequency"
          value={frequency}
          options={FREQUENCIES}
          onChange={chooseFrequency}
        />
      </div>

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
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Dropdown
            label="Ends"
            name="endType"
            value={endType}
            options={END_TYPES}
            onChange={setEndType}
          />
          {endType === "on_date" && (
            <DatePicker
              label="Last day"
              name="endDate"
              value={endDate}
              onChange={setEndDate}
              min={startDate || today}
              today={today}
              weekStart={weekStart}
              align="right"
            />
          )}
          {endType === "after_count" && (
            <label className="block min-w-0">
              <span className="mb-1 block font-bold">How many</span>
              <input
                type="number"
                name="endCount"
                value={endCount}
                min={1}
                max={END_COUNT_MAX}
                step={1}
                onChange={(e) => setEndCount(e.target.value)}
                required
                className={pairedClass}
              />
            </label>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Dropdown
          label="List"
          name="listId"
          value={listId}
          options={[
            { value: "", label: "No list" },
            ...lists.map((l) => ({ value: l.id, label: l.name })),
            { value: NEW_LIST, label: "+ New list" },
          ]}
          onChange={setListId}
        />
        {listId === NEW_LIST && (
          <label className="block min-w-0">
            <span className="mb-1 block font-bold">List name</span>
            <input
              name="newListName"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              required
              maxLength={LIST_NAME_MAX}
              placeholder="e.g. Health"
              autoComplete="off"
              autoFocus
              className={pairedClass}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block font-bold">
          Note <span className="font-normal text-caption">(optional)</span>
        </span>
        <textarea
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={HABIT_NOTE_MAX}
          rows={3}
          placeholder="Anything to remember, e.g. after lunch"
          className={`resize-y ${inputClass}`}
        />
      </label>

      {summary && (
        <p className="rounded-2xl bg-sunny/30 px-4 py-3">
          {icon && <span className="mr-2 text-xl">{HABIT_ICONS[icon]}</span>}
          <span className="font-bold">{name.trim() || "Your task"}</span>
          <span className="block text-caption">{summary}</span>
        </p>
      )}

      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="font-bold text-caption hover:brightness-75">
          Cancel
        </Link>
      </div>
    </form>
  );
}
