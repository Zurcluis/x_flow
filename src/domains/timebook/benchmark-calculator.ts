import { BenchmarkConfidence } from "./types";

export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function determineBenchmarkConfidence(sampleCount: number): BenchmarkConfidence {
  if (sampleCount < 5) return "initial";
  if (sampleCount < 15) return "learning";
  return "reliable";
}

export function formatConfidenceLabel(confidence: BenchmarkConfidence): string {
  switch (confidence) {
    case "initial":
      return "Inicial";
    case "learning":
      return "Em Aprendizagem";
    case "reliable":
      return "Fiável";
  }
}
