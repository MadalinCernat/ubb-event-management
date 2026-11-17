import Link from "next/link";
import { Suspense } from "react";
import { EventForm } from "@/app/_components/EventForm";
import { createEventAction } from "@/lib/actions";
import type { OrganizationRef } from "@/lib/api/types";
import { requireUser } from "@/lib/auth/session";

async function Content({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/events/new">["searchParams"];
}) {
  const me = await requireUser("/dashboard/events/new");
  const managed: OrganizationRef[] = me.memberships
    .filter((m) => m.role === "MANAGER")
    .map((m) => ({ id: m.organizationId, name: m.organizationName }));

  if (managed.length === 0) {
    return (
      <div className="notice">
        <p>You need to manage an organization before creating an event.</p>
        <Link href="/dashboard/organizations/new" className="btn btn-primary">
          Create an organization
        </Link>
      </div>
    );
  }

  const preselect =
    typeof (await searchParams).organizationId === "string"
      ? (await searchParams).organizationId
      : undefined;
  // Put the preselected organization first so it is the default option.
  const ordered = preselect
    ? [
        ...managed.filter((o) => o.id === preselect),
        ...managed.filter((o) => o.id !== preselect),
      ]
    : managed;

  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <h1>Create event</h1>
      <p className="muted">The event is saved as a draft until you publish it.</p>
      <EventForm
        action={createEventAction}
        submitLabel="Save draft"
        organizations={ordered}
      />
    </div>
  );
}

export default function NewEventPage({
  searchParams,
}: PageProps<"/dashboard/events/new">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
