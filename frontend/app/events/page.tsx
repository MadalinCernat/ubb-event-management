import Link from "next/link";
import { Suspense } from "react";
import { EventCard } from "@/app/_components/EventCard";
import { apiFetch } from "@/lib/api/client";
import type { EventView, OrganizationRef, Paginated } from "@/lib/api/types";

const PAGE_SIZE = 20;

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchOrganizationOptions(): Promise<OrganizationRef[]> {
  // Options are derived from published events (there is no list-organizations
  // endpoint). Covers the most recent published events, stable across filters.
  const data = await apiFetch<Paginated<EventView>>("/events?pageSize=50", {
    auth: false,
  });
  const byId = new Map<string, OrganizationRef>();
  for (const event of data.items) {
    byId.set(event.organization.id, event.organization);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function EventsContent({
  searchParams,
}: {
  searchParams: PageProps<"/events">["searchParams"];
}) {
  const sp = await searchParams;
  const q = str(sp.q);
  const fromDate = str(sp.from);
  const toDate = str(sp.to);
  const organizationId = str(sp.organizationId);
  const spotsOnly = str(sp.spots) === "1";
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (fromDate) query.set("from", `${fromDate}T00:00:00Z`);
  if (toDate) query.set("to", `${toDate}T23:59:59Z`);
  if (organizationId) query.set("organizationId", organizationId);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const [data, organizations] = await Promise.all([
    apiFetch<Paginated<EventView>>(`/events?${query.toString()}`, {
      auth: false,
    }),
    fetchOrganizationOptions(),
  ]);

  // "Spots available" is applied over the current page (no backend param).
  const items = spotsOnly
    ? data.items.filter((event) => event.availableSpots > 0)
    : data.items;

  const hasFilters = Boolean(
    q || fromDate || toDate || organizationId || spotsOnly,
  );
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (fromDate) next.set("from", fromDate);
    if (toDate) next.set("to", toDate);
    if (organizationId) next.set("organizationId", organizationId);
    if (spotsOnly) next.set("spots", "1");
    next.set("page", String(target));
    return `/events?${next.toString()}`;
  };

  return (
    <>
      <div className="page-header">
        <h1>Events</h1>
      </div>

      <form className="filters" method="get" action="/events" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, description, location" />
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={fromDate} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={toDate} />
        </div>
        <div className="field">
          <label htmlFor="organizationId">Organization</label>
          <select id="organizationId" name="organizationId" defaultValue={organizationId}>
            <option value="">All organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <label className="filters-checkbox">
          <input type="checkbox" name="spots" value="1" defaultChecked={spotsOnly} />
          Spots available
        </label>
        <div className="filters-actions">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <Link href="/events" className="btn btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No events match your search.</p>
          {hasFilters ? (
            <Link href="/events" className="btn btn-secondary">
              Clear filters
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="card-list">
          {items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn btn-secondary">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn btn-secondary">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}

export default function EventsPage({ searchParams }: PageProps<"/events">) {
  return (
    <Suspense fallback={<p>Loading events…</p>}>
      <EventsContent searchParams={searchParams} />
    </Suspense>
  );
}
