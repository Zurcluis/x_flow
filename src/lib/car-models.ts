// Registry de viaturas 3D do estúdio. Cada modelo define como identificar
// as superfícies a pintar (por nome de mesh ou de material), porque os GLB
// de origens diferentes têm convenções distintas. Para acrescentar marcas e
// modelos novos basta adicionar uma entrada e colocar o GLB numa pasta própria.

export interface CarModelPaint {
  /** Meshes/materials que recebem a película */
  body: string[];
  /** Vidros — material reflexivo escuro (só quando preserveMaterials = false) */
  glass?: string[];
  /** Jantes, frisos e detalhes em metal escuro (só quando preserveMaterials = false) */
  metal?: string[];
}

export interface CarModelCredit {
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  modifications?: string;
}

export interface CarModelDef {
  id: string;
  label: string;
  brand: string;
  category: string;
  url: string;
  /** Comprimento alvo da viatura em unidades de cena (≈ metros) */
  length: number;
  /** Estratégia de pintura: "mesh" usa nomes de mesh, "material" nomes de material */
  paintBy: "mesh" | "material";
  paint: CarModelPaint;
  /** Mantém vidros, pneus, jantes e restantes materiais originais do GLB */
  preserveMaterials?: boolean;
  /** Meshes a esconder (ex.: sombra AO embebida no ferrari) */
  hide?: string[];
  /** Atribuição obrigatória quando o modelo é CC BY ou equivalente */
  credit?: CarModelCredit;
}

export const DEFAULT_CAR_MODEL_ID = "bmw-m4-competition";

export const CAR_MODELS: CarModelDef[] = [
  {
    id: "bmw-m4-competition",
    label: "BMW M4 Competition",
    brand: "BMW",
    category: "Coupé",
    url: "/models/cars/bmw-m4-competition/bmw-m4-competition.web.glb",
    length: 4.79,
    paintBy: "material",
    paint: {
      // A pintura de fábrica está repartida por vários materiais (chapa, livery
      // com riscas M e camadas brancas/zx). Um wrap integral substitui todos,
      // por isso todos recebem o mesmo material da película.
      body: [
        "Meshesbody151Mtl",
        "Mesheslivery1Mtl",
        "Mesheswhite41Mtl",
        "Mesheszx1Mtl",
      ],
    },
    preserveMaterials: true,
    credit: {
      author: "SRT Performance (TheRealSRT)",
      sourceUrl:
        "https://sketchfab.com/3d-models/bmw-m4-competition-m-package-5c0a2dafb1ad408d9fc9eeef9aee531b",
      license: "CC BY 4.0",
      licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
      modifications:
        "Derivado web do GLB original: geometria Meshopt, texturas WebP até 512 px, remoção de meshes de cabine/motor e de três texturas substituídas em runtime.",
    },
  },
  {
    id: "desportivo",
    label: "458 Desportivo",
    brand: "Genérico",
    category: "Desportivo",
    url: "/models/ferrari.glb",
    length: 4.6,
    paintBy: "mesh",
    paint: {
      body: ["body"],
      glass: ["glass"],
      metal: ["rim_fl", "rim_fr", "rim_rl", "rim_rr", "trim"],
    },
    hide: ["shadow"],
    credit: {
      author: "vicent091036",
      sourceUrl:
        "https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf",
      license: "CC BY 4.0",
      licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
    },
  },
  {
    id: "sedan",
    label: "Sedão",
    brand: "Genérico",
    category: "Urbano",
    url: "/models/sedan.glb",
    length: 4.4,
    paintBy: "material",
    paint: {
      body: ["carMat"],
      metal: ["wheelMat"],
    },
  },
  {
    id: "buggy",
    label: "Buggy Technic",
    brand: "Genérico",
    category: "Buggy",
    url: "/models/buggy.gltf",
    length: 3.4,
    paintBy: "mesh",
    paint: {
      body: ["body_"],
    },
  },
  {
    id: "furgao",
    label: "Furgão Comercial",
    brand: "Genérico",
    category: "Comercial",
    url: "/models/furgao.glb",
    length: 5.2,
    paintBy: "material",
    paint: {
      body: ["truck"],
      glass: ["glass"],
      metal: ["wheels", "window_trim"],
    },
    credit: {
      author: "Cesium",
      sourceUrl:
        "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck",
      license: "CC BY 4.0",
      licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
    },
  },
  {
    id: "miniatura",
    label: "Miniatura",
    brand: "Genérico",
    category: "Showroom",
    url: "/models/miniatura.glb",
    length: 2.6,
    paintBy: "material",
    paint: {
      body: ["ToyCar"],
      glass: ["Glass"],
    },
  },
];

export function findCarModel(id: string): CarModelDef {
  return CAR_MODELS.find((m) => m.id === id) ?? CAR_MODELS[0];
}
