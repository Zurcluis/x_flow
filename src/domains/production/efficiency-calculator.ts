/**
 * Calcula a taxa de desperdício (% scrap rate) do material.
 * Se o consumo real for superior ao orçamentado, calcula o excesso percentual.
 */
export function calculateScrapRate(
  estimatedMeters: number,
  actualMeters: number
): number {
  if (estimatedMeters <= 0 || actualMeters <= 0) return 0;
  if (actualMeters <= estimatedMeters) return 0;

  const excess = actualMeters - estimatedMeters;
  const scrapPercentage = (excess / estimatedMeters) * 100;
  return Math.round(scrapPercentage * 10) / 10;
}

/**
 * Calcula a eficiência de mão de obra (horas Time Book vs horas reais gastas)
 */
export function calculateLaborEfficiency(
  estimatedHours: number,
  actualHours: number
): {
  efficiencyPercentage: number;
  differenceHours: number;
  status: "optimal" | "acceptable" | "behind";
} {
  if (actualHours <= 0) {
    return {
      efficiencyPercentage: 100,
      differenceHours: 0,
      status: "optimal",
    };
  }

  const efficiencyPercentage = Math.round((estimatedHours / actualHours) * 100);
  const differenceHours = Math.round((estimatedHours - actualHours) * 10) / 10;

  let status: "optimal" | "acceptable" | "behind" = "acceptable";
  if (efficiencyPercentage >= 105) status = "optimal";
  else if (efficiencyPercentage < 90) status = "behind";

  return {
    efficiencyPercentage,
    differenceHours,
    status,
  };
}
