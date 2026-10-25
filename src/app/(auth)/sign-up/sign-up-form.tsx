"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form";
import { RecoveryCodeNotice } from "@/components/recovery-code";
import { signUp, type AuthState } from "@/lib/auth/actions";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@/lib/auth/credentials";

export function SignUpForm() {
  const [state, formAction] = useActionState(
    // Send the browser's time zone along so "today" is right from day one.
    (prev: AuthState, formData: FormData) => {
      formData.set(
        "timeZone",
        Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      );
      return signUp(prev, formData);
    },
    {},
  );

  if (state.recoveryCode) {
    return (
      <div className="space-y-5">
        <p>Welcome to the island! 🏝️</p>
        <RecoveryCodeNotice code={state.recoveryCode} />
        <Link
          href="/diary"
          className="inline-block rounded-full bg-tangerine px-6 py-3 font-bold text-white shadow-pop"
        >
          I&apos;ve saved it, go to my diary
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <TextField
        label="Username"
        name="username"
        autoComplete="username"
        required
        minLength={USERNAME_MIN}
        maxLength={USERNAME_MAX}
        pattern="[A-Za-z0-9_]+"
        defaultValue={state.username}
        hint={`${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or _. Don't use your real name.`}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      <TextField
        label="Password again"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
      />
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton pendingLabel="Moving in…">Sign up</SubmitButton>
        <Link href="/sign-in" className="font-bold text-sky underline">
          I already have an account
        </Link>
      </div>
    </form>
  );
}
