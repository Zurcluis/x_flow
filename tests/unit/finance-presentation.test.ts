import { describe, it, expect } from "vitest";
import {
  effectiveInvoiceStatus,
  formatInvoiceDate,
  invoiceMonthKey,
  invoiceTotalsIntegrity,
  isInvoiceOverdue,
  monthlyAmountFor,
} from "@/domains/finance/presentation";
import type { Invoice } from "@/domains/finance/types";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    invoiceNumber: "FT2026/1",
    workOrderId: "22222222-2222-4222-8222-222222222222",
    customerId: "33333333-3333-4333-8333-333333333333",
    customerName: "Cliente",
    customerNif: "500000000",
    vehiclePlate: "AA-00-AA",
    vehicleModel: "Modelo",
    subtotal: 100,
    vatRate: 23,
    vatAmount: 23,
    totalAmount: 123,
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    issuedAt: "2026-10-01T10:00:00+01:00",
    dueAt: "2026-10-15",
    lines: [
      {
        id: "line-1",
        description: "Serviço",
        quantity: 1,
        unitPrice: 100,
        vatRate: 23,
        lineTotal: 100,
      },
    ],
    ...overrides,
  };
}

describe("finance presentation", () => {
  it("derives overdue only for pending invoices past due", () => {
    expect(effectiveInvoiceStatus(makeInvoice(), "2026-10-18")).toBe("overdue");
    expect(effectiveInvoiceStatus(makeInvoice(), "2026-10-15")).toBe("pending");
    expect(
      effectiveInvoiceStatus(makeInvoice({ paymentStatus: "paid" }), "2026-10-18")
    ).toBe("paid");
    expect(
      effectiveInvoiceStatus(makeInvoice({ paymentStatus: "cancelled" }), "2026-10-18")
    ).toBe("cancelled");
    expect(isInvoiceOverdue(makeInvoice(), "2026-10-18")).toBe(true);
  });

  it("uses the workshop timezone for month keys", () => {
    expect(invoiceMonthKey("2026-11-01T00:30:00Z")).toBe("2026-11");
    expect(invoiceMonthKey("2026-06-30T23:30:00Z")).toBe("2026-07");
  });

  it("formats document dates without shifting the day", () => {
    expect(formatInvoiceDate("2026-10-18")).toBe("18/10/2026");
  });

  it("checks invoice totals against lines, subtotal and VAT", () => {
    expect(invoiceTotalsIntegrity(makeInvoice()).isConsistent).toBe(true);
    expect(
      invoiceTotalsIntegrity(makeInvoice({ totalAmount: 120 })).totalMatches
    ).toBe(false);
    expect(
      invoiceTotalsIntegrity(
        makeInvoice({
          lines: [
            {
              id: "line-1",
              description: "Serviço",
              quantity: 1,
              unitPrice: 90,
              vatRate: 23,
              lineTotal: 90,
            },
          ],
        })
      ).linesMatchSubtotal
    ).toBe(false);
  });

  it("normalizes recurring amounts to a monthly value", () => {
    expect(monthlyAmountFor(120, "monthly")).toBe(120);
    expect(monthlyAmountFor(120, "quarterly")).toBe(40);
    expect(monthlyAmountFor(120, "yearly")).toBe(10);
  });
});
