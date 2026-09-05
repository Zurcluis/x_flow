import { describe, it, expect } from "vitest";
import {
  generateTechnicalSequence,
  predictEstimatedHours,
} from "@/domains/intelligence/time-predictor";

describe("Time Predictor — Sequence and Hour Models", () => {
  it("generates an 8-step technical execution sequence ending with Scangrip QC", () => {
    const sequence = generateTechnicalSequence("PPF");
    expect(sequence).toHaveLength(8);

    expect(sequence[0].phaseName).toContain("Desmontagem");
    expect(sequence[7].phaseName).toContain("Controlo de Qualidade");
    expect(sequence[7].criticalPoints).toContain("10 pontos de controlo formal");
  });

  it("predicts higher hours for SUVs and high contrast wraps", () => {
    const coupePrediction = predictEstimatedHours({
      bodyType: "coupe",
      serviceType: "Wrap",
    });

    const suvHighContrastPrediction = predictEstimatedHours({
      bodyType: "suv",
      serviceType: "Wrap",
      hasHighContrast: true,
    });

    expect(suvHighContrastPrediction.medianHours).toBeGreaterThan(
      coupePrediction.medianHours
    );
  });
});
