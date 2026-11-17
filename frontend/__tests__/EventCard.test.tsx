import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@/app/_components/EventCard";
import type { EventView } from "@/lib/api/types";

// Next.js Link renders an <a> tag in jsdom, but requires a mock for the router.
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeEvent(overrides: Partial<EventView> = {}): EventView {
  return {
    id: "evt-1",
    title: "React Workshop",
    description: "Hands-on React session",
    location: "Room 101",
    startsAt: "2027-06-15T09:00:00Z",
    endsAt: "2027-06-15T12:00:00Z",
    capacity: 30,
    status: "PUBLISHED",
    organization: { id: "org-1", name: "Tech Club" },
    registeredCount: 10,
    availableSpots: 20,
    ...overrides,
  };
}

describe("EventCard", () => {
  it("renders the event title and organization name", () => {
    render(<EventCard event={makeEvent()} />);
    expect(screen.getByText("React Workshop")).toBeTruthy();
    expect(screen.getByText("Tech Club")).toBeTruthy();
  });

  it("links to the event detail page", () => {
    render(<EventCard event={makeEvent({ id: "abc-123" })} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/events/abc-123");
  });

  it("shows availability counts when spots remain", () => {
    render(<EventCard event={makeEvent({ registeredCount: 5, availableSpots: 25 })} />);
    expect(screen.getByText(/5\/30 registered/)).toBeTruthy();
  });

  it("shows 'Full' when no spots are available", () => {
    render(<EventCard event={makeEvent({ registeredCount: 30, availableSpots: 0 })} />);
    expect(screen.getByText("Full")).toBeTruthy();
  });

  it("shows 'Cancelled' label (not count) for cancelled events", () => {
    render(<EventCard event={makeEvent({ status: "CANCELLED", availableSpots: 0 })} />);
    // Cancelled events show "Cancelled" in both the status badge and the availability span.
    const all = screen.getAllByText("Cancelled");
    expect(all.length).toBeGreaterThanOrEqual(1);
    // The availability span specifically shows "Cancelled" (not a registration count).
    const availabilitySpan = document.querySelector(".event-card-availability");
    expect(availabilitySpan?.textContent).toBe("Cancelled");
  });

  it("does not show the status badge for published events (status implied)", () => {
    const { container } = render(<EventCard event={makeEvent({ status: "PUBLISHED" })} />);
    expect(container.querySelector(".badge")).toBeNull();
  });

  it("shows the status badge for draft events", () => {
    render(<EventCard event={makeEvent({ status: "DRAFT" })} />);
    expect(screen.getByText("Draft")).toBeTruthy();
  });
});
