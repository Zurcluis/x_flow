import { describe, it, expect } from "vitest";
import {
  MAX_QUOTE_OPTIONS,
  isPublicToken,
  isUuid,
  validateApproverName,
  validateCreateQuoteInput,
} from "@/domains/quotes/validation";
import {
  formatQuoteDate,
  formatQuoteDateTime,
  quoteStatusBadgeVariant,
  quoteStatusLabel,
} from "@/domains/quotes/presentation";
import type { CreateQuoteInput } from "@/domains/quotes/types";

const VEHICLE_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

function validQuote(): CreateQuoteInput {
  return {
    vehicleId: VEHICLE_ID,
    customerId: CUSTOMER_ID,
    intent: "draft",
    options: [
      {
        tier: "recommended",
        name: "Opção recomendada",
        kind: "flexible",
        serviceLines: [
          {
            name: "Aplicação de PPF frontal",
            mode: "complete",
            hours: 4,
            sortOrder: 0,
          },
        ],
        costLines: [],
      },
    ],
  };
}

describe("quotes validation", () => {
  it("accepts canonical UUIDs only", () => {
    expect(isUuid(VEHICLE_ID)).toBe(true);
    expect(isUuid(VEHICLE_ID.toUpperCase())).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("11111111-1111-1111-1111-111111111111")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });

  it("accepts safe public tokens and rejects short or unsafe ones", () => {
    expect(isPublicToken("qt_abcdefghijklmnopqrstuvwx")).toBe(true);
    expect(isPublicToken("A".repeat(120))).toBe(true);
    expect(isPublicToken("short")).toBe(false);
    expect(isPublicToken("A".repeat(121))).toBe(false);
    expect(isPublicToken("token com espaço e mais texto")).toBe(false);
    expect(isPublicToken(undefined)).toBe(false);
  });

  it("accepts a minimal valid flexible quote", () => {
    expect(validateCreateQuoteInput(validQuote())).toEqual([]);
  });

  it("rejects missing relations and empty options", () => {
    const errors = validateCreateQuoteInput({
      vehicleId: "bad",
      customerId: "",
      intent: "send",
      options: [],
    });
    expect(errors.length).toBe(3);
  });

  it("rejects an excessive number of options", () => {
    const base = validQuote();
    const errors = validateCreateQuoteInput({
      ...base,
      options: Array.from({ length: MAX_QUOTE_OPTIONS + 1 }, () => base.options[0]),
    });
    expect(errors.some((error) => error.includes(String(MAX_QUOTE_OPTIONS)))).toBe(true);
  });

  it("rejects a flexible option without service lines", () => {
    const quote = validQuote();
    quote.options[0] = { ...quote.options[0], serviceLines: [] };
    expect(validateCreateQuoteInput(quote).length).toBe(1);
  });

  it("rejects invalid hours, quantities and discounts", () => {
    const quote = validQuote();
    quote.options[0] = {
      ...quote.options[0],
      discountRate: 120,
      serviceLines: [
        {
          name: "Linha inválida",
          mode: "complete",
          hours: 0,
          sortOrder: 0,
        },
      ],
      costLines: [
        {
          lineType: "material",
          name: "Película",
          quantity: 0,
          unit: "m2",
          unitCost: -1,
          wasteRatePercent: 200,
          totalCost: 0,
          sortOrder: 0,
        },
      ],
    };
    const errors = validateCreateQuoteInput(quote);
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });

  it("accepts a configurator option with valid items", () => {
    const quote = validQuote();
    quote.options[0] = {
      tier: "essential",
      name: "Pack configurador",
      kind: "configurator",
      items: [
        {
          serviceName: "PPF capot",
          bodyPartCode: "hood",
          bodyPartName: "Capot",
          materialName: "PPF",
          areaM2: 1.5,
          laborHours: 2,
          unitPrice: 120,
          totalPrice: 180,
        },
      ],
    };
    expect(validateCreateQuoteInput(quote)).toEqual([]);
  });

  it("normalizes approver names and rejects empty or oversized ones", () => {
    expect(validateApproverName("  Maria Silva  ")).toBe("Maria Silva");
    expect(validateApproverName("   ")).toBeNull();
    expect(validateApproverName("A".repeat(151))).toBeNull();
    expect(validateApproverName(123)).toBeNull();
  });
});

describe("quotes presentation", () => {
  it("formats dates in the workshop timezone", () => {
    expect(formatQuoteDate("2026-10-18T23:30:00Z")).toBe("19/10/2026");
    expect(formatQuoteDate("invalid")).toBe("Data indisponível");
    expect(formatQuoteDateTime(null)).toBe("Data indisponível");
    expect(formatQuoteDateTime("2026-10-18T09:05:00Z")).toContain("2026");
  });

  it("maps status labels and badge variants", () => {
    expect(quoteStatusLabel("approved")).toBe("Aprovado");
    expect(quoteStatusLabel("rejected")).toBe("Recusado");
    expect(quoteStatusBadgeVariant("approved")).toBe("success");
    expect(quoteStatusBadgeVariant("rejected")).toBe("danger");
    expect(quoteStatusBadgeVariant("draft")).toBe("outline");
  });
});
