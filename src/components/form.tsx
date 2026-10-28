"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Labelled text input in the rounded card style. */
export function TextField({
  label,
  hint,
  ...input
}: { label: string; hint?: ReactNode } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold">{label}</span>
      <input
        className="w-full bg-white px-4 py-2 shadow-pop sm:py-3 outline-none focus:ring-4 focus:ring-sunny"
        {...input}
      />
      {hint && <span className="mt-1 block text-caption">{hint}</span>}
    </label>
  );
}

/** Orange pill submit button that shows a waiting label while the form posts. */
export function SubmitButton({
  children,
  pendingLabel = "One moment…",
  tone = "tangerine",
}: {
  children: ReactNode;
  pendingLabel?: string;
  tone?: "tangerine" | "cherry";
}) {
  const { pending } = useFormStatus();
  const colour = tone === "cherry" ? "bg-cherry" : "bg-tangerine";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${colour} px-4 py-2 font-bold sm:px-3 sm:py-3 text-white transition hover:brightness-105 disabled:opacity-60`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <p role="alert" className="rounded-2xl bg-cherry/10 px-4 py-2 text-cherry">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-2xl bg-leaf/10 px-4 py-2 text-leaf">
        {success}
      </p>
    );
  }
  return null;
}
