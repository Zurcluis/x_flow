import { describe, expect, it } from "vitest";
import {
  buildSupplierOrderMessage,
  calculateRemnantAreaM2,
} from "@/domains/materials/types";

describe("calculateRemnantAreaM2", () => {
  it("calculates exact area in square meters from width and length in centimeters", () => {
    expect(calculateRemnantAreaM2(152, 100)).toBe(1.52);
    expect(calculateRemnantAreaM2(60, 120)).toBe(0.72);
    expect(calculateRemnantAreaM2(75, 150)).toBe(1.13);
  });

  it("returns 0 for non-positive or invalid dimensions", () => {
    expect(calculateRemnantAreaM2(0, 100)).toBe(0);
    expect(calculateRemnantAreaM2(60, -10)).toBe(0);
    expect(calculateRemnantAreaM2(Number.NaN, 100)).toBe(0);
  });
});

describe("buildSupplierOrderMessage", () => {
  it("builds formatted WhatsApp text, email subject and email body with total meters and notes", () => {
    const result = buildSupplierOrderMessage({
      orderNumber: "PO-2026-0001",
      supplierName: "XPEL Ibéria",
      materialName: "XPEL Ultimate Plus 60",
      quantityRolls: 2,
      metersPerRoll: 15,
      notes: "Urgente para Porsche 911 GT3 RS",
    });

    expect(result.emailSubject).toContain("PO-2026-0001");
    expect(result.emailSubject).toContain("XPEL Ultimate Plus 60");
    expect(result.emailSubject).toContain("2 rolo(s)");

    expect(result.whatsappText).toContain("XPEL Ibéria");
    expect(result.whatsappText).toContain("PO-2026-0001");
    expect(result.whatsappText).toContain("XPEL Ultimate Plus 60");
    expect(result.whatsappText).toContain("30 m");
    expect(result.whatsappText).toContain("Urgente para Porsche 911 GT3 RS");

    expect(result.emailBody).toContain("XPEL Ibéria");
    expect(result.emailBody).toContain("2 rolo(s) x 15 m (30 m lineares no total)");
    expect(result.emailBody).toContain("Urgente para Porsche 911 GT3 RS");
    expect(result.emailBody).toContain("X-FLOW by X-Motion");
  });

  it("omits notes line when notes are not provided", () => {
    const result = buildSupplierOrderMessage({
      orderNumber: "PO-2026-0002",
      supplierName: "STEK Portugal",
      materialName: "STEK DYNOshield",
      quantityRolls: 1,
      metersPerRoll: 15,
      notes: undefined,
    });

    expect(result.whatsappText).not.toContain("Notas:");
    expect(result.emailBody).not.toContain("- Notas:");
    expect(result.whatsappText).toContain("15 m");
  });
});
