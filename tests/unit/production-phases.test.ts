import { describe, it, expect } from "vitest";
import {
  initialBMWPhases,
  initialBMWMaterialUsage,
  initialBMWQCInspection,
} from "@/lib/demo-data/production-phases-data";

describe("Production Phases Demo Data Integrity", () => {
  it("should have exactly 8 sequential technical phases for BMW M4", () => {
    expect(initialBMWPhases.length).toBe(8);
    expect(initialBMWPhases[0].phaseKey).toBe("prep_decontamination");
    expect(initialBMWPhases[7].phaseKey).toBe("quality_control");
  });

  it("should have valid material usage with batch number and positive scrap rate", () => {
    expect(initialBMWMaterialUsage.batchNumber).toBe("STEK-DS-2026-04");
    expect(initialBMWMaterialUsage.actualMeters).toBeGreaterThan(
      initialBMWMaterialUsage.estimatedMeters
    );
    expect(initialBMWMaterialUsage.scrapPercentage).toBe(9.1);
  });

  it("should have complete QC inspection with 10 criteria", () => {
    expect(initialBMWQCInspection.items.length).toBe(10);
    expect(initialBMWQCInspection.certificateNumber).toBe("QC-2026-44TX88-PASS");
    expect(initialBMWQCInspection.inspectorName).toContain("João Martins");
  });
});
