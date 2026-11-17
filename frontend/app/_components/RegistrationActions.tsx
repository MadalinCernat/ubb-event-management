"use client";

import { useActionState } from "react";
import {
  cancelRegistrationAction,
  registerForEventAction,
} from "@/lib/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessages } from "./FormMessages";
import { SubmitButton } from "./SubmitButton";

export function RegisterButton({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(
    registerForEventAction,
    emptyFormState,
  );
  return (
    <form action={formAction} className="inline-action">
      <FormMessages messages={state.messages} />
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton pendingLabel="Registering…">Register</SubmitButton>
    </form>
  );
}

export function CancelRegistrationButton({
  eventId,
  label = "Cancel registration",
}: {
  eventId: string;
  label?: string;
}) {
  const [state, formAction] = useActionState(
    cancelRegistrationAction,
    emptyFormState,
  );
  return (
    <form action={formAction} className="inline-action">
      <FormMessages messages={state.messages} />
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton variant="secondary" pendingLabel="Cancelling…">
        {label}
      </SubmitButton>
    </form>
  );
}
