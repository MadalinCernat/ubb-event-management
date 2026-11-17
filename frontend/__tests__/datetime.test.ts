import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDateTime,
  formatDateRange,
  hasStarted,
  localInputToIso,
  isoToLocalInput,
} from "@/lib/datetime";

// All date formatting uses "Europe/Bucharest" timezone internally.
// Tests that inspect formatted strings use UTC offsets that remain
// stable regardless of where the test machine is located.

describe("formatDateTime", () => {
  it("returns a human-readable date and time", () => {
    // 2027-06-15T10:00:00Z = 13:00 in EET (UTC+3)
    const result = formatDateTime("2027-06-15T10:00:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2027");
  });
});

describe("formatDateRange", () => {
  it("collapses same-day ranges to one date line", () => {
    const result = formatDateRange("2027-06-15T10:00:00Z", "2027-06-15T12:00:00Z");
    // Should not repeat the date twice in a same-day range.
    const juneCount = (result.match(/Jun/g) ?? []).length;
    expect(juneCount).toBe(1);
  });

  it("shows both dates for a multi-day range", () => {
    const result = formatDateRange("2027-06-15T10:00:00Z", "2027-06-16T12:00:00Z");
    expect(result).toMatch(/–/);
  });
});

describe("hasStarted", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when the event started in the past", () => {
    expect(hasStarted("2027-01-01T11:59:59Z")).toBe(true);
  });

  it("returns true when startsAt equals now", () => {
    expect(hasStarted("2027-01-01T12:00:00Z")).toBe(true);
  });

  it("returns false when the event is in the future", () => {
    expect(hasStarted("2027-01-01T12:00:01Z")).toBe(false);
  });
});

describe("localInputToIso", () => {
  it("returns an empty string for an empty input", () => {
    expect(localInputToIso("")).toBe("");
  });

  it("returns an empty string for an invalid input", () => {
    expect(localInputToIso("not-a-date")).toBe("");
  });

  it("converts a valid datetime-local string to an ISO string with timezone", () => {
    const result = localInputToIso("2027-06-15T10:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe("isoToLocalInput", () => {
  it("returns an empty string for an invalid ISO", () => {
    expect(isoToLocalInput("not-a-date")).toBe("");
  });

  it("converts an ISO string to a datetime-local format", () => {
    // Any valid ISO should produce a YYYY-MM-DDTHH:mm format.
    const result = isoToLocalInput("2027-06-15T10:00:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
