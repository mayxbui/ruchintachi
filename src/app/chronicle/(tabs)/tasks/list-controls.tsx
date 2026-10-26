"use client";

import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
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
        <div className="basis-full">
          <NameForm action={createListAction} label="List name" submitLabel="Add" onCancel={close} />
        </div>
      )}
    </>
  );
}

/** Rename / delete for the list being shown. */
export function ListMenu({ listId, name }: { listId: string; name: string }) {
  const [renaming, setRenaming] = useState(false);
  const close = useCallback(() => setRenaming(false), []);

  if (renaming) {
    return (
      <NameForm
        action={renameListAction.bind(null, listId)}
        initial={name}
        label="New name"
        submitLabel="Save"
        onCancel={close}
      />
    );
  }

  return (
    <div className="mb-4 flex items-center gap-1">
      <h3 className="mr-auto min-w-0 truncate text-xl font-extrabold">{name}</h3>
      <button
        type="button"
        onClick={() => setRenaming(true)}
        aria-label={`Rename ${name}`}
        className="min-w-0 shrink-0 rounded-full bg-transparent p-2 text-caption shadow-none transition hover:bg-sand hover:text-ink"
      >
        <IconPencil className="size-5" stroke={2.25} />
      </button>
      <form
        action={deleteListAction.bind(null, listId)}
        onSubmit={(e) => {
          if (!window.confirm(`Delete the list "${name}"? Its tasks stay, without a list.`)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          aria-label={`Delete ${name}`}
          className="min-w-0 shrink-0 rounded-full bg-transparent p-2 text-caption shadow-none transition hover:bg-cherry/10 hover:text-cherry"
        >
          <IconTrash className="size-5" stroke={2.25} />
        </button>
      </form>
    </div>
  );
}
