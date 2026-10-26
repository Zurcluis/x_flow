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
  /** Correção de eixos do GLB (radianos), antes da normalização de escala */
  rotation?: [number, number, number];
  /** Estratégia de pintura: "mesh" usa nomes de mesh, "material" nomes de material */
  paintBy: "mesh" | "material";
  paint: CarModelPaint;
  /** Mantém vidros, pneus, jantes e restantes materiais originais do GLB */
  preserveMaterials?: boolean;
  /** Aceita aplicação parcial por zona (capô, tejadilho, frente, traseira) */
  supportsPartialWrap?: boolean;
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
    supportsPartialWrap: true,
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
    id: "car-concept",
    label: "Car Concept",
    brand: "Khronos",
    category: "Concept",
    url: "/models/cars/car-concept/car-concept.web.glb",
    length: 4.56,
    paintBy: "material",
    paint: {
      body: ["Paint 1 Carmine", "Paint 2 Carmine"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Unity Fan / Khronos Group",
      sourceUrl:
        "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",
      license: "CC BY 4.0",
      licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
      modifications:
        "Derivado web do glTF-WEBP oficial: geometria em precisão simples e texturas WebP até 1024 px; sem simplificação de geometria e com nomes de nós/materiais preservados.",
    },
  },
  {
    id: "audi-r8",
    label: "Audi R8",
    brand: "Audi",
    category: "Desportivo",
    url: "/models/cars/audi-r8/audi-r8.web.glb",
    length: 4.43,
    paintBy: "material",
    paint: {
      body: ["r8Vehicle_Exterior_mm_ext1"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/audi/2019_audi_r8_coupe.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/audi/2019_audi_r8_coupe.glb",
      modifications:
        "Derivado web: simplificação de geometria (40% dos vértices), texturas WebP até 1024 px e nomes de materiais preservados. Sem compressão de geometria.",
    },
  },
  {
    id: "porsche-carrera-gt",
    label: "Porsche Carrera GT",
    brand: "Porsche",
    category: "Supercarro",
    url: "/models/cars/porsche-carrera-gt/porsche-carrera-gt.web.glb",
    length: 4.61,
    paintBy: "material",
    paint: {
      body: ["C1_Paint"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Ddiaz Design",
      sourceUrl:
        "https://sketchfab.com/3d-models/2004-porsche-carrera-gt-a43be10ac0174dc0a35984c2d41d4058",
      license: "CC BY 4.0",
      licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
      modifications:
        "Derivado web: simplificação de geometria (30% dos vértices), texturas WebP até 1024 px e nomes de materiais preservados. Sem compressão de geometria.",
    },
  },
  {
    id: "mercedes-g63",
    label: "Mercedes-AMG G63",
    brand: "Mercedes-AMG",
    category: "SUV",
    url: "/models/cars/mercedes-g63/mercedes-g63.web.glb",
    length: 4.87,
    paintBy: "material",
    paint: {
      body: ["MMercedesAMG_G63SUVRewardRecycled_2020Paint_Material1"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Ddiaz Design",
      sourceUrl:
        "https://sketchfab.com/3d-models/2020-mercedes-benz-g-class-amg-g-63-64db1862be754722bbf4f23695bf06a5",
      license: "CC BY-NC 4.0 — uso pessoal",
      licenseUrl: "http://creativecommons.org/licenses/by-nc/4.0/",
      modifications:
        "Derivado web: simplificação de geometria (30% dos vértices), texturas WebP até 1024 px e nomes de materiais preservados. Proibida a utilização comercial.",
    },
  },
  {
    id: "vw-golf-gti-mk7",
    label: "Golf GTI Clubsport",
    brand: "Volkswagen",
    category: "Hot Hatch",
    url: "/models/cars/vw-golf-gti-mk7/vw-golf-gti-mk7.web.glb",
    length: 4.27,
    paintBy: "material",
    paint: {
      body: ["vwphong2SG1"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Ddiaz Design",
      sourceUrl:
        "https://sketchfab.com/3d-models/2016-volkswagen-golf-gti-clubsport-mk7-492301d401ea4fb7bb1cb63e980051d0",
      license: "CC BY-NC-SA 4.0 — uso pessoal",
      licenseUrl: "http://creativecommons.org/licenses/by-nc-sa/4.0/",
      modifications:
        "Derivado web: simplificação de geometria (40% dos vértices), texturas WebP até 1024 px e nomes de materiais preservados. Proibida a utilização comercial; o derivado mantém a mesma licença.",
    },
  },
  {
    id: "lamborghini-huracan-evo",
    label: "Lamborghini Huracán EVO",
    brand: "Lamborghini",
    category: "Supercarro",
    url: "/models/cars/lamborghini-huracan-evo/lamborghini-huracan-evo.web.glb",
    length: 4.52,
    paintBy: "material",
    paint: {
      body: ["EVOLamborghini_HuracanEVOTNR0_2021PaintTNR_Material1"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/lamborghini/2019_lamborghini_huracan_evo.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/lamborghini/2019_lamborghini_huracan_evo.glb",
      modifications:
        "Derivado web: simplificação de geometria (35% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "mclaren-720s-spider",
    label: "McLaren 720S Spider",
    brand: "McLaren",
    category: "Supercarro",
    url: "/models/cars/mclaren-720s-spider/mclaren-720s-spider.web.glb",
    length: 4.54,
    paintBy: "material",
    paint: {
      body: ["Primary_Paint"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/mclaren/mclaren_720S_spider.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/mclaren/mclaren_720S_spider.glb",
      modifications:
        "Derivado web: simplificação de geometria (40% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "chevrolet-corvette-c8",
    label: "Corvette C8 Stingray",
    brand: "Chevrolet",
    category: "Desportivo",
    url: "/models/cars/chevrolet-corvette-c8/chevrolet-corvette-c8.web.glb",
    length: 4.63,
    rotation: [0, Math.PI, 0],
    paintBy: "material",
    paint: {
      body: ["Body_Color"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/chevrolet/2019_chevrolet_corvette_c8_stingray.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/chevrolet/2019_chevrolet_corvette_c8_stingray.glb",
      modifications:
        "Derivado web: simplificação de geometria (40% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "ford-mustang-rtr",
    label: "Ford Mustang RTR",
    brand: "Ford",
    category: "Muscle",
    url: "/models/cars/ford-mustang-rtr/ford-mustang-rtr.web.glb",
    length: 4.79,
    paintBy: "material",
    paint: {
      body: ["FordM_CarPaint_Max_016"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/ford/2015_ford_mustang_rtr.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/ford/2015_ford_mustang_rtr.glb",
      modifications:
        "Derivado web: simplificação de geometria (50% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "ram-1500-trx",
    label: "RAM 1500 TRX",
    brand: "RAM",
    category: "Pickup",
    url: "/models/cars/ram-1500-trx/ram-1500-trx.web.glb",
    length: 5.92,
    paintBy: "material",
    paint: {
      body: [
        "RAM_1500TRX_2021Paint_Material",
        "RAM_1500TRX_2021Coloured_Material",
      ],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/dodge/2021_ram_1500_trx.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/dodge/2021_ram_1500_trx.glb",
      modifications:
        "Derivado web: simplificação de geometria (40% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "rolls-royce-ghost",
    label: "Rolls-Royce Ghost",
    brand: "Rolls-Royce",
    category: "Luxo",
    url: "/models/cars/rolls-royce-ghost/rolls-royce-ghost.web.glb",
    length: 5.55,
    paintBy: "material",
    paint: {
      body: ["rrghost_paint", "rrghost_paint_b"],
    },
    preserveMaterials: true,
    supportsPartialWrap: true,
    credit: {
      author: "Sultan-Sovetov (Draxler)",
      sourceUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/rr/rolls_royce_ghost_new.glb",
      license: "Sem licença declarada — uso pessoal",
      licenseUrl:
        "https://github.com/Sultan-Sovetov/Draxler/blob/main/public/car-models/rr/rolls_royce_ghost_new.glb",
      modifications:
        "Derivado web: simplificação de geometria (30% dos vértices), compressão de geometria Meshopt e nomes de materiais preservados. Texturas originais mantidas.",
    },
  },
  {
    id: "desportivo",
    label: "458 Desportivo",
    brand: "Genérico",
    category: "Desportivo",
    url: "/models/ferrari.glb",
    length: 4.6,
    rotation: [0, Math.PI, 0],
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
];

export function findCarModel(id: string): CarModelDef {
  return CAR_MODELS.find((m) => m.id === id) ?? CAR_MODELS[0];
}
