"use client";

import { useOptimistic, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { HABIT_NAME_MAX, HABIT_NOTE_MAX } from "@/lib/habit-form";
import { renameSeriesAction, renameTodayAction, setNoteAction } from "./actions";

/**
 * A task's name and note, each editable in place, shared by Today and Tasks.
 * `scope` says what a rename changes: "today" renames a repeating task for
 * today only; "series" renames it from its next day on (past days keep the
 * old name). Notes belong to the whole task either way. `children` sits
 * between the name and the note (the Tasks tab's repeat rule).
 */
export function TaskText({
  habitId,
  name,
  note,
  done = false,
  scope,
  children,
}: {
  habitId: string;
  name: string;
  note: string | null;
  done?: boolean;
  scope: "today" | "series";
  children?: ReactNode;
}) {
  const [shown, change] = useOptimistic(
    { name, note },
    (current, update: Partial<{ name: string; note: string | null }>) => ({ ...current, ...update }),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function rename(next: string) {
    setError(undefined);
    startTransition(async () => {
      change({ name: next });
      const rename = scope === "today" ? renameTodayAction : renameSeriesAction;
      const result = await rename(habitId, next);
      if (result.error) setError(result.error);
    });
  }

  function saveNote(next: string) {
    setError(undefined);
    startTransition(async () => {
      change({ note: next || null });
      const result = await setNoteAction(habitId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <>
      <TaskName name={shown.name} done={done} onRename={rename} />
      {children}
      <TaskNote name={shown.name} note={shown.note} onSave={saveNote} />
      {error && (
        <p role="alert" className="mt-1 text-cherry">
          {error}
        </p>
      )}
    </>
  );
}

/**
 * The task's name; click it to rename in place. Enter or leaving the box
 * saves, Escape cancels.
 */
function TaskName({
  name,
  done,
  onRename,
}: {
  name: string;
  done: boolean;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    const finish = (input: HTMLInputElement, save: boolean) => {
      setEditing(false);
      const next = input.value.trim().replace(/\s+/g, " ");
      if (save && next && next !== name) onRename(next);
    };
    return (
      <input
        defaultValue={name}
        aria-label={`Rename ${name}`}
        maxLength={HABIT_NAME_MAX}
        autoComplete="off"
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => finish(e.currentTarget, true)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") finish(e.currentTarget, false);
        }}
        className="-my-1 -ml-2 w-full bg-sand/60 px-2 py-1 font-bold shadow-none outline-none focus:ring-4 focus:ring-sunny"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to rename"
      className={`-ml-2 block min-w-0 max-w-full rounded-lg bg-transparent px-2 text-left font-bold break-words shadow-none transition hover:bg-sand/60 ${
        done ? "text-caption line-through" : ""
      }`}
    >
      {name}
    </button>
  );
}

/**
 * The task's note; click it to write. Leaving the box or Ctrl/Cmd+Enter
 * saves (an empty note removes it), Escape cancels. No note shows a faint
 * "Add a note".
 */
function TaskNote({
  name,
  note,
  onSave,
}: {
  name: string;
  note: string | null;
  onSave: (note: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    const finish = (box: HTMLTextAreaElement, save: boolean) => {
      setEditing(false);
      const next = box.value.trim();
      if (save && next !== (note ?? "")) onSave(next);
    };
    return (
      <textarea
        defaultValue={note ?? ""}
        aria-label={`Note for ${name}`}
        placeholder="Anything to remember, e.g. after lunch"
        maxLength={HABIT_NOTE_MAX}
        rows={2}
        autoFocus
        onBlur={(e) => finish(e.currentTarget, true)}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.blur();
          if (e.key === "Escape") finish(e.currentTarget, false);
        }}
        className="mt-1 -ml-2 block w-full resize-y bg-sand/60 px-2 py-1 text-gray-700 shadow-none outline-none focus:ring-4 focus:ring-sunny"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={note ? "Click to edit the note" : undefined}
      className={`mt-1 -ml-2 block min-w-0 max-w-full rounded-lg bg-transparent px-2 text-left break-words whitespace-pre-line shadow-none transition hover:bg-sand/60 ${
        note ? "text-gray-700" : "text-base text-caption/60"
      }`}
    >
      {note ?? "Add a note"}
    </button>
  );
}
