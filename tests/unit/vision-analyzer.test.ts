import { describe, it, expect } from "vitest";
import {
  calculateColorContrast,
  recommendCoverageLevel,
  formatCoverageLabel,
} from "@/domains/intelligence/vision-analyzer";

describe("Vision Analyzer — Color Contrast & Coverage Recommendations", () => {
  it("calculates high contrast when changing from light silver to dark grey", () => {
    const contrast = calculateColorContrast("silver", "dark_grey");
    expect(contrast).toBe("high");
  });

  it("calculates high contrast when changing from white to black", () => {
    const contrast = calculateColorContrast("white", "black");
    expect(contrast).toBe("high");
  });

  it("calculates low contrast when colors belong to similar tones", () => {
    const contrast = calculateColorContrast("green", "green");
    expect(contrast).toBe("low");
  });

  it("recommends exterior coverage for transparent PPF regardless of color", () => {
    const coverage = recommendCoverageLevel("high", "PPF");
    expect(coverage).toBe("exterior");
  });

  it("recommends extended coverage for high contrast color changes", () => {
    const coverage = recommendCoverageLevel("high", "Wrap");
    expect(coverage).toBe("extended");
  });

  it("formats coverage labels into proper pt-PT terminology", () => {
    expect(formatCoverageLabel("exterior")).toContain("Cobertura Exterior");
    expect(formatCoverageLabel("extended")).toContain("Cobertura Estendida");
    expect(formatCoverageLabel("integral")).toContain("Conversão Integral");
  });
});
