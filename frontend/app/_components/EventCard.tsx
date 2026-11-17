import Link from "next/link";
import type { EventView } from "@/lib/api/types";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "./StatusBadge";

// Availability summary shown as text (not colour alone).
function availabilityLabel(event: EventView): string {
  if (event.status === "CANCELLED") {
    return "Cancelled";
  }
  if (event.availableSpots <= 0) {
    return "Full";
  }
  return `${event.registeredCount}/${event.capacity} registered`;
}

export function EventCard({ event }: { event: EventView }) {
  return (
    <li className="event-card">
      <Link href={`/events/${event.id}`} className="event-card-link">
        <div className="event-card-head">
          <h3>{event.title}</h3>
          {event.status !== "PUBLISHED" ? (
            <StatusBadge status={event.status} />
          ) : null}
        </div>
        <p className="event-card-org">{event.organization.name}</p>
        <p className="event-card-meta">
          <span>{formatDateTime(event.startsAt)}</span>
          <span className="event-card-availability">
            {availabilityLabel(event)}
          </span>
        </p>
      </Link>
    </li>
  );
}
