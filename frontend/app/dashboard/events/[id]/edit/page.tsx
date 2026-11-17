import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventForm } from "@/app/_components/EventForm";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { SubmitButton } from "@/app/_components/SubmitButton";
import {
  cancelEventAction,
  publishEventAction,
  updateEventAction,
} from "@/lib/actions";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { EventView } from "@/lib/api/types";
import { requireUser } from "@/lib/auth/session";

async function Content({
  params,
}: {
  params: PageProps<"/dashboard/events/[id]/edit">["params"];
}) {
  const { id } = await params;
  await requireUser(`/dashboard/events/${id}/edit`);

  let event: EventView;
  try {
    event = await apiFetch<EventView>(`/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && [400, 404].includes(error.statusCode)) {
      notFound();
    }
    throw error;
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/dashboard" className="back-link">
        ← Back to dashboard
      </Link>

      <div className="page-header">
        <h1>Edit event</h1>
        <StatusBadge status={event.status} />
      </div>

      {event.status === "CANCELLED" ? (
        <p className="notice">Cancelled events can no longer be edited.</p>
      ) : (
        <>
          <EventForm
            action={updateEventAction}
            submitLabel="Save changes"
            event={event}
          />

          <div className="detail-actions section">
            {event.status === "DRAFT" ? (
              <form action={publishEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <SubmitButton pendingLabel="Publishing…">Publish</SubmitButton>
              </form>
            ) : null}
            <form action={cancelEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <SubmitButton variant="danger" pendingLabel="Cancelling…">
                Cancel event
              </SubmitButton>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default function EditEventPage({
  params,
}: PageProps<"/dashboard/events/[id]/edit">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Content params={params} />
    </Suspense>
  );
}
