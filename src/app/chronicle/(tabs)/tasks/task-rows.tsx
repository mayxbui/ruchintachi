"use client";

import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconFolderSymlink,
  IconGripVertical,
  IconListCheck,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useRef, useState, useTransition, type ReactNode } from "react";
import { FormMessage } from "@/components/form";
import { useDismiss } from "@/components/use-dismiss";
import { iconEmoji } from "@/lib/habit-icons";
import { bulkDeleteAction, bulkMoveAction, reorderHabitsAction } from "../../actions";
import { DueTag } from "../../due-tag";
import { TaskIcon } from "../../task-icon";
import { TaskText } from "../../task-text";
import { useDragReorder } from "../../use-drag-reorder";

export interface TaskRow {
  id: string;
  name: string;
  note: string | null;
  icon: string | null;
  subtitle: string; // next date or repeat rule
  dueDate: string | null; // a one-off task's deadline, until it's done
  listTag: string | null; // the task's list, unless we're looking at that list
  editHref: string;
}

/** The same round check as Today's tasks, for picking rows. */
function RoundCheck({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full border-3 border-leaf bg-white text-white transition peer-checked:bg-leaf peer-focus-visible:ring-4 peer-focus-visible:ring-sky"
    >
      {checked && <IconCheck className="size-4" stroke={3.5} />}
    </span>
  );
}

/**
 * The Tasks tab's rows. With `reorderable` (the Custom sort) each row has a
 * drag handle (mouse or finger) and up/down buttons for keyboards and
 * screen readers; the new order is saved when the drag ends.
 *
 * "Bulk edit" (beside `sortMenu`) swaps the row controls for checkboxes and
 * shows a bar to move the picked tasks to a list or delete them.
 */
export function TaskRows({
  rows,
  reorderable,
  sortMenu,
  lists,
  today,
}: {
  rows: TaskRow[];
  reorderable: boolean;
  sortMenu: ReactNode;
  lists: { id: string; name: string }[];
  today: string;
}) {
  const drag = useDragReorder(
    rows.map((r) => r.id),
    reorderHabitsAction,
  );
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  const byId = new Map(rows.map((r) => [r.id, r]));
  const shown = drag.order.flatMap((id) => byId.get(id) ?? []);
  // Rows can vanish after a save; only count the ones still here.
  const chosen = shown.filter((r) => picked.has(r.id)).map((r) => r.id);
  const allPicked = chosen.length === shown.length;
  const canReorder = reorderable && !selecting;

  function toggle(id: string) {
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setPicked(new Set());
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {selecting && (
          <label className="mr-auto flex cursor-pointer items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={allPicked}
              onChange={() => setPicked(allPicked ? new Set() : new Set(shown.map((r) => r.id)))}
              className="peer sr-only"
            />
            <RoundCheck checked={allPicked} />
            Select all
            <span className="font-normal text-caption" aria-live="polite">
              ({chosen.length} picked)
            </span>
          </label>
        )}
        <button
          type="button"
          onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
          aria-pressed={selecting}
          className={`flex min-w-0 items-center gap-1.5 px-3 py-1.5 font-bold transition ${
            selecting ? "bg-sky text-white" : "bg-white text-slate-500 hover:text-ink"
          }`}
        >
          <IconListCheck aria-hidden className="size-5" stroke={2.25} />
          {selecting ? "Done" : "Bulk edit"}
        </button>
        {sortMenu}
      </div>

      <ul className="space-y-5">
        {shown.map((row, i) => {
          const dragging = drag.draggingId === row.id;
          const details = (
            <span className="block text-caption text-sm">
              {row.subtitle}
              {row.dueDate && (
                <span className="ml-2">
                  <DueTag dueDate={row.dueDate} today={today} />
                </span>
              )}
              {row.listTag && (
                <span className="ml-2 inline-block rounded-full bg-sky/15 px-2 font-bold text-sky">
                  {row.listTag}
                </span>
              )}
            </span>
          );

          if (selecting) {
            const on = picked.has(row.id);
            const emoji = iconEmoji(row.icon);
            return (
              <li key={row.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-white py-3 pr-4 pl-4 shadow-pop transition ${
                    on ? "ring-4 ring-leaf/60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(row.id)}
                    aria-label={`Pick ${row.name}`}
                    className="peer sr-only"
                  />
                  <RoundCheck checked={on} />
                  {emoji && (
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center text-xl">
                      {emoji}
                    </span>
                  )}
                  <span className="block min-w-0 flex-1">
                    <TaskText habitId={row.id} name={row.name} note={row.note} scope="series" readOnly>
                      {details}
                    </TaskText>
                  </span>
                </label>
              </li>
            );
          }

          return (
            <li
              key={row.id}
              ref={drag.rowRef(row.id)}
              style={drag.rowStyle(row.id)}
              className={`relative flex items-center gap-3 rounded-2xl bg-white py-3 pr-4 shadow-pop ${
                canReorder ? "pl-1" : "pl-4"
              } ${dragging ? "z-10 scale-[1.02] ring-4 ring-sunny" : ""}`}
            >
              {canReorder && (
                <button
                  type="button"
                  aria-label={`Drag to reorder ${row.name}`}
                  {...drag.handleProps(row.id)}
                  tabIndex={-1}
                  className="min-w-0 shrink-0 cursor-grab touch-none self-stretch bg-transparent px-1 text-caption shadow-none active:cursor-grabbing"
                >
                  <IconGripVertical className="size-5" stroke={2.25} />
                </button>
              )}
              <TaskIcon habitId={row.id} icon={row.icon} name={row.name} />
              <div className="min-w-0 flex-1">
                <TaskText habitId={row.id} name={row.name} note={row.note} scope="series" edit="double-click">
                  {details}
                </TaskText>
              </div>
              {canReorder && (
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => drag.move(row.id, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${row.name} up`}
                    className="min-w-0 bg-transparent p-1 text-caption shadow-none hover:text-ink disabled:opacity-30"
                  >
                    <IconChevronUp className="size-4" stroke={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => drag.move(row.id, 1)}
                    disabled={i === shown.length - 1}
                    aria-label={`Move ${row.name} down`}
                    className="min-w-0 bg-transparent p-1 text-caption shadow-none hover:text-ink disabled:opacity-30"
                  >
                    <IconChevronDown className="size-4" stroke={2.5} />
                  </button>
                </span>
              )}
              <Link
                href={row.editHref}
                aria-label={`Edit ${row.name}`}
                className="shrink-0 rounded-full p-2 text-caption transition hover:bg-sand hover:text-ink"
              >
                <IconPencil className="size-5" stroke={2.25} />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-3">
        <FormMessage error={drag.error} />
      </div>
      {selecting && chosen.length > 0 && <BulkBar ids={chosen} lists={lists} onDone={stopSelecting} />}
    </>
  );
}

/**
 * The bar under the picked rows: move them to a list, or delete them (after
 * a confirm). Sticks to the bottom of the screen while scrolling.
 */
function BulkBar({
  ids,
  lists,
  onDone,
}: {
  ids: string[];
  lists: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [moving, setMoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const menu = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMoving(false), []);
  useDismiss(moving, closeMenu, menu);

  const tasks = `${ids.length} task${ids.length === 1 ? "" : "s"}`;

  function run(action: () => Promise<{ error?: string }>) {
    setError(undefined);
    setMoving(false);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <div
      role="region"
      aria-label="Bulk edit"
      className="sticky bottom-4 z-10 mt-5 rounded-3xl bg-sunny p-3 shadow-pop"
    >
      {confirming ? (
        <div role="alertdialog" aria-label={`Delete ${tasks}`}>
          <p className="font-bold">Delete {tasks}?</p>
          <p className="text-sm text-caption">
            They go from today on. Past days and ticks stay in your history.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => bulkDeleteAction(ids))}
              className="bg-cherry px-4 py-2 font-bold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {pending ? "Deleting…" : `Delete ${tasks}`}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-w-0 bg-transparent px-2 font-bold text-caption shadow-none hover:brightness-75"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto font-bold">{tasks}</span>
          <div ref={menu} className="relative">
            <button
              type="button"
              disabled={pending}
              onClick={() => setMoving((m) => !m)}
              aria-expanded={moving}
              aria-haspopup="true"
              className="flex min-w-0 items-center gap-1.5 bg-white px-3 py-2 font-bold transition hover:brightness-105 disabled:opacity-60"
            >
              <IconFolderSymlink aria-hidden className="size-5" stroke={2.25} />
              {pending ? "Saving…" : "Move to list"}
            </button>
            {moving && (
              // Opens upwards: the bar sits at the bottom of the screen.
              <div
                role="menu"
                className="absolute right-0 bottom-full z-20 mb-2 max-h-72 w-56 overflow-y-auto rounded-3xl bg-white p-2 shadow-pop"
              >
                {[{ id: null, name: "No list" }, ...lists].map((list) => (
                  <button
                    key={list.id ?? "none"}
                    type="button"
                    role="menuitem"
                    onClick={() => run(() => bulkMoveAction(ids, list.id))}
                    className={`block w-full min-w-0 truncate rounded-2xl bg-transparent px-3 py-2 text-left font-bold shadow-none transition hover:bg-sand ${
                      list.id ? "" : "text-caption"
                    }`}
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className="flex min-w-0 items-center gap-1.5 bg-cherry px-3 py-2 font-bold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            <IconTrash aria-hidden className="size-5" stroke={2.25} />
            Delete
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}
