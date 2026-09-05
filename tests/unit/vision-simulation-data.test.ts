import { describe, it, expect } from "vitest";
import {
  initialVisionAnalyses,
  initialFinishPresets,
} from "@/lib/demo-data/vision-simulation-data";

describe("Vision and Simulator Demo Data Integrity", () => {
  it("contains valid analyses for BMW M4 and Porsche 911", () => {
    expect(initialVisionAnalyses).toHaveLength(2);

    const bmw = initialVisionAnalyses.find((a) => a.vehiclePlate === "44-TX-88");
    expect(bmw).toBeDefined();
    expect(bmw?.damageSuggestions.length).toBeGreaterThan(0);
    expect(bmw?.panels.length).toBeGreaterThan(0);
    expect(bmw?.vehicleConfidence).toBeGreaterThanOrEqual(0.95);
  });

  it("contains finish presets covering Gloss PPF, Satin PPF, Vinyl Wrap and Chrome Delete", () => {
    expect(initialFinishPresets.length).toBeGreaterThanOrEqual(5);

    const gloss = initialFinishPresets.find((p) => p.type === "clear_ppf_gloss");
    const matte = initialFinishPresets.find((p) => p.type === "clear_ppf_matte");
    const chrome = initialFinishPresets.find((p) => p.type === "chrome_delete");

    expect(gloss).toBeDefined();
    expect(matte).toBeDefined();
    expect(chrome).toBeDefined();
  });
});
