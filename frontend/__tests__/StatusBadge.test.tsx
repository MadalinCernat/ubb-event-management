import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/app/_components/StatusBadge";

describe("StatusBadge", () => {
  it("renders 'Draft' with the draft CSS class for DRAFT status", () => {
    const { container } = render(<StatusBadge status="DRAFT" />);
    const badge = container.querySelector(".badge");
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe("Draft");
    expect(badge?.className).toContain("badge-draft");
  });

  it("renders 'Published' with the published CSS class", () => {
    const { container } = render(<StatusBadge status="PUBLISHED" />);
    const badge = container.querySelector(".badge");
    expect(badge?.textContent).toBe("Published");
    expect(badge?.className).toContain("badge-published");
  });

  it("renders 'Cancelled' with the cancelled CSS class", () => {
    const { container } = render(<StatusBadge status="CANCELLED" />);
    const badge = container.querySelector(".badge");
    expect(badge?.textContent).toBe("Cancelled");
    expect(badge?.className).toContain("badge-cancelled");
  });

  it("uses text (not only colour) to convey status for accessibility", () => {
    render(<StatusBadge status="DRAFT" />);
    // The label must be visible text, not just a styled element.
    expect(screen.getByText("Draft")).toBeTruthy();
  });
});
