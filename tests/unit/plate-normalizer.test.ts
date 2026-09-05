import { describe, it, expect } from "vitest";
import {
  normalizePlate,
  formatPlateForDisplay,
  isValidPlate,
} from "@/domains/vehicles/plate-normalizer";

describe("Plate normalizer utility", () => {
  it("normalizes standard Portuguese plates to uppercase without symbols", () => {
    expect(normalizePlate("44-tx-88")).toBe("44TX88");
    expect(normalizePlate("aa 00 bb")).toBe("AA00BB");
    expect(normalizePlate(" 12.rs.66 ")).toBe("12RS66");
  });

  it("formats 6-character plates with standard 2-2-2 hyphens", () => {
    expect(formatPlateForDisplay("44tx88")).toBe("44-TX-88");
    expect(formatPlateForDisplay("99PZ11")).toBe("99-PZ-11");
    expect(formatPlateForDisplay("12rs66")).toBe("12-RS-66");
  });

  it("validates plate length", () => {
    expect(isValidPlate("44-TX-88")).toBe(true);
    expect(isValidPlate("AA-00-00")).toBe(true);
    expect(isValidPlate("A")).toBe(false);
    expect(isValidPlate("ABCDEF12345678")).toBe(false);
  });
});
