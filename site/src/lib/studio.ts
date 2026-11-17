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

export const turboXColors = [
  { name: "Original", hex: "original" },
  { name: "Branco polar", hex: "#f4f4f0" },
  { name: "Prata lunar", hex: "#acb4bb" },
  { name: "Cinza grafite", hex: "#555b62" },
  { name: "Preto ónix", hex: "#202328" },
  { name: "Vermelho racing", hex: "#c32c35" },
  { name: "Laranja turbo", hex: "#eb6a2f" },
  { name: "Amarelo solar", hex: "#ecc53d" },
  { name: "Verde floresta", hex: "#246451" },
  { name: "Azul oceano", hex: "#2855a3" },
  { name: "Azul glacial", hex: "#90becf" },
  { name: "Roxo ametista", hex: "#735486" },
] as const;

export const turboXFinishes = [
  { value: "Brilhante", name: "Brilho" },
  { value: "Fosco", name: "Mate" },
  { value: "Acetinado", name: "Acetinado" },
  { value: "Metálico", name: "Metálico" },
] as const;

export const turboXServices = [
  {
    value: "vinil",
    name: "Vinil",
    subtitle: "Car Wrap · Cor",
    description: "Mudança de cor total em filme vinílico automóvel.",
  },
  {
    value: "ppf",
    name: "PPF",
    subtitle: "Transparente",
    description: "Proteção invisível 200 µm sobre a pintura de origem (Brilho ou Stealth Mate).",
  },
  {
    value: "color-ppf",
    name: "PPF de Cor",
    subtitle: "Proteção + Cor",
    description: "Cor personalizada com a espessura e profundidade do PPF.",
  },
] as const;

export const turboXHeadlights = [
  { value: "Transparente", name: "Transparente", level: "Proteção · Incolor", preview: "linear-gradient(135deg,#eef3f6,#cfd9df)" },
  { value: "Fumado leve", name: "Fumado leve", level: "Nível 1 · Claro", preview: "linear-gradient(135deg,#adb7bf,#8c97a0)" },
  { value: "Fumado médio", name: "Fumado médio", level: "Nível 2 · Médio", preview: "linear-gradient(135deg,#66717b,#4d5760)" },
  { value: "Fumado escuro", name: "Fumado escuro", level: "Nível 3 · Escuro", preview: "linear-gradient(135deg,#2a3138,#14191e)" },
] as const;

export const turboXChromeZones = [
  { key: "doors", name: "Frisos das portas", detail: "Contorno das janelas e frisos laterais" },
  { key: "front", name: "Frente", detail: "Grelha e acabamentos dianteiros" },
  { key: "rear", name: "Traseira", detail: "Frisos, difusor e detalhes traseiros" },
  { key: "mirrors", name: "Espelhos", detail: "Capas dos retrovisores exteriores" },
] as const;

export const turboXChromeFinishes = ["Preto brilho", "Preto mate"] as const;
