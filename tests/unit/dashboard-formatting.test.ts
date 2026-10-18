import { describe, expect, it } from "vitest";
import {
  formatLisbonDateTime,
  formatLisbonTime,
} from "@/server/dashboard";

describe("dashboard date formatting", () => {
  it("formats UTC summer timestamps in Europe/Lisbon", () => {
    expect(formatLisbonTime("2026-08-28T08:15:00.000Z")).toBe("09:15");
  });

  it("formats UTC winter timestamps in Europe/Lisbon", () => {
    expect(formatLisbonTime("2026-01-15T08:15:00.000Z")).toBe("08:15");
  });

  it("includes the date and time for dashboard events", () => {
    expect(formatLisbonDateTime("2026-08-28T08:15:00.000Z")).toContain(
      "28/08/2026"
    );
    expect(formatLisbonDateTime("2026-08-28T08:15:00.000Z")).toContain("09:15");
  });

  it("returns an empty string for invalid values", () => {
    expect(formatLisbonTime("not-a-date")).toBe("");
    expect(formatLisbonDateTime("not-a-date")).toBe("");
  });
});
