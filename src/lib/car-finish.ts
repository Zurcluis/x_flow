// Acabamentos aproximados usados no estúdio 3D. A película do catálogo define
// a cor e o brilho de origem; estes presets permitem pré-visualizar a mesma
// cor em brilho, acetinado ou mate sem alterar o catálogo.

export type CarFinish = "gloss" | "satin" | "matte";
export type CarFinishOption = CarFinish | "film";

export interface CarFinishMaterial {
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

export const CAR_FINISH_OPTIONS: { id: CarFinishOption; label: string }[] = [
  { id: "film", label: "Película" },
  { id: "gloss", label: "Brilho" },
  { id: "satin", label: "Acetinado" },
  { id: "matte", label: "Mate" },
];

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
