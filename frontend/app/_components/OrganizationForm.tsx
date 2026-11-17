"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/lib/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessages } from "./FormMessages";
import { SubmitButton } from "./SubmitButton";

export function OrganizationForm() {
  const [state, formAction] = useActionState(
    createOrganizationAction,
    emptyFormState,
  );

  return (
    <form action={formAction} className="form" noValidate>
      <FormMessages messages={state.messages} />

      <div className="field">
        <label htmlFor="name">Organization name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={state.values?.name}
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={1000}
          rows={4}
          defaultValue={state.values?.description}
        />
      </div>

      <SubmitButton pendingLabel="Creating…">Create organization</SubmitButton>
    </form>
  );
}
