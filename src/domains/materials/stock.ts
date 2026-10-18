import type { StockStatus } from "./types";

function safeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function resolveStockStatus(
  currentStockMeters: number,
  minimumStockAlertMeters: number
): StockStatus {
  const current = safeNumber(currentStockMeters);
  const minimum = safeNumber(minimumStockAlertMeters);
  if (current <= 0) return "out_of_stock";
  if (current <= minimum) return "low_stock";
  return "available";
}

export function isCriticalStock(status: StockStatus): boolean {
  return status === "low_stock" || status === "out_of_stock";
}

export function stockLevelPercentage(
  currentStockMeters: number,
  minimumStockAlertMeters: number
): number {
  const current = safeNumber(currentStockMeters);
  const minimum = safeNumber(minimumStockAlertMeters);
  if (minimum <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / (minimum * 2)) * 100));
}
