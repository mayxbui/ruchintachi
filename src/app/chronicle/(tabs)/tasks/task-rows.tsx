"use client";

import { IconChevronDown, IconChevronUp, IconGripVertical, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { FormMessage } from "@/components/form";
import { reorderHabitsAction } from "../../actions";
import { TaskIcon } from "../../task-icon";
import { TaskText } from "../../task-text";
import { useDragReorder } from "../../use-drag-reorder";

export interface TaskRow {
  id: string;
  name: string;
  note: string | null;
  icon: string | null;
  subtitle: string; // next date or repeat rule
  listTag: string | null; // the task's list, unless we're looking at that list
  editHref: string;
}

/**
 * The Tasks tab's rows. With `reorderable` (the Custom sort) each row has a
 * drag handle (mouse or finger) and up/down buttons for keyboards and
 * screen readers; the new order is saved when the drag ends.
 */
export function TaskRows({ rows, reorderable }: { rows: TaskRow[]; reorderable: boolean }) {
  const drag = useDragReorder(
    rows.map((r) => r.id),
    reorderHabitsAction,
  );

  const byId = new Map(rows.map((r) => [r.id, r]));
  const shown = drag.order.flatMap((id) => byId.get(id) ?? []);

  return (
    <>
      <ul className="space-y-5">
        {shown.map((row, i) => {
          const dragging = drag.draggingId === row.id;
          return (
            <li
              key={row.id}
              ref={drag.rowRef(row.id)}
              style={drag.rowStyle(row.id)}
              className={`relative flex items-center gap-3 rounded-2xl bg-white py-3 pr-4 shadow-pop ${
                reorderable ? "pl-1" : "pl-4"
              } ${dragging ? "z-10 scale-[1.02] ring-4 ring-sunny" : ""}`}
            >
              {reorderable && (
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
    </>
  );
}
