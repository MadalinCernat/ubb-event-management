"use client";

import { useActionState, useState } from "react";
import type { EventView, OrganizationRef } from "@/lib/api/types";
import { isoToLocalInput, localInputToIso } from "@/lib/datetime";
import { emptyFormState, type FormState } from "@/lib/forms";
import { FormMessages } from "./FormMessages";
import { SubmitButton } from "./SubmitButton";

interface EventFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  // Create mode: let the manager pick which organization to create the event for.
  organizations?: OrganizationRef[];
  // Edit mode: the event being edited.
  event?: EventView;
}

export function EventForm({
  action,
  submitLabel,
  organizations,
  event,
}: EventFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);
  // Converting an ISO timestamp to a datetime-local value uses the browser's
  // timezone, so server and client first renders differ for an edited event;
  // suppressHydrationWarning on the inputs below is the intended handling.
  const [startsAt, setStartsAt] = useState(
    event ? isoToLocalInput(event.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    event ? isoToLocalInput(event.endsAt) : "",
  );

  return (
    <form action={formAction} className="form" noValidate>
      <FormMessages messages={state.messages} />

      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}

      {organizations ? (
        <div className="field">
          <label htmlFor="organizationId">Organization</label>
          <select
            id="organizationId"
            name="organizationId"
            required
            defaultValue={state.values?.organizationId ?? organizations[0]?.id}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={150}
          defaultValue={state.values?.title ?? event?.title}
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          rows={5}
          defaultValue={state.values?.description ?? event?.description}
        />
      </div>

      <div className="field">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          required
          maxLength={200}
          defaultValue={state.values?.location ?? event?.location}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startsAtLocal">Starts</label>
          <input
            id="startsAtLocal"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            suppressHydrationWarning
          />
          <input type="hidden" name="startsAt" value={localInputToIso(startsAt)} />
        </div>

        <div className="field">
          <label htmlFor="endsAtLocal">Ends</label>
          <input
            id="endsAtLocal"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            suppressHydrationWarning
          />
          <input type="hidden" name="endsAt" value={localInputToIso(endsAt)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="capacity">Capacity</label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          required
          min={1}
          max={100000}
          defaultValue={event?.capacity ?? 30}
        />
      </div>

      <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
