import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { cancelEventAction, publishEventAction } from "@/lib/actions";
import { apiFetch } from "@/lib/api/client";
import type { EventView, Membership, Paginated } from "@/lib/api/types";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/datetime";

function ManagerEventRow({ event }: { event: EventView }) {
  return (
    <li className="manager-event">
      <div>
        <Link href={`/events/${event.id}`}>
          <strong>{event.title}</strong>
        </Link>
        <p className="muted" style={{ margin: "0.2rem 0 0" }}>
          {formatDateTime(event.startsAt)} · {event.registeredCount}/
          {event.capacity} registered
        </p>
      </div>
      <div className="manager-event-actions">
        <StatusBadge status={event.status} />
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
              Cancel
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  );
}

async function OrganizationSection({ membership }: { membership: Membership }) {
  const data = await apiFetch<Paginated<EventView>>(
    `/organizations/${membership.organizationId}/events?pageSize=50`,
  );

  return (
    <section className="section">
      <div className="page-header">
        <h2>{membership.organizationName}</h2>
        <Link
          href={`/dashboard/events/new?organizationId=${membership.organizationId}`}
          className="btn btn-primary"
        >
          New event
        </Link>
      </div>
      {data.items.length === 0 ? (
        <p className="muted">No events yet. Create your first one.</p>
      ) : (
        <ul className="card-list">
          {data.items.map((event) => (
            <ManagerEventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}

async function DashboardContent() {
  const me = await requireUser("/dashboard");
  const managed = me.memberships.filter((m) => m.role === "MANAGER");

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link href="/dashboard/organizations/new" className="btn btn-secondary">
          New organization
        </Link>
      </div>

      {managed.length === 0 ? (
        <div className="notice">
          <p>You don’t manage any organizations yet.</p>
          <Link
            href="/dashboard/organizations/new"
            className="btn btn-primary"
          >
            Create an organization
          </Link>
        </div>
      ) : (
        managed.map((membership) => (
          <OrganizationSection
            key={membership.organizationId}
            membership={membership}
          />
        ))
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
