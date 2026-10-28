/**
 * Configuração dos cenários exteriores do simulador 3D.
 *
 * Todo o céu, chão e sol são procedurais: não há HDRI nem dependências novas.
 * Os valores ficam fora dos componentes para poderem ser testados sem WebGL.
 */
export type OutdoorSceneId = "outdoor-sun" | "golden-hour";

export const SKY_RADIUS = 70;
export const GROUND_SIZE = 140;

export interface OutdoorSceneConfig {
  id: OutdoorSceneId;
  /** Direção do sol, medida a partir do eixo +Z (frente da viatura). */
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  sunDistance: number;
  sunColor: string;
  sunIntensity: number;
  sunGlowColor: string;
  sunGlowSize: number;
  sunGlowOpacity: number;
  sunGlowDistance: number;
  environmentSunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  skyTop: string;
  skyHorizon: string;
  groundColor: string;
  groundRoughness: number;
  groundMetalness: number;
  groundEnvMapIntensity: number;
  groundRepeat: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  /** Meia-largura da câmara ortográfica de sombra, em metros. */
  shadowBounds: number;
}

export const OUTDOOR_SCENE: Record<OutdoorSceneId, OutdoorSceneConfig> = {
  "outdoor-sun": {
    id: "outdoor-sun",
    sunElevationDeg: 46,
    // Azimute lateral: com o sol quase à frente, a sombra cai atrás da
    // viatura e fica escondida na câmara 3/4.
    sunAzimuthDeg: 88,
    sunDistance: 22,
    sunColor: "#fff3df",
    sunIntensity: 2.9,
    sunGlowColor: "#fff8ec",
    sunGlowSize: 5.5,
    sunGlowOpacity: 0.55,
    sunGlowDistance: 58,
    environmentSunIntensity: 4.2,
    ambientColor: "#e8f1fb",
    ambientIntensity: 0.16,
    hemisphereSky: "#dce9f5",
    hemisphereGround: "#76726a",
    hemisphereIntensity: 0.6,
    skyTop: "#4f86b8",
    skyHorizon: "#cddae4",
    groundColor: "#6f7376",
    groundRoughness: 0.74,
    groundMetalness: 0.03,
    groundEnvMapIntensity: 0.35,
    groundRepeat: 22,
    fogColor: "#cddae4",
    fogNear: 30,
    fogFar: 66,
    shadowBounds: 9,
  },
  "golden-hour": {
    id: "golden-hour",
    sunElevationDeg: 8.5,
    sunAzimuthDeg: 80,
    sunDistance: 26,
    sunColor: "#ffb36b",
    sunIntensity: 3.4,
    sunGlowColor: "#ffd39a",
    sunGlowSize: 11,
    sunGlowOpacity: 0.7,
    sunGlowDistance: 56,
    environmentSunIntensity: 5,
    ambientColor: "#ffd7ae",
    ambientIntensity: 0.18,
    hemisphereSky: "#ffcf9a",
    hemisphereGround: "#4a3b34",
    hemisphereIntensity: 0.55,
    skyTop: "#5c608c",
    skyHorizon: "#f4ab61",
    groundColor: "#77655a",
    groundRoughness: 0.6,
    groundMetalness: 0.03,
    groundEnvMapIntensity: 0.5,
    groundRepeat: 22,
    fogColor: "#f4ab61",
    fogNear: 26,
    fogFar: 66,
    shadowBounds: 14,
  },
};

export const COMPACT_VIEWPORT_WIDTH = 640;

/** Vetor unitário que aponta do centro da viatura para o sol. */
export function sunDirection(
  config: OutdoorSceneConfig
): [number, number, number] {
  const elevation = (config.sunElevationDeg * Math.PI) / 180;
  const azimuth = (config.sunAzimuthDeg * Math.PI) / 180;
  const horizontal = Math.cos(elevation);

  return [
    horizontal * Math.sin(azimuth),
    Math.sin(elevation),
    horizontal * Math.cos(azimuth),
  ];
}

export function isCompactViewport(width: number): boolean {
  return width < COMPACT_VIEWPORT_WIDTH;
}

/** Sombras reais mantêm-se em mobile, mas com metade da resolução. */
export function shadowMapSizeForWidth(width: number, preferred: number): number {
  return isCompactViewport(width) ? Math.min(preferred, 512) : preferred;
}

/** O environment map também desce para 128 px em ecrãs estreitos. */
export function environmentResolutionForWidth(
  width: number,
  preferred: number
): number {
  return isCompactViewport(width) ? Math.min(preferred, 128) : preferred;
}
