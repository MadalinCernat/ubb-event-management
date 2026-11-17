"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessages } from "./FormMessages";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, formAction] = useActionState(loginAction, emptyFormState);

  return (
    <form action={formAction} className="form" noValidate>
      <FormMessages messages={state.messages} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>

      <p className="form-footer">
        No account?{" "}
        <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>
          Create one
        </Link>
      </p>
    </form>
  );
}
