import { describe, it, expect } from "vitest";
import {
  calculateScrapRate,
  calculateLaborEfficiency,
} from "@/domains/production/efficiency-calculator";

describe("Production Efficiency Calculator", () => {
  describe("calculateScrapRate", () => {
    it("should return 0 when actual consumption is less than or equal to estimated", () => {
      expect(calculateScrapRate(15, 15)).toBe(0);
      expect(calculateScrapRate(15, 14)).toBe(0);
      expect(calculateScrapRate(0, 10)).toBe(0);
    });

    it("should correctly compute scrap percentage when actual exceeds estimated", () => {
      // 16.5m estimated vs 18.0m actual = (1.5 / 16.5) * 100 = 9.09% -> 9.1%
      expect(calculateScrapRate(16.5, 18.0)).toBe(9.1);

      // 10m estimated vs 12m actual = 20% scrap
      expect(calculateScrapRate(10, 12)).toBe(20.0);
    });
  });

  describe("calculateLaborEfficiency", () => {
    it("should compute optimal efficiency when actual hours are lower than estimated", () => {
      const result = calculateLaborEfficiency(10, 8);
      expect(result.efficiencyPercentage).toBe(125);
      expect(result.differenceHours).toBe(2);
      expect(result.status).toBe("optimal");
    });

    it("should compute behind status when actual hours significantly exceed estimated", () => {
      const result = calculateLaborEfficiency(8, 10);
      expect(result.efficiencyPercentage).toBe(80);
      expect(result.differenceHours).toBe(-2);
      expect(result.status).toBe("behind");
    });

    it("should compute acceptable status when within 90-104% range", () => {
      const result = calculateLaborEfficiency(10, 10);
      expect(result.efficiencyPercentage).toBe(100);
      expect(result.differenceHours).toBe(0);
      expect(result.status).toBe("acceptable");
    });
  });
});
