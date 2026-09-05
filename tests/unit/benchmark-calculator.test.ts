import { describe, it, expect } from "vitest";
import {
  calculateMedian,
  determineBenchmarkConfidence,
  formatConfidenceLabel,
} from "@/domains/timebook/benchmark-calculator";

describe("Time Book Benchmark Calculator", () => {
  it("calculates median correctly for odd and even sets of numbers", () => {
    expect(calculateMedian([10, 20, 30])).toBe(20);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    expect(calculateMedian([240, 210, 270])).toBe(240);
    expect(calculateMedian([])).toBe(0);
  });

  it("determines confidence level based on sample thresholds", () => {
    expect(determineBenchmarkConfidence(0)).toBe("initial");
    expect(determineBenchmarkConfidence(4)).toBe("initial");
    expect(determineBenchmarkConfidence(5)).toBe("learning");
    expect(determineBenchmarkConfidence(14)).toBe("learning");
    expect(determineBenchmarkConfidence(15)).toBe("reliable");
    expect(determineBenchmarkConfidence(25)).toBe("reliable");
  });

  it("formats confidence labels in Portuguese correctly", () => {
    expect(formatConfidenceLabel("initial")).toBe("Inicial");
    expect(formatConfidenceLabel("learning")).toBe("Em Aprendizagem");
    expect(formatConfidenceLabel("reliable")).toBe("Fiável");
  });
});
