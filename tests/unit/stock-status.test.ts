import { describe, expect, it } from "vitest";
import {
  isCriticalStock,
  resolveStockStatus,
  stockLevelPercentage,
} from "@/domains/materials/stock";

describe("resolveStockStatus", () => {
  it("marks zero stock as out_of_stock even if the stored status says available", () => {
    expect(resolveStockStatus(0, 15)).toBe("out_of_stock");
  });

  it("marks stock at or below the minimum as low_stock", () => {
    expect(resolveStockStatus(15, 15)).toBe("low_stock");
    expect(resolveStockStatus(4.5, 15)).toBe("low_stock");
  });

  it("marks stock above the minimum as available", () => {
    expect(resolveStockStatus(15.01, 15)).toBe("available");
  });

  it("treats invalid values as zero", () => {
    expect(resolveStockStatus(Number.NaN, 10)).toBe("out_of_stock");
    expect(resolveStockStatus(-5, 10)).toBe("out_of_stock");
  });
});

describe("isCriticalStock", () => {
  it("includes both low and out of stock", () => {
    expect(isCriticalStock("low_stock")).toBe(true);
    expect(isCriticalStock("out_of_stock")).toBe(true);
    expect(isCriticalStock("available")).toBe(false);
  });
});

describe("stockLevelPercentage", () => {
  it("never divides by zero", () => {
    expect(stockLevelPercentage(10, 0)).toBe(100);
    expect(stockLevelPercentage(0, 0)).toBe(0);
  });

  it("caps the level at 100", () => {
    expect(stockLevelPercentage(100, 15)).toBe(100);
    expect(stockLevelPercentage(15, 15)).toBe(50);
  });
});
