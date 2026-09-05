import { describe, it, expect } from "vitest";
import { initialMaterialsData } from "@/lib/demo-data/materials-data";
import { initialQuotesData } from "@/lib/demo-data/quotes-data";

describe("Materials Stock and Quotes demo integrity", () => {
  it("contains exactly 5 critical stock items matching the dashboard KPI", () => {
    const lowStock = initialMaterialsData.filter((m) => m.status === "low_stock");
    expect(lowStock).toHaveLength(5);
  });

  it("contains 7 quotes with at least 1 option each and valid tokens", () => {
    expect(initialQuotesData).toHaveLength(7);

    for (const quote of initialQuotesData) {
      expect(quote.publicToken).toBeTruthy();
      expect(quote.options.length).toBeGreaterThanOrEqual(1);

      // Verify every option has exact mathematical consistency
      for (const opt of quote.options) {
        expect(opt.taxableBase).toBeCloseTo(opt.subtotal - opt.discountAmount, 2);
        expect(opt.totalWithVat).toBeCloseTo(opt.taxableBase + opt.vatAmount, 2);
      }
    }
  });

  it("has BMW M4 quote ORC-2026-042 in approved status with public token", () => {
    const bmwQuote = initialQuotesData.find((q) => q.quoteNumber === "ORC-2026-042");
    expect(bmwQuote).toBeDefined();
    expect(bmwQuote?.status).toBe("approved");
    expect(bmwQuote?.publicToken).toBe("tok-bmw-m4-2026");
    expect(bmwQuote?.options).toHaveLength(3);
  });
});
