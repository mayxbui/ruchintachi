"use client";

import { IconChevronDown, IconChevronUp, IconGripVertical, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { useRef, useState, useTransition, type PointerEvent } from "react";
import { FormMessage } from "@/components/form";
import { reorderHabitsAction } from "../../actions";
import { TaskText } from "../../task-text";

export interface TaskRow {
  id: string;
  name: string;
  note: string | null;
  emoji: string;
  subtitle: string; // next date or repeat rule
  listTag: string | null; // the task's list, unless we're looking at that list
  editHref: string;
}

type Drag = { id: string; startY: number; offset: number; moved: boolean };

/** Where `el` sits in the layout, ignoring the drag's translate. */
function layoutRect(el: HTMLElement, offset: number) {
  const r = el.getBoundingClientRect();
  return { top: r.top - offset, bottom: r.bottom - offset, mid: r.top - offset + r.height / 2 };
}

/**
 * The Tasks tab's rows. With `reorderable` (the Custom sort) each row has a
 * drag handle (mouse or finger) and up/down buttons for keyboards and
 * screen readers; the new order is saved when the drag ends.
 */
export function TaskRows({ rows, reorderable }: { rows: TaskRow[]; reorderable: boolean }) {
  const [order, setOrder] = useState(() => rows.map((r) => r.id));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const els = useRef(new Map<string, HTMLLIElement>());

  // New rows from the server (a task added or the filter changed) reset the order.
  const ids = rows.map((r) => r.id).join();
  const [seen, setSeen] = useState(ids);
  if (ids !== seen) {
    setSeen(ids);
    setOrder(rows.map((r) => r.id));
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const shown = order.flatMap((id) => byId.get(id) ?? []);

  function save(next: string[]) {
    setError(undefined);
    startTransition(async () => {
      const result = await reorderHabitsAction(next);
      if (result.error) {
        setError(result.error);
        setOrder(rows.map((r) => r.id));
      }
    });
  }

  function move(id: string, by: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + by;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    save(next);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, startY: e.clientY, offset: 0, moved: false });
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    let { startY } = drag;
    const offset = e.clientY - startY;
    const index = order.indexOf(drag.id);
    const self = els.current.get(drag.id);
    if (!self) return;
    const me = layoutRect(self, drag.offset);
    // Swap with a neighbour once the pointer passes its middle; shift the
    // start point by the same distance so the row stays under the pointer.
    const below = els.current.get(order[index + 1]);
    const above = els.current.get(order[index - 1]);
    let next = order;
    if (below && offset > 0 && e.clientY > layoutRect(below, 0).mid) {
      startY += layoutRect(below, 0).bottom - me.bottom;
      next = [...order];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    } else if (above && offset < 0 && e.clientY < layoutRect(above, 0).mid) {
      startY -= me.top - layoutRect(above, 0).top;
      next = [...order];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    }
    if (next !== order) setOrder(next);
    setDrag({ id: drag.id, startY, offset: e.clientY - startY, moved: drag.moved || next !== order });
  }

  function onPointerUp() {
    if (drag?.moved) save(order);
    setDrag(null);
  }

  return (
    <>
      <ul className="space-y-5">
        {shown.map((row, i) => {
          const dragging = drag?.id === row.id;
          return (
            <li
              key={row.id}
              ref={(el) => {
                if (el) els.current.set(row.id, el);
                else els.current.delete(row.id);
              }}
              style={dragging ? { transform: `translateY(${drag.offset}px)` } : undefined}
              className={`relative flex items-start gap-3 rounded-2xl bg-white py-3 pr-4 shadow-pop ${
                reorderable ? "pl-1" : "pl-4"
              } ${dragging ? "z-10 scale-[1.02] ring-4 ring-sunny" : ""}`}
            >
              {reorderable && (
                <button
                  type="button"
                  aria-label={`Drag to reorder ${row.name}`}
                  onPointerDown={(e) => onPointerDown(e, row.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  tabIndex={-1}
                  className="min-w-0 shrink-0 cursor-grab touch-none self-stretch bg-transparent px-1 text-caption shadow-none active:cursor-grabbing"
                >
                  <IconGripVertical className="size-5" stroke={2.25} />
                </button>
              )}
              <span className="w-8 shrink-0 text-center text-2xl" aria-hidden>
                {row.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <TaskText habitId={row.id} name={row.name} note={row.note} scope="series">
                  <span className="block text-caption text-sm">
                    {row.subtitle}
                    {row.listTag && (
                      <span className="ml-2 inline-block rounded-full bg-sky/15 px-2 font-bold text-sky">
                        {row.listTag}
                      </span>
                    )}
                  </span>
                </TaskText>
              </div>
              {reorderable && (
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(row.id, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${row.name} up`}
                    className="min-w-0 bg-transparent p-1 text-caption shadow-none hover:text-ink disabled:opacity-30"
                  >
                    <IconChevronUp className="size-4" stroke={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(row.id, 1)}
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
        <FormMessage error={error} />
      </div>
    </>
  );
}
