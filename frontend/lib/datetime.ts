// The mid-semester demo renders all times in a single fixed timezone so the
// server and client agree (avoids hydration mismatches). See docs/requirements.md.
const DEMO_TIME_ZONE = "Europe/Bucharest";

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DEMO_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: DEMO_TIME_ZONE,
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: DEMO_TIME_ZONE,
  });
  const sameDay = dateFmt.format(start) === dateFmt.format(end);
  if (sameDay) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}

export function hasStarted(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

// Converts a <input type="datetime-local"> value (browser-local wall clock) to
// an ISO 8601 string with timezone, which the backend requires. Client-side only.
export function localInputToIso(value: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

// Converts an ISO timestamp to a value usable as a datetime-local default.
// Client-side only (uses the browser's local timezone).
export function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
