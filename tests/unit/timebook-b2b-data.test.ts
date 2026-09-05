import { describe, it, expect } from "vitest";
import {
  initialTimeBookModels,
  initialB2BAccounts,
} from "@/lib/demo-data/timebook-b2b-data";

describe("Time Book & B2B Demo Datasets", () => {
  it("contains Audi RS6 base case with initial confidence and 8h note", () => {
    const rs6 = initialTimeBookModels.find((m) => m.id === "tb-audi-rs6");
    expect(rs6).toBeDefined();
    expect(rs6?.make).toBe("Audi");
    expect(rs6?.overallConfidence).toBe("initial");
    expect(rs6?.notes).toContain("8 h");
    expect(rs6?.panels.length).toBeGreaterThan(3);
  });

  it("contains BMW M4 with reliable confidence (>15 samples)", () => {
    const bmw = initialTimeBookModels.find((m) => m.id === "tb-bmw-m4");
    expect(bmw).toBeDefined();
    expect(bmw?.overallConfidence).toBe("reliable");
    expect(bmw?.totalSamples).toBeGreaterThanOrEqual(15);
  });

  it("contains AutoStand Prime Barcelos in B2B accounts with fleet vehicles", () => {
    const autostand = initialB2BAccounts.find((a) => a.id === "b2b-1");
    expect(autostand).toBeDefined();
    expect(autostand?.tradeName).toBe("AutoStand Prime");
    expect(autostand?.nif).toBe("PT509887766");
    expect(autostand?.discountRate).toBe(15);
    expect(autostand?.fleetVehicles.length).toBeGreaterThanOrEqual(2);
  });
});
