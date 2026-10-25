"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form";
import { RecoveryCodeNotice } from "@/components/recovery-code";
import { resetPassword } from "@/lib/auth/actions";
import { PASSWORD_MIN } from "@/lib/auth/credentials";

export function RecoverForm() {
  const [state, formAction] = useActionState(resetPassword, {});

  if (state.recoveryCode) {
    return (
      <div className="space-y-5">
        <p>
          Your password is changed and you&apos;re signed in. Your old
          recovery code no longer works. Here&apos;s your new one:
        </p>
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
        defaultValue={state.username}
      />
      <TextField
        label="Recovery code"
        name="code"
        autoComplete="off"
        spellCheck={false}
        required
        placeholder="XXXX-XXXX-XXXX-XXXX"
        className="w-full bg-white px-4 py-3 font-mono uppercase shadow-pop outline-none focus:ring-4 focus:ring-sunny"
      />
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
      />
      <TextField
        label="New password again"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
      />
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton pendingLabel="Checking…">Reset password</SubmitButton>
        <Link href="/sign-in" className="font-bold text-sky underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
