"use client";

import { IconChevronDown } from "@tabler/icons-react";
import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { HABIT_NAME_MAX, HABIT_NOTE_MAX } from "@/lib/habit-form";
import { renameSeriesAction, renameTodayAction, setNoteAction } from "./actions";

/**
 * A task's name and note, each editable in place, shared by Today and Tasks.
 * `scope` says what a rename changes: "today" renames a repeating task for
 * today only; "series" renames it from its next day on (past days keep the
 * old name). Notes belong to the whole task either way. `children` sits
 * between the name and the note (the Tasks tab's repeat rule).
 *
 * `edit` says how editing starts: "click" (Today), or "double-click" (Tasks),
 * where a click instead folds or unfolds a long note. `readOnly` shows plain
 * text, e.g. while bulk edit is selecting rows.
 */
export function TaskText({
  habitId,
  name,
  note,
  done = false,
  scope,
  edit = "click",
  readOnly = false,
  children,
}: {
  habitId: string;
  name: string;
  note: string | null;
  done?: boolean;
  scope: "today" | "series";
  edit?: EditGesture;
  readOnly?: boolean;
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

  if (readOnly) {
    return (
      <>
        <span className="block font-bold break-words">{shown.name}</span>
        {children}
        {shown.note && (
          <span className="mt-1 line-clamp-2 break-words whitespace-pre-line text-gray-700">
            {shown.note}
          </span>
        )}
      </>
    );
  }

  return (
    <>
      <TaskName name={shown.name} done={done} edit={edit} onRename={rename} />
      {children}
      {edit === "click" ? (
        <TaskNote name={shown.name} note={shown.note} onSave={saveNote} />
      ) : (
        <FoldingNote name={shown.name} note={shown.note} onSave={saveNote} />
      )}
      {error && (
        <p role="alert" className="mt-1 text-cherry">
          {error}
        </p>
      )}
    </>
  );
}

type EditGesture = "click" | "double-click";

/** F2 starts editing where a click doesn't (the double-click rows). */
const isF2 = (e: KeyboardEvent) => e.key === "F2";

/**
 * The task's name; click (or double-click, then F2 from the keyboard) to
 * rename in place. Enter or leaving the box saves, Escape cancels.
 */
function TaskName({
  name,
  done,
  edit,
  onRename,
}: {
  name: string;
  done: boolean;
  edit: EditGesture;
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

  const click = edit === "click";
  return (
    <button
      type="button"
      onClick={click ? () => setEditing(true) : undefined}
      onDoubleClick={click ? undefined : () => setEditing(true)}
      onKeyDown={click ? undefined : (e) => isF2(e) && setEditing(true)}
      data-hint={click ? "Click to rename" : "Double-click (or F2) to rename"}
      className={`-ml-2 block min-w-0 max-w-full rounded-lg bg-transparent px-2 text-left font-bold break-words shadow-none transition hover:bg-sand/60 ${
        done ? "text-caption line-through" : ""
      }`}
    >
      {name}
    </button>
  );
}

/** The note's text box, shared by both note styles. */
function NoteEditor({
  name,
  note,
  onDone,
}: {
  name: string;
  note: string | null;
  onDone: (next: string | null) => void; // null = cancelled
}) {
  const finish = (box: HTMLTextAreaElement, save: boolean) => onDone(save ? box.value.trim() : null);
  // Tall enough to show the note (roughly 45 characters a line), 2–8 lines.
  const lines = (note ?? "")
    .split("\n")
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 45)), 0);
  return (
    <textarea
      defaultValue={note ?? ""}
      aria-label={`Note for ${name}`}
      placeholder="Anything to remember, e.g. after lunch"
      maxLength={HABIT_NOTE_MAX}
      rows={Math.min(8, Math.max(2, lines))}
      autoFocus
      onBlur={(e) => finish(e.currentTarget, true)}
      onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.blur();
        if (e.key === "Escape") finish(e.currentTarget, false);
      }}
      className="mt-1 -ml-3 block w-full resize-y rounded-xl bg-sand/60 px-3 py-2 text-gray-700 shadow-none outline-none focus:ring-4 focus:ring-sunny"
    />
  );
}

/**
 * The Tasks tab's note: a long one folds to two lines, and a click unfolds
 * or folds it; double-click (or F2) edits. With no note, a click writes one.
 */
function FoldingNote({
  name,
  note,
  onSave,
}: {
  name: string;
  note: string | null;
  onSave: (note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const text = useRef<HTMLSpanElement>(null);

  // Long = more than two lines at the current width, folded or not.
  useEffect(() => {
    const el = text.current;
    if (!el) return;
    const measure = () => {
      const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
      setLong(el.scrollHeight > line * 2 + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [note, editing]);

  if (editing) {
    return (
      <NoteEditor
        name={name}
        note={note}
        onDone={(next) => {
          setEditing(false);
          if (next !== null && next !== (note ?? "")) onSave(next);
        }}
      />
    );
  }

  if (!note) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 -ml-3 block min-w-0 max-w-full rounded-xl bg-transparent px-3 py-1.5 text-left text-base text-caption/60 shadow-none transition hover:bg-sand/60"
      >
        Add a note
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={long ? () => setOpen((o) => !o) : undefined}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(e) => isF2(e) && setEditing(true)}
      aria-expanded={long ? open : undefined}
      data-hint={`${long ? (open ? "Click to fold. " : "Click to read it all. ") : ""}Double-click (or F2) to edit the note`}
      className="mt-1 -ml-3 flex min-w-0 max-w-full items-start gap-1.5 rounded-xl bg-transparent px-3 py-1.5 text-left text-gray-700 shadow-none transition hover:bg-sand/60"
    >
      {long && (
        <IconChevronDown
          aria-hidden
          className={`mt-1 size-4 shrink-0 text-caption transition ${open ? "rotate-180" : ""}`}
          stroke={2.5}
        />
      )}
      <span
        ref={text}
        className={`min-w-0 break-words whitespace-pre-line ${open ? "" : "line-clamp-2"}`}
      >
        {note}
      </span>
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
    return (
      <NoteEditor
        name={name}
        note={note}
        onDone={(next) => {
          setEditing(false);
          if (next !== null && next !== (note ?? "")) onSave(next);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      data-hint={note ? "Click to edit the note" : undefined}
      className={`mt-1 -ml-3 block min-w-0 max-w-full rounded-xl bg-transparent px-3 py-1.5 text-left break-words whitespace-pre-line shadow-none transition hover:bg-sand/60 ${
        note ? "text-gray-700" : "text-base text-caption/60"
      }`}
    >
      {note ?? "Add a note"}
    </button>
  );
}
