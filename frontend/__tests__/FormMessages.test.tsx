import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormMessages } from "@/app/_components/FormMessages";

describe("FormMessages", () => {
  it("renders nothing when messages is undefined", () => {
    const { container } = render(<FormMessages />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an empty messages array", () => {
    const { container } = render(<FormMessages messages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single message as a paragraph (no list)", () => {
    render(<FormMessages messages={["Invalid email address"]} />);
    expect(screen.getByText("Invalid email address")).toBeTruthy();
    // Single message: should not use a list element.
    expect(document.querySelector("ul")).toBeNull();
    expect(document.querySelector("li")).toBeNull();
  });

  it("renders multiple messages as a list", () => {
    render(<FormMessages messages={["Error one", "Error two", "Error three"]} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("Error one");
    expect(items[2].textContent).toBe("Error three");
  });

  it("has role=alert so screen readers announce errors immediately", () => {
    render(<FormMessages messages={["Something went wrong"]} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
