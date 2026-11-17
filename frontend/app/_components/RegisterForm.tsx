"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessages } from "./FormMessages";
import { SubmitButton } from "./SubmitButton";

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [state, formAction] = useActionState(registerAction, emptyFormState);

  return (
    <form action={formAction} className="form" noValidate>
      <FormMessages messages={state.messages} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="field">
        <label htmlFor="displayName">Name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={state.values?.displayName}
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="field-hint">
          At least 8 characters.
        </p>
      </div>

      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>

      <p className="form-footer">
        Already have an account?{" "}
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link>
      </p>
    </form>
  );
}
