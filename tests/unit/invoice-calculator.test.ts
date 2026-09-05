import { describe, it, expect } from "vitest";
import {
  calculateInvoiceTotals,
  formatInvoiceNumber,
} from "@/domains/finance/invoice-calculator";

describe("Invoice Calculator with Portuguese VAT (23%)", () => {
  it("should calculate exact subtotal, 23% VAT, and total for sample lines", () => {
    const lines = [
      { quantity: 1, unitPrice: 3600.0 }, // 3600 + 828 = 4428
      { quantity: 1, unitPrice: 400.0 },  // 400 + 92 = 492
    ];

    const result = calculateInvoiceTotals(lines, 23);
    expect(result.subtotal).toBe(4000.0);
    expect(result.vatAmount).toBe(920.0);
    expect(result.totalAmount).toBe(4920.0);
    expect(result.vatRate).toBe(23);
  });

  it("should handle empty lines gracefully", () => {
    const result = calculateInvoiceTotals([], 23);
    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("should format invoice numbers according to Portuguese standard", () => {
    expect(formatInvoiceNumber(42, 2026)).toBe("FT 2026/042");
    expect(formatInvoiceNumber(1, 2026)).toBe("FT 2026/001");
    expect(formatInvoiceNumber(125, 2026)).toBe("FT 2026/125");
  });
});
