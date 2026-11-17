import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CancelRegistrationButton,
  RegisterButton,
} from "@/app/_components/RegistrationActions";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { cancelEventAction, publishEventAction } from "@/lib/actions";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { EventView, RegistrationView } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateRange, hasStarted } from "@/lib/datetime";

async function loadEvent(id: string): Promise<EventView> {
  try {
    return await apiFetch<EventView>(`/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && [400, 404].includes(error.statusCode)) {
      notFound();
    }
    throw error;
  }
}

async function isRegistered(eventId: string): Promise<boolean> {
  try {
    const items = await apiFetch<RegistrationView[]>("/registrations/me");
    return items.some((r) => r.eventId === eventId && r.status === "ACTIVE");
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return false;
    }
    throw error;
  }
}

function RegistrationSection({
  event,
  signedIn,
  registered,
}: {
  event: EventView;
  signedIn: boolean;
  registered: boolean;
}) {
  if (event.status === "CANCELLED") {
    return <p className="notice">This event has been cancelled.</p>;
  }
  if (event.status === "DRAFT") {
    return <p className="notice">This event is a draft and not yet public.</p>;
  }
  if (!signedIn) {
    return (
      <Link
        href={`/login?returnTo=${encodeURIComponent(`/events/${event.id}`)}`}
        className="btn btn-primary"
      >
        Sign in to register
      </Link>
    );
  }
  if (registered) {
    return (
      <div className="detail-actions">
        <p className="notice">You’re registered for this event.</p>
        {hasStarted(event.startsAt) ? null : (
          <CancelRegistrationButton eventId={event.id} />
        )}
      </div>
    );
  }
  if (hasStarted(event.startsAt)) {
    return <p className="notice">This event has already started.</p>;
  }
  if (event.availableSpots <= 0) {
    return <p className="notice">This event is full.</p>;
  }
  return <RegisterButton eventId={event.id} />;
}

async function EventDetail({
  params,
}: {
  params: PageProps<"/events/[id]">["params"];
}) {
  const { id } = await params;
  const event = await loadEvent(id);
  const user = await getCurrentUser();
  const registered = user ? await isRegistered(event.id) : false;
  const managesEvent = Boolean(
    user?.memberships.some(
      (m) => m.organizationId === event.organization.id && m.role === "MANAGER",
    ),
  );

  return (
    <article>
      <Link href="/events" className="back-link">
        ← Back to events
      </Link>

      <div className="page-header">
        <h1>{event.title}</h1>
        <StatusBadge status={event.status} />
      </div>

      <div className="detail-meta">
        <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
        <span>{event.location}</span>
        <span>Organized by {event.organization.name}</span>
        <span>
          {event.registeredCount} of {event.capacity} spots taken
          {event.availableSpots > 0
            ? ` — ${event.availableSpots} available`
            : " — full"}
        </span>
      </div>

      <p className="detail-description">{event.description}</p>

      <RegistrationSection
        event={event}
        signedIn={Boolean(user)}
        registered={registered}
      />

      {managesEvent ? (
        <section className="section">
          <h2>Manage event</h2>
          <div className="detail-actions">
            <Link
              href={`/dashboard/events/${event.id}/edit`}
              className="btn btn-secondary"
            >
              Edit
            </Link>
            {event.status === "DRAFT" ? (
              <form action={publishEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <SubmitButton pendingLabel="Publishing…">Publish</SubmitButton>
              </form>
            ) : null}
            {event.status !== "CANCELLED" ? (
              <form action={cancelEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <SubmitButton variant="danger" pendingLabel="Cancelling…">
                  Cancel event
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  return (
    <Suspense fallback={<p>Loading event…</p>}>
      <EventDetail params={params} />
    </Suspense>
  );
}
