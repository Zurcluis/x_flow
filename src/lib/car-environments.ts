export const ENVIRONMENT_IDS = [
  "dark-studio",
  "xmotion-workshop",
  "outdoor-sun",
  "golden-hour",
] as const;

export type EnvironmentId = (typeof ENVIRONMENT_IDS)[number];

export type EnvironmentIconKey = "aperture" | "warehouse" | "sun" | "sunset";

export type EnvironmentAvailability = "available" | "planned";

export interface EnvironmentQuality {
  environmentResolution: number;
  dprMax: number;
  shadows: boolean;
  shadowMapSize: number;
}

export interface ContactShadowsConfig {
  enabled: boolean;
  opacity: number;
  scale: number;
  blur: number;
  far: number;
  resolution: number;
  color: string;
  positionY: number;
}

export interface CarEnvironment {
  id: EnvironmentId;
  name: string;
  icon: EnvironmentIconKey;
  availability: EnvironmentAvailability;
  background: string | null;
  captureBackground: string;
  exposure: number;
  quality: EnvironmentQuality;
  contactShadows: ContactShadowsConfig;
}

export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = "dark-studio";

export const CAR_ENVIRONMENTS: readonly CarEnvironment[] = [
  {
    id: "dark-studio",
    name: "Estúdio Dark",
    icon: "aperture",
    availability: "available",
    background: null,
    captureBackground: "#080b0c",
    exposure: 1,
    quality: {
      environmentResolution: 256,
      dprMax: 2,
      shadows: false,
      shadowMapSize: 512,
    },
    contactShadows: {
      enabled: true,
      opacity: 0.55,
      scale: 16,
      blur: 2.4,
      far: 2.4,
      resolution: 512,
      color: "#000000",
      positionY: 0,
    },
  },
  {
    id: "xmotion-workshop",
    name: "Oficina X-Motion",
    icon: "warehouse",
    availability: "available",
    background: "#0b0d0e",
    captureBackground: "#0b0d0e",
    exposure: 1,
    quality: {
      environmentResolution: 256,
      dprMax: 1.75,
      shadows: false,
      shadowMapSize: 1024,
    },
    contactShadows: {
      enabled: true,
      opacity: 0.45,
      scale: 14,
      blur: 2.8,
      far: 2.2,
      resolution: 512,
      color: "#000000",
      positionY: 0,
    },
  },
  {
    id: "outdoor-sun",
    name: "Luz do Dia",
    icon: "sun",
    availability: "planned",
    background: "#c9d9e6",
    captureBackground: "#c9d9e6",
    exposure: 0.9,
    quality: {
      environmentResolution: 256,
      dprMax: 2,
      shadows: true,
      shadowMapSize: 1024,
    },
    contactShadows: {
      enabled: false,
      opacity: 0.4,
      scale: 20,
      blur: 2.8,
      far: 3,
      resolution: 512,
      color: "#000000",
      positionY: 0.002,
    },
  },
  {
    id: "golden-hour",
    name: "Pôr do Sol",
    icon: "sunset",
    availability: "planned",
    background: "#e6a15e",
    captureBackground: "#e6a15e",
    exposure: 0.95,
    quality: {
      environmentResolution: 256,
      dprMax: 1.75,
      shadows: true,
      shadowMapSize: 1024,
    },
    contactShadows: {
      enabled: false,
      opacity: 0.4,
      scale: 20,
      blur: 2.8,
      far: 3,
      resolution: 512,
      color: "#000000",
      positionY: 0.002,
    },
  },
];

export function findEnvironment(id: string): CarEnvironment {
  return CAR_ENVIRONMENTS.find((environment) => environment.id === id) ?? CAR_ENVIRONMENTS[0];
}

export function availableEnvironments(): CarEnvironment[] {
  return CAR_ENVIRONMENTS.filter(
    (environment) => environment.availability === "available"
  );
}
