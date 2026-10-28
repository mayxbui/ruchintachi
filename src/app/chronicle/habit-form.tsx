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
import { END_COUNT_MAX, HABIT_NAME_MAX, HABIT_NOTE_MAX, INTERVAL_MAX } from "@/lib/habit-form";
import { HABIT_ICONS, type HabitIcon } from "@/lib/habit-icons";
import { LIST_NAME_MAX, NEW_LIST } from "@/lib/task-lists";
import type { EndType, Frequency } from "@/lib/repeat-rule";
import type { HabitFormState } from "./actions";
import { DueTag } from "./due-tag";

/** The Repeats menu: the presets, or Custom (every N, nth weekday). */
type RepeatChoice = Frequency | "custom";
type Unit = Exclude<Frequency, "none">;

const REPEATS: { value: RepeatChoice; label: string }[] = [
  { value: "none", label: "Just once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

const UNIT_NAMES: Record<Unit, string> = { daily: "day", weekly: "week", monthly: "month", annually: "year" };

// Monthly on: the same day ("day"), or the 1st–4th / last weekday.
type MonthPosition = "day" | "1" | "2" | "3" | "4" | "-1";
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  interval: number;
  monthWeek: number | null;
  monthWeekday: number | null;
  endType: EndType;
  endDate: string | null;
  endCount: number | null;
  dueDate?: string | null;
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
  // A saved habit opens on Custom when a preset can't show it.
  const isCustom = !!initial && (initial.interval > 1 || initial.monthWeek != null);
  const [repeat, setRepeat] = useState<RepeatChoice>(isCustom ? "custom" : (initial?.frequency ?? "daily"));
  const [unit, setUnit] = useState<Unit>(
    initial && initial.frequency !== "none" ? initial.frequency : "weekly",
  );
  const [everyText, setEveryText] = useState(String(initial?.interval ?? 1));
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? []);
  const [endType, setEndType] = useState<EndType>(initial?.endType ?? "never");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [endCount, setEndCount] = useState(String(initial?.endCount ?? 10));
  const [note, setNote] = useState(initial?.note ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [listId, setListId] = useState(initial?.listId ?? defaultListId ?? "");
  const [newListName, setNewListName] = useState("");

  const weekOrder = weekStart === "monday" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const startWeekday = new Date(`${startDate || today}T00:00:00Z`).getUTCDay();
  const startDay = Number((startDate || today).slice(8, 10));

  // Monthly on the nth weekday; by default the start date's own (e.g. "4th Sunday").
  const [monthPosition, setMonthPosition] = useState<MonthPosition>(
    initial?.monthWeek != null ? (String(initial.monthWeek) as MonthPosition) : "day",
  );
  const [monthWeekday, setMonthWeekday] = useState(initial?.monthWeekday ?? startWeekday);

  // What gets saved: Custom posts its unit and every-N; presets are every 1.
  const custom = repeat === "custom";
  const frequency: Frequency = custom ? unit : repeat;
  const every = custom ? Number(everyText) || 1 : 1;
  const byWeekday = custom && unit === "monthly" && monthPosition !== "day";
  const plural = every === 1 ? "" : "s";

  // Weekly starts with the start date's weekday ticked.
  function startWeekly(next: Frequency) {
    if (next === "weekly" && weekdays.length === 0) setWeekdays([startWeekday]);
  }

  function chooseRepeat(value: RepeatChoice) {
    setRepeat(value);
    startWeekly(value === "custom" ? unit : value);
    // Only one-off tasks have a due date.
    if (value !== "none") setDueDate("");
  }

  // Due dates are for one-off tasks, so picking one makes the task "Just once".
  function chooseDueDate(date: string) {
    setDueDate(date);
    if (repeat !== "none") setRepeat("none");
  }

  function chooseUnit(value: Unit) {
    setUnit(value);
    startWeekly(value);
  }

  function chooseMonthPosition(value: MonthPosition) {
    setMonthPosition(value);
    if (value !== "day") setMonthWeekday(startWeekday);
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
        interval: every,
        monthWeek: byWeekday ? Number(monthPosition) : null,
        monthWeekday: byWeekday ? monthWeekday : null,
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
        <DatePicker
          label="Due date (optional)"
          name="dueDate"
          value={dueDate}
          onChange={chooseDueDate}
          onClear={() => setDueDate("")}
          placeholder="No due date"
          min={startDate || today}
          today={today}
          weekStart={weekStart}
          align="right"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Dropdown label="Repeats" name="repeat" value={repeat} options={REPEATS} onChange={chooseRepeat} />
      </div>
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="interval" value={every} />
      <input type="hidden" name="monthWeek" value={byWeekday ? monthPosition : ""} />
      <input type="hidden" name="monthWeekday" value={byWeekday ? monthWeekday : ""} />

      {custom && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <label className="block min-w-0">
            <span className="mb-1 block font-bold">Every</span>
            <input
              type="number"
              value={everyText}
              min={1}
              max={INTERVAL_MAX}
              step={1}
              inputMode="numeric"
              onChange={(e) => setEveryText(e.target.value)}
              required
              className={pairedClass}
            />
          </label>
          <Dropdown
            label="Unit"
            name="unit"
            value={unit}
            options={(Object.keys(UNIT_NAMES) as Unit[]).map((u) => ({
              value: u,
              label: `${UNIT_NAMES[u]}${plural}`,
            }))}
            onChange={chooseUnit}
          />
        </div>
      )}

      {custom && unit === "monthly" && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Dropdown
            label="On"
            name="monthPosition"
            value={monthPosition}
            options={[
              { value: "day", label: `Day ${startDay}` },
              { value: "1", label: "The 1st" },
              { value: "2", label: "The 2nd" },
              { value: "3", label: "The 3rd" },
              { value: "4", label: "The 4th" },
              { value: "-1", label: "The last" },
            ]}
            onChange={chooseMonthPosition}
          />
          {byWeekday && (
            <Dropdown
              label="Weekday"
              name="monthWeekdayPick"
              value={String(monthWeekday)}
              options={WEEKDAY_NAMES.map((label, i) => ({ value: String(i), label }))}
              onChange={(v) => setMonthWeekday(Number(v))}
            />
          )}
        </div>
      )}

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
          {frequency === "none" && dueDate && <DueTag dueDate={dueDate} today={today} />}
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
