import { describe, it, expect } from "vitest";
import {
  isIsoDate,
  isIsoDateTime,
  isMoneyAmount,
  isPositiveMoneyAmount,
  isUuid,
  roundMoney,
} from "@/domains/finance/validation";

describe("finance validation", () => {
  it("accepts only canonical UUIDs", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("11111111-1111-1111-1111-111111111111")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });

  it("validates real civil dates", () => {
    expect(isIsoDate("2026-10-18")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("18/10/2026")).toBe(false);
  });

  it("validates ISO date-times within the supported range", () => {
    expect(isIsoDateTime("2026-10-18T12:00:00+01:00")).toBe(true);
    expect(isIsoDateTime("2026-10-18T12:00:00.000Z")).toBe(true);
    expect(isIsoDateTime("")).toBe(false);
    expect(isIsoDateTime("not-a-date")).toBe(false);
    expect(isIsoDateTime("1900-01-01T00:00:00Z")).toBe(false);
  });

  it("rejects negative, non-finite and excessive amounts", () => {
    expect(isMoneyAmount(0)).toBe(true);
    expect(isMoneyAmount(123.45)).toBe(true);
    expect(isMoneyAmount(-1)).toBe(false);
    expect(isMoneyAmount(Number.NaN)).toBe(false);
    expect(isMoneyAmount(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isMoneyAmount(20_000_000)).toBe(false);
    expect(isPositiveMoneyAmount(0)).toBe(false);
    expect(isPositiveMoneyAmount(0.01)).toBe(true);
  });

  it("rounds money to cents", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});
