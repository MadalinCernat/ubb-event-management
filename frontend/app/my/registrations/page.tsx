import Link from "next/link";
import { Suspense } from "react";
import { CancelRegistrationButton } from "@/app/_components/RegistrationActions";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { apiFetch } from "@/lib/api/client";
import type { RegistrationView } from "@/lib/api/types";
import { requireUser } from "@/lib/auth/session";
import { formatDateRange, hasStarted } from "@/lib/datetime";

async function Content() {
  await requireUser("/my/registrations");
  const registrations = await apiFetch<RegistrationView[]>("/registrations/me");

  if (registrations.length === 0) {
    return (
      <div className="empty-state">
        <p>You have no active registrations.</p>
        <Link href="/events" className="btn btn-primary">
          Browse events
        </Link>
      </div>
    );
  }

  return (
    <ul className="card-list">
      {registrations.map((registration) => {
        const event = registration.event;
        return (
          <li key={registration.id} className="manager-event">
            <div>
              <Link href={`/events/${event.id}`}>
                <strong>{event.title}</strong>
              </Link>
              <p className="muted" style={{ margin: "0.2rem 0 0" }}>
                {formatDateRange(event.startsAt, event.endsAt)} · {event.location}
              </p>
            </div>
            <div className="manager-event-actions">
              {event.status !== "PUBLISHED" ? (
                <StatusBadge status={event.status} />
              ) : null}
              {hasStarted(event.startsAt) ? (
                <span className="muted">Started</span>
              ) : (
                <CancelRegistrationButton eventId={event.id} label="Cancel" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function MyRegistrationsPage() {
  return (
    <>
      <div className="page-header">
        <h1>My registrations</h1>
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <Content />
      </Suspense>
    </>
  );
}
