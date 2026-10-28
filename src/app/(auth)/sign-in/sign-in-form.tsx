"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form";
import { signIn } from "@/lib/auth/actions";

export function SignInForm() {
  const [state, formAction] = useActionState(signIn, {});

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
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
        <Link href="/recover" className="font-bold text-caption underline">
          Forgot password?
        </Link>
      </div>
      <p className="pt-2 text-caption">
        New here?{" "}
        <Link href="/sign-up" className="font-bold text-caption underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
