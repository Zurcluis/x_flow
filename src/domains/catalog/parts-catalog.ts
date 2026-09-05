import { VehicleBodyPart } from "./types";

export const MASTER_BODY_PARTS: VehicleBodyPart[] = [
  // Front Zone
  {
    code: "hood",
    namePt: "Capô",
    category: "front",
    defaultAreaM2: 1.6,
    baseLaborHours: 2.5,
    basePrice: 380,
  },
  {
    code: "front_bumper",
    namePt: "Para-choques Frontal",
    category: "front",
    defaultAreaM2: 1.4,
    baseLaborHours: 3.5,
    basePrice: 450,
  },
  {
    code: "front_fenders",
    namePt: "Guarda-lamas Frontais (Par)",
    category: "front",
    defaultAreaM2: 1.8,
    baseLaborHours: 3.0,
    basePrice: 390,
  },
  {
    code: "headlights",
    namePt: "Óticas Frontais (Par)",
    category: "front",
    defaultAreaM2: 0.3,
    baseLaborHours: 0.8,
    basePrice: 120,
  },
  {
    code: "mirrors",
    namePt: "Capas dos Retrovisores (Par)",
    category: "front",
    defaultAreaM2: 0.3,
    baseLaborHours: 1.2,
    basePrice: 140,
  },

  // Side Zone
  {
    code: "doors",
    namePt: "Portas Completas",
    category: "side",
    defaultAreaM2: 3.2,
    baseLaborHours: 5.0,
    basePrice: 680,
  },
  {
    code: "rocker_panels",
    namePt: "Embaladeiras / Saias Laterais",
    category: "side",
    defaultAreaM2: 1.2,
    baseLaborHours: 2.0,
    basePrice: 280,
  },
  {
    code: "rear_fenders",
    namePt: "Painéis / Guarda-lamas Traseiros",
    category: "side",
    defaultAreaM2: 2.4,
    baseLaborHours: 4.0,
    basePrice: 520,
  },
  {
    code: "pillars_a_b_c",
    namePt: "Pilares A, B e C",
    category: "side",
    defaultAreaM2: 0.8,
    baseLaborHours: 2.0,
    basePrice: 220,
  },

  // Roof Zone
  {
    code: "roof",
    namePt: "Tejadilho",
    category: "roof",
    defaultAreaM2: 2.2,
    baseLaborHours: 3.0,
    basePrice: 420,
  },

  // Rear Zone
  {
    code: "rear_bumper",
    namePt: "Para-choques Traseiro",
    category: "rear",
    defaultAreaM2: 1.3,
    baseLaborHours: 3.0,
    basePrice: 410,
  },
  {
    code: "trunk_gate",
    namePt: "Mala / Porta da Bagageira",
    category: "rear",
    defaultAreaM2: 1.2,
    baseLaborHours: 2.5,
    basePrice: 320,
  },
  {
    code: "rear_spoiler",
    namePt: "Aileron / Difusor Traseiro",
    category: "rear",
    defaultAreaM2: 0.4,
    baseLaborHours: 1.5,
    basePrice: 180,
  },

  // Interior / Detailing
  {
    code: "interior_screens",
    namePt: "Ecrãs e Consola Central",
    category: "interior",
    defaultAreaM2: 0.2,
    baseLaborHours: 1.0,
    basePrice: 150,
  },
  {
    code: "door_sills",
    namePt: "Soleiras das Portas e Cavas",
    category: "interior",
    defaultAreaM2: 0.5,
    baseLaborHours: 1.2,
    basePrice: 160,
  },
];

export interface PredefinedPackage {
  id: string;
  name: string;
  description: string;
  partCodes: string[];
}

export const PREDEFINED_PACKAGES: PredefinedPackage[] = [
  {
    id: "pkg-front-std",
    name: "Pack Frontal Essencial",
    description: "Proteção básica contra gravilha: Capô, Para-choques frontal e Óticas.",
    partCodes: ["hood", "front_bumper", "headlights"],
  },
  {
    id: "pkg-front-full",
    name: "Pack Frontal Completo & Highway",
    description: "Frente completa: Capô, Para-choques, Guarda-lamas frontais, Óticas, Retrovisores e Soleiras.",
    partCodes: ["hood", "front_bumper", "front_fenders", "headlights", "mirrors", "door_sills"],
  },
  {
    id: "pkg-track-pack",
    name: "Track & Extended Pack",
    description: "Proteção frontal completa + Embaladeiras laterais, Cavas traseiras e Pilares A.",
    partCodes: [
      "hood",
      "front_bumper",
      "front_fenders",
      "headlights",
      "mirrors",
      "rocker_panels",
      "pillars_a_b_c",
      "door_sills",
    ],
  },
  {
    id: "pkg-full-body",
    name: "Proteção Integral (Full Body PPF)",
    description: "Cobertura total de 100% da pintura exterior com retornos estendidos em todas as arestas.",
    partCodes: [
      "hood",
      "front_bumper",
      "front_fenders",
      "headlights",
      "mirrors",
      "doors",
      "rocker_panels",
      "rear_fenders",
      "pillars_a_b_c",
      "roof",
      "rear_bumper",
      "trunk_gate",
      "rear_spoiler",
      "door_sills",
    ],
  },
];
