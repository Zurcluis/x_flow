// Registry de viaturas 3D do estúdio. Cada modelo define como identificar
// as superfícies a pintar (por nome de mesh ou de material), porque os GLB
// de origens diferentes têm convenções distintas.

export interface CarModelPaint {
  /** Meshes/materials que recebem a película */
  body: string[];
  /** Vidros — material reflexivo escuro */
  glass?: string[];
  /** Jantes, frisos e detalhes em metal escuro */
  metal?: string[];
}

export interface CarModelDef {
  id: string;
  label: string;
  category: string;
  url: string;
  /** Comprimento alvo da viatura em unidades de cena (≈ metros) */
  length: number;
  /** Estratégia de pintura: "mesh" usa nomes de mesh, "material" nomes de material */
  paintBy: "mesh" | "material";
  paint: CarModelPaint;
  /** Meshes a esconder (ex.: sombra AO embebida no ferrari) */
  hide?: string[];
}

export const CAR_MODELS: CarModelDef[] = [
  {
    id: "desportivo",
    label: "458 Desportivo",
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
  },
  {
    id: "sedan",
    label: "Sedão",
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
    category: "Comercial",
    url: "/models/furgao.glb",
    length: 5.2,
    paintBy: "material",
    paint: {
      body: ["truck"],
      glass: ["glass"],
      metal: ["wheels", "window_trim"],
    },
  },
  {
    id: "miniatura",
    label: "Miniatura",
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
