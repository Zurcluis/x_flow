import { describe, it, expect } from "vitest";
import {
  CustomerValidationError,
  isValidCustomerEmail,
  normalizePhoneDigits,
  parseCustomerPriority,
  parseDiscountRate,
  parsePaymentTermsDays,
} from "@/domains/crm/validation";
import {
  VehicleValidationError,
  parseGenerationYear,
  parseMileage,
  parseOptionalVin,
} from "@/domains/vehicles/validation";
import { formatVehicleDateKey } from "@/domains/vehicles/presentation";

describe("CRM input validation", () => {
  it("validates emails and normalizes phone numbers", () => {
    expect(isValidCustomerEmail("cliente@oficina.pt")).toBe(true);
    expect(isValidCustomerEmail(" cliente@oficina.pt ")).toBe(true);
    expect(isValidCustomerEmail("cliente@")).toBe(false);
    expect(isValidCustomerEmail("sem-arroba.pt")).toBe(false);
    expect(normalizePhoneDigits("+351 912 345 678")).toBe("351912345678");
    expect(normalizePhoneDigits("(912) 345-678")).toBe("912345678");
  });

  it("parses B2B discount and payment terms within safe bounds", () => {
    expect(parseDiscountRate(10)).toBe(10);
    expect(parseDiscountRate("10.555")).toBe(10.56);
    expect(parseDiscountRate(undefined)).toBe(0);
    expect(parsePaymentTermsDays(30)).toBe(30);
    expect(parsePaymentTermsDays(undefined)).toBe(30);
    expect(parseCustomerPriority("vip")).toBe("vip");
    expect(parseCustomerPriority(undefined)).toBe("standard");
  });

  it("rejects invalid B2B values", () => {
    expect(() => parseDiscountRate(101)).toThrow(CustomerValidationError);
    expect(() => parseDiscountRate(-1)).toThrow(CustomerValidationError);
    expect(() => parseDiscountRate("abc")).toThrow(CustomerValidationError);
    expect(() => parsePaymentTermsDays(1.5)).toThrow(CustomerValidationError);
    expect(() => parsePaymentTermsDays(366)).toThrow(CustomerValidationError);
    expect(() => parseCustomerPriority("urgente")).toThrow(CustomerValidationError);
  });
});

describe("Vehicle input validation", () => {
  const now = new Date(Date.UTC(2026, 0, 1));

  it("accepts plausible years and rejects impossible ones", () => {
    expect(parseGenerationYear(2024, now)).toBe(2024);
    expect(parseGenerationYear(2027, now)).toBe(2027);
    expect(() => parseGenerationYear(2028, now)).toThrow(VehicleValidationError);
    expect(() => parseGenerationYear(1899, now)).toThrow(VehicleValidationError);
    expect(() => parseGenerationYear(2024.5, now)).toThrow(VehicleValidationError);
    expect(() => parseGenerationYear("abc", now)).toThrow(VehicleValidationError);
  });

  it("accepts zero mileage but rejects negatives and fractions", () => {
    expect(parseMileage(0)).toBe(0);
    expect(parseMileage("15000")).toBe(15000);
    expect(parseMileage("")).toBeUndefined();
    expect(parseMileage(null)).toBeUndefined();
    expect(() => parseMileage(-1)).toThrow(VehicleValidationError);
    expect(() => parseMileage(1.5)).toThrow(VehicleValidationError);
    expect(() => parseMileage(5_000_001)).toThrow(VehicleValidationError);
  });

  it("normalizes VIN and limits its length", () => {
    expect(parseOptionalVin(" wba123 ")).toBe("WBA123");
    expect(parseOptionalVin("")).toBeUndefined();
    expect(parseOptionalVin(null)).toBeUndefined();
    expect(() => parseOptionalVin("X".repeat(51))).toThrow(VehicleValidationError);
  });

  it("formats date keys in Lisbon without shifting the civil day", () => {
    const formatted = formatVehicleDateKey("2026-08-28");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("28");
    expect(formatVehicleDateKey("2026-02-30")).toBe("Data indisponível");
  });
});
