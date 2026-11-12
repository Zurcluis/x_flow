import type { CarCoverageBounds, CarCoverageZone } from "@/lib/car-finish";
import type { CarModelDef } from "@/lib/car-models";

export type CarPartCategory =
  | "paint"
  | "glass"
  | "wheels"
  | "calipers"
  | "grille"
  | "lights"
  | "chrome"
  | "carbon"
  | "pillars"
  | "trim"
  | "interior"
  | "badges"
  | "other";

export type CarPartKind = "paint" | "panel" | "material";

export interface CarPartDef {
  id: string;
  label: string;
  category: CarPartCategory;
  kind: CarPartKind;
}

export type BodyPanelKey = "front" | "hood" | "roof" | "rear" | "left" | "right";

export interface BodyPanelFractions {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  minNormalY: number;
}

export interface BodyPanelDef extends CarPartDef {
  category: "paint";
  kind: "panel";
  fractions: BodyPanelFractions;
}

export interface PartColorPreset {
  id: string;
  label: string;
  color: string | null;
}

const CATEGORY_ORDER: CarPartCategory[] = [
  "paint",
  "glass",
  "lights",
  "grille",
  "wheels",
  "calipers",
  "chrome",
  "carbon",
  "pillars",
  "trim",
  "interior",
  "badges",
  "other",
];

const CATEGORY_LABELS: Record<CarPartCategory, string> = {
  paint: "Carroçaria",
  glass: "Vidros",
  wheels: "Jantes e pneus",
  calipers: "Pinças",
  grille: "Grelhas",
  lights: "Óticas",
  chrome: "Cromados",
  carbon: "Carbono",
  pillars: "Pilares",
  trim: "Detalhes",
  interior: "Interior",
  badges: "Emblemas",
  other: "Outros",
};

const RULES: { category: CarPartCategory; test: RegExp }[] = [
  { category: "calipers", test: /caliper|calliper/i },
  { category: "wheels", test: /wheel|tyre|tire|(?<!t)rim/i },
  { category: "grille", test: /grille|grill/i },
  {
    category: "lights",
    test: /light|signal|indicator|blinker|emiss|taillight|headlight|led\d|\bled\b/i,
  },
  { category: "glass", test: /glass|window|windshield|windscreen|vidrio/i },
  { category: "carbon", test: /carbon/i },
  { category: "badges", test: /badge|logo|emblem|decal|license|plate/i },
  { category: "pillars", test: /pillar/i },
  {
    category: "chrome",
    test: /chrome|nickel|aluminium|aluminum|metal|steel|mirror/i,
  },
  {
    category: "interior",
    test: /interior|seat|leather|suede|stitch|carpet|dash|steering|wood|belt|fabric|floormat|gauge|suede/i,
  },
  {
    category: "trim",
    test: /trim|plastic|black|misc|gasket|underbody|chassis|engine|mechanical|hardware|brake|disc|rotor|base|default|off\b|material/i,
  },
];

const PANEL_PRIORITY: BodyPanelKey[] = [
  "rear",
  "front",
  "roof",
  "hood",
  "left",
  "right",
];

export const PART_COLOR_PRESETS: PartColorPreset[] = [
  { id: "film", label: "Original / película", color: null },
  { id: "gloss-black", label: "Preto brilho", color: "#0b0c0d" },
  { id: "matte-black", label: "Preto mate", color: "#17181a" },
  { id: "white", label: "Branco", color: "#f1f1ec" },
  { id: "silver", label: "Prata", color: "#c7ccd2" },
  { id: "chrome", label: "Cromado", color: "#dfe4e9" },
  { id: "gold", label: "Dourado", color: "#d3a548" },
  { id: "red", label: "Vermelho", color: "#ad1f1f" },
  { id: "blue", label: "Azul", color: "#1d4f9c" },
  { id: "carbon", label: "Carbono", color: "#111214" },
];

export const BODY_PANEL_DEFS: BodyPanelDef[] = [
  {
    id: "panel:front",
    label: "Frente",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 0.62,
      minZ: 0.82,
      maxZ: 1,
      minNormalY: -1,
    },
  },
  {
    id: "panel:hood",
    label: "Capô",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0.12,
      maxX: 0.88,
      minY: 0.42,
      maxY: 1,
      minZ: 0.6,
      maxZ: 0.92,
      minNormalY: 0.15,
    },
  },
  {
    id: "panel:roof",
    label: "Tejadilho",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0.12,
      maxX: 0.88,
      minY: 0.58,
      maxY: 1,
      minZ: 0.28,
      maxZ: 0.62,
      minNormalY: 0.15,
    },
  },
  {
    id: "panel:rear",
    label: "Traseira",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 0.8,
      minZ: 0,
      maxZ: 0.2,
      minNormalY: -1,
    },
  },
  {
    id: "panel:left",
    label: "Lateral esq.",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0,
      maxX: 0.34,
      minY: 0.12,
      maxY: 0.8,
      minZ: 0.18,
      maxZ: 0.88,
      minNormalY: -1,
    },
  },
  {
    id: "panel:right",
    label: "Lateral dir.",
    category: "paint",
    kind: "panel",
    fractions: {
      minX: 0.66,
      maxX: 1,
      minY: 0.12,
      maxY: 0.8,
      minZ: 0.18,
      maxZ: 0.88,
      minNormalY: -1,
    },
  },
];

function matches(name: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((pattern) => name === pattern || name.startsWith(pattern));
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function humanizeMaterialName(name: string): string {
  const cleaned = name
    .replace(/^[^:]{1,16}:/, "")
    .replace(/Mtl$/i, "")
    .replace(/Material\d*$/i, "")
    .replace(/(SG1|_0|\.\d+)$/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Material";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function partForCategory(category: CarPartCategory): CarPartDef {
  return {
    id: category,
    label: CATEGORY_LABELS[category],
    category,
    kind: "material",
  };
}

function classifyName(name: string): CarPartDef | null {
  if (!name) return null;
  for (const rule of RULES) {
    if (rule.test.test(name)) return partForCategory(rule.category);
  }
  return null;
}

export function classifyPart(
  meshName: string,
  materialName: string,
  def: CarModelDef
): CarPartDef {
  const body = def.paint.body;
  const isBody =
    def.paintBy === "mesh"
      ? matches(meshName, body)
      : matches(materialName, body);
  if (isBody) return partForCategory("paint");

  const glass = def.paint.glass;
  const isGlass =
    def.paintBy === "mesh"
      ? matches(meshName, glass)
      : matches(materialName, glass);
  if (isGlass) return partForCategory("glass");

  const metal = def.paint.metal;
  const isMetal =
    def.paintBy === "mesh"
      ? matches(meshName, metal)
      : matches(materialName, metal);
  if (isMetal) {
    const isWheel = /wheel|tyre|tire|(?<!t)rim/i.test(
      `${meshName} ${materialName}`
    );
    return partForCategory(isWheel ? "wheels" : "trim");
  }

  const byMaterial = classifyName(materialName);
  const byMesh = classifyName(meshName);
  if (byMaterial && byMesh && byMaterial.category !== byMesh.category) {
    const strongMeshCategories: CarPartCategory[] = [
      "wheels",
      "glass",
      "lights",
      "calipers",
      "grille",
    ];
    if (strongMeshCategories.includes(byMesh.category)) return byMesh;
  }

  return (
    byMaterial ??
    byMesh ?? {
      id: `material:${slug(materialName || meshName) || "part"}`,
      label: humanizeMaterialName(materialName || meshName),
      category: "other",
      kind: "material",
    }
  );
}

function sortParts(parts: CarPartDef[]): CarPartDef[] {
  return [...parts].sort((a, b) => {
    const order =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (order !== 0) return order;
    return a.label.localeCompare(b.label, "pt-PT");
  });
}

export function collectCarParts(
  root: { traverse: (callback: (object: unknown) => void) => void },
  def: CarModelDef
): CarPartDef[] {
  const map = new Map<string, CarPartDef>();

  root.traverse((object) => {
    const mesh = object as {
      isMesh?: boolean;
      visible?: boolean;
      name?: string;
      material?: { name?: string } | { name?: string }[] | undefined;
    };
    if (!mesh.isMesh || mesh.visible === false) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const material of materials) {
      const part = classifyPart(mesh.name ?? "", material?.name ?? "", def);
      if (!map.has(part.id)) map.set(part.id, part);
    }
  });

  const parts = sortParts([...map.values()]);
  if (map.has("paint")) {
    const index = parts.findIndex((part) => part.id === "paint");
    parts.splice(index + 1, 0, ...BODY_PANEL_DEFS);
  }

  return parts;
}

function fraction(value: number, min: number, span: number): number {
  if (span <= 0) return 0;
  return (value - min) / span;
}

export function resolvePanelZone(
  panelId: string,
  bounds: CarCoverageBounds
): CarCoverageZone | null {
  const panel = BODY_PANEL_DEFS.find((entry) => entry.id === panelId);
  if (!panel) return null;
  const { fractions } = panel;
  const xSpan = bounds.max.x - bounds.min.x;
  const ySpan = bounds.max.y - bounds.min.y;
  const zSpan = bounds.max.z - bounds.min.z;

  return {
    minX: bounds.min.x + xSpan * fractions.minX,
    maxX: bounds.min.x + xSpan * fractions.maxX,
    minY: bounds.min.y + ySpan * fractions.minY,
    maxY: bounds.min.y + ySpan * fractions.maxY,
    minZ: bounds.min.z + zSpan * fractions.minZ,
    maxZ: bounds.min.z + zSpan * fractions.maxZ,
    minNormalY: fractions.minNormalY,
  };
}

export function panelAtPoint(
  point: { x: number; y: number; z: number },
  bounds: CarCoverageBounds
): string | null {
  const xSpan = bounds.max.x - bounds.min.x;
  const ySpan = bounds.max.y - bounds.min.y;
  const zSpan = bounds.max.z - bounds.min.z;
  const x = fraction(point.x, bounds.min.x, xSpan);
  const y = fraction(point.y, bounds.min.y, ySpan);
  const z = fraction(point.z, bounds.min.z, zSpan);
  const tolerance = 0.01;

  for (const key of PANEL_PRIORITY) {
    const panel = BODY_PANEL_DEFS.find((entry) => entry.id === `panel:${key}`);
    if (!panel) continue;
    const { fractions } = panel;
    if (
      x >= fractions.minX - tolerance &&
      x <= fractions.maxX + tolerance &&
      y >= fractions.minY - tolerance &&
      y <= fractions.maxY + tolerance &&
      z >= fractions.minZ - tolerance &&
      z <= fractions.maxZ + tolerance
    ) {
      return panel.id;
    }
  }

  return null;
}

export function partSwatchColor(
  part: CarPartDef,
  partColors: Record<string, string>,
  filmColor: string
): string | null {
  const override = partColors[part.id];
  if (override) return override;
  if (part.id === "paint" || part.kind === "panel") return filmColor;
  return null;
}
