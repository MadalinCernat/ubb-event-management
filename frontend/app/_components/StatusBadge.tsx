import type { EventStatus } from "@/lib/api/types";

const LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
};

// Status is conveyed with text as well as colour (accessibility).
export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>{LABELS[status]}</span>
  );
}
