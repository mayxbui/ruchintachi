"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form";
import { RecoveryCodeNotice } from "@/components/recovery-code";
import {
  deleteAccountAction,
  regenerateRecoveryCode,
  updatePreferences,
} from "./actions";

export function PreferencesForm({
  timeZone,
  weekStart,
  timeZones,
}: {
  timeZone: string;
  weekStart: "monday" | "sunday";
  timeZones: string[];
}) {
  const [state, formAction] = useActionState(updatePreferences, {});
  const [zone, setZone] = useState(timeZone);
  const zones = timeZones.includes(zone) ? timeZones : [zone, ...timeZones];

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="timeZone" className="mb-1 block font-bold">
          Time zone
        </label>
        <p className="mb-2 text-caption">
          &ldquo;Today&rdquo; follows this, so your tasks reset at your midnight.
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            id="timeZone"
            name="timeZone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="min-w-0 flex-1 bg-white px-4 py-3 shadow-pop outline-none focus:ring-4 focus:ring-sunny"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
            className="bg-white px-3 py-3 font-bold"
          >
            Use this device&apos;s
          </button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 font-bold">Week starts on</legend>
        <div className="flex gap-2">
          {(["monday", "sunday"] as const).map((day) => (
            <label key={day} className="cursor-pointer">
              <input
                type="radio"
                name="weekStart"
                value={day}
                defaultChecked={weekStart === day}
                className="peer sr-only"
              />
              <span className="block rounded-full bg-white px-5 py-3 font-bold text-slate-500 capitalize shadow-pop transition peer-checked:bg-tangerine peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sky">
                {day}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormMessage error={state.error} success={state.saved ? "Saved!" : undefined} />
      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
    </form>
  );
}

export function RecoveryCodeForm() {
  const [state, formAction] = useActionState(regenerateRecoveryCode, {});

  if (state.recoveryCode) return <RecoveryCodeNotice code={state.recoveryCode} />;

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-caption">
        Lost your recovery code? Make a new one. Your old code stops working.
      </p>
      <FormMessage error={state.error} />
      <TextField
        label="Your password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton pendingLabel="Making one…">New recovery code</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, formAction] = useActionState(deleteAccountAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-caption">
        This deletes your account, your Mii, habits, diary, calendar, items
        and friends for good. It can&apos;t be undone.
      </p>
      <FormMessage error={state.error} />
      <TextField
        label={`Type ${username} to confirm`}
        name="confirmUsername"
        autoComplete="off"
        required
      />
      <TextField
        label="Your password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton tone="cherry" pendingLabel="Deleting…">
        Delete my account
      </SubmitButton>
    </form>
  );
}
