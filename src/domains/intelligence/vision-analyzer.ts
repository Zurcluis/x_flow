import { ColorContrastLevel, RecommendedCoverage } from "./types";

const LIGHT_FAMILIES = ["white", "silver", "light_grey", "yellow", "cream", "branco", "prata"];
const DARK_FAMILIES = ["black", "dark_blue", "dark_grey", "nardo_grey", "preto", "cinza_escuro"];

export function calculateColorContrast(
  originalFamily: string,
  targetFamily: string
): ColorContrastLevel {
  const orig = originalFamily.toLowerCase().trim();
  const targ = targetFamily.toLowerCase().trim();

  if (orig === targ) return "low";

  const isOrigLight = LIGHT_FAMILIES.includes(orig);
  const isTargDark = DARK_FAMILIES.includes(targ);

  const isOrigDark = DARK_FAMILIES.includes(orig);
  const isTargLight = LIGHT_FAMILIES.includes(targ);

  if ((isOrigLight && isTargDark) || (isOrigDark && isTargLight)) {
    return "high";
  }

  return "medium";
}

export function recommendCoverageLevel(
  contrastLevel: ColorContrastLevel,
  serviceType: string
): RecommendedCoverage {
  if (serviceType === "PPF") {
    // Clear PPF preserves original color, so exterior is standard
    return "exterior";
  }

  switch (contrastLevel) {
    case "high":
      return "extended";
    case "medium":
      return "extended";
    case "low":
    default:
      return "exterior";
  }
}

export function formatCoverageLabel(coverage: RecommendedCoverage): string {
  switch (coverage) {
    case "exterior":
      return "Cobertura Exterior (Desmontagem Mínima)";
    case "extended":
      return "Cobertura Estendida (Retornos Amplos)";
    case "integral":
      return "Conversão Integral de Cor (Cavas e Soleiras)";
    case "manual_review":
      return "Revisão Manual Exigida";
  }
}
