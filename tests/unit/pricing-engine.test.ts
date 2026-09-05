import { describe, it, expect } from "vitest";
import {
  calculateOptionFinancials,
  buildQuoteOptionFromParts,
} from "@/domains/quotes/pricing-engine";

describe("Pricing Engine Financials", () => {
  it("calculates exact subtotal, 23% VAT, and total without discount", () => {
    const items = [
      { totalPrice: 380, laborHours: 2.5, areaM2: 1.6 }, // Capô
      { totalPrice: 450, laborHours: 3.5, areaM2: 1.4 }, // Para-choques
    ];

    const result = calculateOptionFinancials(items, 0, 40, 45);

    expect(result.subtotal).toBe(830);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableBase).toBe(830);
    expect(result.vatRate).toBe(0.23);
    expect(result.vatAmount).toBe(190.9); // 830 * 0.23 = 190.90
    expect(result.totalWithVat).toBe(1020.9); // 830 + 190.90 = 1020.90
  });

  it("applies B2B discount rate correctly", () => {
    const items = [{ totalPrice: 1000, laborHours: 5, areaM2: 2.0 }];
    const result = calculateOptionFinancials(items, 12, 40, 45); // 12% discount

    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(120);
    expect(result.taxableBase).toBe(880);
    expect(result.vatAmount).toBe(202.4); // 880 * 0.23 = 202.40
    expect(result.totalWithVat).toBe(1082.4); // 880 + 202.40 = 1082.40
  });

  it("calculates internal costs and estimated margins accurately", () => {
    // 3.0 m² area @ 40€/m² = 120€ material cost
    // 6.0 hours @ 45€/h = 270€ labor cost
    // Total estimated cost = 390€
    const items = [{ totalPrice: 1000, laborHours: 6.0, areaM2: 3.0 }];
    const result = calculateOptionFinancials(items, 0, 40, 45);

    expect(result.estimatedCost).toBe(390);
    expect(result.estimatedMarginAmount).toBe(610); // 1000 - 390 = 610
    expect(result.estimatedMarginPercentage).toBe(61.0); // (610 / 1000) * 100
  });

  it("scales body parts according to vehicle segment multipliers", () => {
    const coupeOpt = buildQuoteOptionFromParts({
      quoteId: "q1",
      optionId: "opt1",
      tier: "essential",
      name: "Pack",
      description: "Test",
      isRecommended: false,
      warrantyYears: 5,
      bodyType: "coupe", // 1.0x
      finish: "gloss",
      partCodes: ["hood"], // base price: 380
      materialName: "Stek",
    });

    const suvOpt = buildQuoteOptionFromParts({
      quoteId: "q2",
      optionId: "opt2",
      tier: "essential",
      name: "Pack",
      description: "Test",
      isRecommended: false,
      warrantyYears: 5,
      bodyType: "suv", // 1.25x
      finish: "gloss",
      partCodes: ["hood"], // base price: 380 * 1.25 = 475
      materialName: "Stek",
    });

    expect(coupeOpt.subtotal).toBe(380);
    expect(suvOpt.subtotal).toBe(475);
  });
});
