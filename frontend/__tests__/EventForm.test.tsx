import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "@/app/_components/EventForm";
import type { EventView } from "@/lib/api/types";

// Next.js Link (used transitively) needs a stub in jsdom.
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// useActionState is available in React 19 which the project targets; it works
// in jsdom. We wire a no-op action so the form can be rendered and inspected.
const noopAction = vi.fn().mockResolvedValue({});

function makeEvent(overrides: Partial<EventView> = {}): EventView {
  return {
    id: "evt-1",
    title: "React Workshop",
    description: "A great event",
    location: "Room 101",
    startsAt: "2027-06-15T09:00:00Z",
    endsAt: "2027-06-15T12:00:00Z",
    capacity: 30,
    status: "PUBLISHED",
    organization: { id: "org-1", name: "Tech Club" },
    registeredCount: 0,
    availableSpots: 30,
    ...overrides,
  };
}

describe("EventForm – create mode", () => {
  it("renders all required fields", () => {
    render(
      <EventForm
        action={noopAction}
        submitLabel="Create"
        organizations={[{ id: "org-1", name: "Tech Club" }]}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeTruthy();
    expect(screen.getByLabelText("Description")).toBeTruthy();
    expect(screen.getByLabelText("Location")).toBeTruthy();
    expect(screen.getByLabelText("Capacity")).toBeTruthy();
    expect(screen.getByLabelText("Starts")).toBeTruthy();
    expect(screen.getByLabelText("Ends")).toBeTruthy();
  });

  it("renders an organization selector with the provided options", () => {
    render(
      <EventForm
        action={noopAction}
        submitLabel="Create"
        organizations={[
          { id: "org-1", name: "Tech Club" },
          { id: "org-2", name: "Science Society" },
        ]}
      />,
    );
    const select = screen.getByLabelText("Organization") as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(select.options[0].text).toBe("Tech Club");
    expect(select.options[1].text).toBe("Science Society");
  });

  it("uses the submit label prop", () => {
    render(
      <EventForm
        action={noopAction}
        submitLabel="Save draft"
        organizations={[{ id: "org-1", name: "Tech Club" }]}
      />,
    );
    expect(screen.getByRole("button", { name: /Save draft/i })).toBeTruthy();
  });
});

describe("EventForm – edit mode", () => {
  it("pre-fills fields from the event prop", () => {
    render(<EventForm action={noopAction} submitLabel="Update" event={makeEvent()} />);

    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("React Workshop");
    expect((screen.getByLabelText("Description") as HTMLTextAreaElement).value).toBe("A great event");
    expect((screen.getByLabelText("Location") as HTMLInputElement).value).toBe("Room 101");
    expect((screen.getByLabelText("Capacity") as HTMLInputElement).value).toBe("30");
  });

  it("includes a hidden eventId field with the event id", () => {
    const { container } = render(
      <EventForm action={noopAction} submitLabel="Update" event={makeEvent({ id: "xyz-999" })} />,
    );
    const hidden = container.querySelector<HTMLInputElement>('input[name="eventId"]');
    expect(hidden?.value).toBe("xyz-999");
  });

  it("does not render an organization selector in edit mode", () => {
    render(<EventForm action={noopAction} submitLabel="Update" event={makeEvent()} />);
    expect(screen.queryByLabelText("Organization")).toBeNull();
  });
});

describe("EventForm – error state", () => {
  it("renders server-side error messages when the action returns them", async () => {
    // Return an error on first call, then success.
    const errorAction = vi
      .fn()
      .mockResolvedValueOnce({ messages: ["Title is too short", "Location is required"] })
      .mockResolvedValue({});

    render(
      <EventForm
        action={errorAction}
        submitLabel="Create"
        organizations={[{ id: "org-1", name: "Tech Club" }]}
      />,
    );

    // Simulate submitting the form.
    await userEvent.click(screen.getByRole("button", { name: /Create/i }));

    // The FormMessages component should render the errors.
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(await screen.findByText("Title is too short")).toBeTruthy();
    expect(await screen.findByText("Location is required")).toBeTruthy();
  });
});
