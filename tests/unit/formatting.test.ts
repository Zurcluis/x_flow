import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/formatting";

describe("Formatting utilities", () => {
  it("formats currency in EUR pt-PT correctly", () => {
    const result = formatCurrency(24850);
    expect(result).toContain("24");
    expect(result).toContain("850");
    expect(result).toContain("€");
  });

  it("formats standard numbers with pt-PT separators", () => {
    const result = formatNumber(1250000);
    expect(result).toContain("1");
    expect(result).toContain("250");
  });

  it("formats percentages with optional sign", () => {
    expect(formatPercentage(18, true)).toBe("+18%");
    expect(formatPercentage(76)).toBe("76%");
    expect(formatPercentage(37.9)).toBe("37.9%");
  });
});
