// Acabamentos aproximados usados no estúdio 3D. A película do catálogo define
// a cor e o brilho de origem; estes presets permitem pré-visualizar a mesma
// cor em brilho, acetinado ou mate sem alterar o catálogo.

export type CarFinish = "gloss" | "satin" | "matte";
export type CarFinishOption = CarFinish | "film";
export type CarCoverage = "full" | "front" | "hood" | "roof" | "rear";

export interface CarFinishMaterial {
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

export interface CarCoverageBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export interface CarCoverageZone {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  minNormalY: number;
}

export const CAR_FINISH_OPTIONS: { id: CarFinishOption; label: string }[] = [
  { id: "film", label: "Película" },
  { id: "gloss", label: "Brilho" },
  { id: "satin", label: "Acetinado" },
  { id: "matte", label: "Mate" },
];

export const CAR_COVERAGE_OPTIONS: { id: CarCoverage; label: string }[] = [
  { id: "full", label: "Integral" },
  { id: "front", label: "Frontal" },
  { id: "hood", label: "Capô" },
  { id: "roof", label: "Tejadilho" },
  { id: "rear", label: "Traseira" },
];

const COVERAGE_FRACTIONS: Record<
  Exclude<CarCoverage, "full">,
  { minZ: number; maxZ: number; minY: number; minNormalY: number }
> = {
  front: { minZ: 0.65, maxZ: 1, minY: 0, minNormalY: -1 },
  hood: { minZ: 0.68, maxZ: 0.97, minY: 0.55, minNormalY: 0.25 },
  roof: { minZ: 0.38, maxZ: 0.65, minY: 0.65, minNormalY: 0.2 },
  rear: { minZ: 0, maxZ: 0.35, minY: 0, minNormalY: -1 },
};

export function resolveCoverageZone(
  coverage: CarCoverage,
  bounds: CarCoverageBounds
): CarCoverageZone | null {
  if (coverage === "full") return null;
  const fractions = COVERAGE_FRACTIONS[coverage];
  const zSpan = bounds.max.z - bounds.min.z;
  const ySpan = bounds.max.y - bounds.min.y;
  return {
    minX: bounds.min.x,
    maxX: bounds.max.x,
    minY: bounds.min.y + ySpan * fractions.minY,
    maxY: bounds.max.y,
    minZ: bounds.min.z + zSpan * fractions.minZ,
    maxZ: bounds.min.z + zSpan * fractions.maxZ,
    minNormalY: fractions.minNormalY,
  };
}

const FINISH_MATERIALS: Record<CarFinish, CarFinishMaterial> = {
  gloss: {
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.15,
  },
  satin: {
    roughness: 0.42,
    clearcoat: 0.55,
    clearcoatRoughness: 0.38,
    envMapIntensity: 0.9,
  },
  matte: {
    roughness: 0.82,
    clearcoat: 0.05,
    clearcoatRoughness: 0.75,
    envMapIntensity: 0.65,
  },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Aproximação do acabamento declarado pela película (GU a 60°). */
export function filmFinishMaterial(glossGu = 85, metallic = 0): CarFinishMaterial {
  const gloss = clamp01(glossGu / 100);
  const metal = clamp01(metallic);
  return {
    roughness: Math.max(0.07, 0.1 + (1 - gloss) * 0.65 - metal * 0.04),
    clearcoat: gloss >= 0.45 ? 1 : gloss * 1.6,
    clearcoatRoughness: 0.06 + (1 - gloss) * 0.45,
    envMapIntensity: 1 + metal * 0.4,
  };
}

/** Preset explícito de brilho, acetinado ou mate. */
export function presetFinishMaterial(
  finish: CarFinish,
  metallic = 0
): CarFinishMaterial {
  const preset = FINISH_MATERIALS[finish];
  const metal = clamp01(metallic);
  return {
    ...preset,
    roughness: Math.max(0.05, preset.roughness - metal * 0.04),
    envMapIntensity: preset.envMapIntensity + metal * 0.15,
  };
}

/**
 * Resolve o material de pintura. "film" (ou ausente) respeita o GU do
 * catálogo; os restantes valores forçam o acabamento aproximado.
 */
export function carPaintParams(
  finish: CarFinishOption | undefined,
  glossGu = 85,
  metallic = 0
): CarFinishMaterial {
  if (finish === "gloss" || finish === "satin" || finish === "matte") {
    return presetFinishMaterial(finish, metallic);
  }
  return filmFinishMaterial(glossGu, metallic);
}
