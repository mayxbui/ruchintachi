"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { useDismiss } from "@/components/use-dismiss";
import { useFormStatus } from "react-dom";
import { LIST_NAME_MAX } from "@/lib/task-lists";
import {
  createListAction,
  deleteListAction,
  renameListAction,
  type ListFormState,
} from "../../list-actions";

const inputClass =
  "min-w-0 flex-1 bg-white px-4 py-2.5 shadow-pop outline-none focus:ring-4 focus:ring-sunny";

/** One-line name form shared by "New list" and "Rename". */
function NameForm({
  action,
  initial = "",
  label,
  submitLabel,
  onCancel,
}: {
  action: (prev: ListFormState, formData: FormData) => Promise<ListFormState>;
  initial?: string;
  label: string;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(action, {});
  // Close once a rename is saved (a new list navigates away by itself).
  useEffect(() => {
    if (state.saved) onCancel();
  }, [state.saved, onCancel]);

  return (
    <form action={formAction} className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          defaultValue={initial}
          aria-label={label}
          placeholder="e.g. Health"
          required
          maxLength={LIST_NAME_MAX}
          autoComplete="off"
          autoFocus
          className={inputClass}
        />
        <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="min-w-0 bg-transparent px-2 font-bold text-caption shadow-none hover:brightness-75"
        >
          Cancel
        </button>
      </div>
      <FormMessage error={state.error} />
    </form>
  );
}

/** "+ New list" pill at the end of the filters; opens a name form below them. */
export function NewList() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-w-0 shrink-0 items-center gap-1 rounded-full border-2 border-dashed border-caption/50 bg-transparent px-4 py-1.5 font-bold text-caption shadow-none transition hover:border-caption hover:text-ink"
      >
        <IconPlus aria-hidden className="size-4" stroke={3} />
        New list
      </button>
      {open && (
        // Full width under the pill row (the row wraps it onto its own line).
        <div className="basis-full py-3">
          <NameForm action={createListAction} label="List name" submitLabel="Add" onCancel={close} />
        </div>
      )}
    </>
  );
}

/** A delete choice; greys out while any choice in the panel is posting. */
function DeleteChoice({ children, danger = false }: { children: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 font-bold transition hover:brightness-105 disabled:opacity-60 ${
        danger ? "bg-cherry text-white" : "bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Asks what happens to the list's tasks: keep them (unlisted) or delete
 * them too. An empty list just has "Delete list".
 */
function DeletePanel({
  listId,
  name,
  taskCount,
  onCancel,
}: {
  listId: string;
  name: string;
  taskCount: number;
  onCancel: () => void;
}) {
  const tasks = `${taskCount} task${taskCount === 1 ? "" : "s"}`;
  return (
    <div
      role="alertdialog"
      aria-label={`Delete ${name}`}
      className="rounded-2xl border-3 border-cherry bg-cream p-4 shadow-pop"
    >
      <p className="font-bold">Delete the list &ldquo;{name}&rdquo;?</p>
      {taskCount > 0 && (
        <p className="mt-1 text-caption">
          It has {tasks}. Deleting them too removes them from today on; past days stay in your
          history.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {taskCount > 0 ? (
          <>
            <form action={deleteListAction.bind(null, listId, "keep")}>
              <DeleteChoice>Keep tasks</DeleteChoice>
            </form>
            <form action={deleteListAction.bind(null, listId, "delete")}>
              <DeleteChoice danger>Delete tasks with list</DeleteChoice>
            </form>
          </>
        ) : (
          <form action={deleteListAction.bind(null, listId, "keep")}>
            <DeleteChoice danger>Delete list</DeleteChoice>
          </form>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="min-w-0 bg-transparent px-2 font-bold text-caption shadow-none hover:brightness-75"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * The list being shown, as a title: double-click its name (or F2) to rename
 * it in place, where Enter or leaving the box saves and Escape cancels. The
 * trash beside it asks what happens to the list's tasks. `taskCount` is its
 * current tasks.
 */
export function ListMenu({ listId, name, taskCount }: { listId: string; name: string; taskCount: number }) {
  const [shown, setShown] = useOptimistic(name);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeDelete = useCallback(() => setDeleting(false), []);
  useDismiss(deleting, closeDelete, ref);

  function finish(input: HTMLInputElement, save: boolean) {
    setRenaming(false);
    const next = input.value.trim().replace(/\s+/g, " ");
    if (!save || !next || next === shown) return;
    setError(undefined);
    startTransition(async () => {
      setShown(next);
      const result = await renameListAction(listId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div ref={ref} className="relative flex min-w-0 items-center gap-1">
      {renaming ? (
        <input
          defaultValue={shown}
          aria-label={`Rename ${shown}`}
          maxLength={LIST_NAME_MAX}
          autoComplete="off"
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => finish(e.currentTarget, true)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") finish(e.currentTarget, false);
          }}
          className="-ml-1.5 min-w-0 flex-1 bg-sand/60 px-1.5 py-0.5 text-lg font-extrabold shadow-none outline-none focus:ring-4 focus:ring-sunny sm:-ml-2 sm:px-2 sm:text-xl"
        />
      ) : (
        <h3 className="-ml-1.5 min-w-0 sm:-ml-2">
          <button
            type="button"
            onDoubleClick={() => setRenaming(true)}
            onKeyDown={(e) => e.key === "F2" && setRenaming(true)}
            data-hint="Double-click (or F2) to rename"
            className="block max-w-full min-w-0 truncate rounded-lg bg-transparent px-1.5 text-left text-lg font-extrabold shadow-none transition hover:bg-sand/60 sm:px-2 sm:text-xl"
          >
            {shown}
          </button>
        </h3>
      )}
      <button
        type="button"
        onClick={() => setDeleting((d) => !d)}
        aria-expanded={deleting}
        aria-label={`Delete ${shown}`}
        data-hint="Delete list"
        className="min-w-0 shrink-0 rounded-full bg-transparent p-1 text-caption shadow-none transition hover:bg-cherry/10 hover:text-cherry sm:p-1.5"
      >
        <IconTrash className="size-5" stroke={2.25} />
      </button>
      {deleting && (
        <div className="absolute top-full left-0 z-20 mt-2 w-[min(24rem,calc(100vw-4rem))]">
          <DeletePanel listId={listId} name={shown} taskCount={taskCount} onCancel={closeDelete} />
        </div>
      )}
      {error && (
        <p role="alert" className="absolute top-full left-0 mt-1 text-sm text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}
