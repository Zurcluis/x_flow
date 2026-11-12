export const studioViews = [
  { src: "/images/studio-0.webp", label: "Três quartos", alt: "vista três quartos" },
  { src: "/images/studio-1.webp", label: "Frente", alt: "vista frente" },
  { src: "/images/studio-2.webp", label: "Lateral", alt: "vista lateral" },
  { src: "/images/studio-3.webp", label: "Traseira", alt: "vista traseira" },
] as const;

export const studioColors = [
  { name: "Azul profundo", hex: "#1e3c69" },
  { name: "Verde petróleo", hex: "#24524b" },
  { name: "Bordeaux", hex: "#6c2a3d" },
  { name: "Grafite", hex: "#505254" },
  { name: "Prata", hex: "#bec1c3" },
] as const;

export const studioFinishes = [
  { name: "Brilho", filter: "contrast(1.08) brightness(1.02)", tintOpacity: 1 },
  { name: "Acetinado", filter: "contrast(1.03) brightness(.99)", tintOpacity: 0.93 },
  { name: "Mate", filter: "contrast(.94) brightness(.96)", tintOpacity: 0.86 },
] as const;

export type StudioView = (typeof studioViews)[number];
export type StudioColor = (typeof studioColors)[number];
export type StudioFinish = (typeof studioFinishes)[number];
