export interface PredictionInput {
  bodyType: "coupe" | "sedan" | "suv" | "station_wagon";
  serviceType: "PPF" | "Wrap" | "Color PPF";
  hasHighContrast?: boolean;
  panelCount?: number;
}

export interface TechnicalSequenceStep {
  stepNumber: number;
  phaseName: string;
  description: string;
  recommendedDurationMinutes: number;
  criticalPoints: string[];
}

export function generateTechnicalSequence(
  serviceType: "PPF" | "Wrap" | "Color PPF" = "PPF"
): TechnicalSequenceStep[] {
  const isPpf = serviceType === "PPF";

  return [
    {
      stepNumber: 1,
      phaseName: "Desmontagem Seletiva",
      description: "Desmontagem de puxadores, óticas, grelhas e emblemas para permitir retornos limpos.",
      recommendedDurationMinutes: 120,
      criticalPoints: ["Presilhas plásticas delicadas", "Fichas de sensores elétricos"],
    },
    {
      stepNumber: 2,
      phaseName: "Lavagem & Descontaminação",
      description: "Lavagem profunda com champô desengordurante e barra de argila (Clay Bar).",
      recommendedDurationMinutes: 90,
      criticalPoints: ["Resíduos de cera em frestas", "Desengorduramento com álcool isopropílico IPA"],
    },
    {
      stepNumber: 3,
      phaseName: "Tejadilho & Superfícies Horizontais",
      description: isPpf
        ? "Aplicação a húmido de película PPF no tejadilho e capô com solução slip."
        : "Aplicação a seco de vinil wrap no tejadilho e capô com espatulação e alinhamento.",
      recommendedDurationMinutes: 240,
      criticalPoints: ["Evitar pó em suspensão", "Espatulação uniforme sem bolhas de ar"],
    },
    {
      stepNumber: 4,
      phaseName: "Laterais & Painéis de Portas",
      description: "Aplicação nos guarda-lamas, portas e embaladeiras.",
      recommendedDurationMinutes: 480,
      criticalPoints: ["Retornos em cavas das portas", "Alinhamento das linhas de cintura"],
    },
    {
      stepNumber: 5,
      phaseName: "Frente & Para-choques Dianteiro",
      description: "Aplicação no para-choques frontal com pré-estiramento controlado.",
      recommendedDurationMinutes: 300,
      criticalPoints: ["Sensores de estacionamento ADAS", "Entradas de ar complexas"],
    },
    {
      stepNumber: 6,
      phaseName: "Traseira & Difusor",
      description: "Aplicação no para-choques traseiro, tampa da mala e spoiler.",
      recommendedDurationMinutes: 240,
      criticalPoints: ["Curvatura da cavidade da matrícula", "Bordos do spoiler"],
    },
    {
      stepNumber: 7,
      phaseName: "Cura Térmica & Remontagem",
      description: "Pós-aquecimento com pistola térmica a 90°C nas arestas e remontagem.",
      recommendedDurationMinutes: 180,
      criticalPoints: ["Verificação com termómetro infravermelho", "Teste de luzes e sensores"],
    },
    {
      stepNumber: 8,
      phaseName: "Controlo de Qualidade Scangrip (QC)",
      description: "Inspeção ótica minuciosa sob luz CRI+ 96 a 30cm para certificação.",
      recommendedDurationMinutes: 60,
      criticalPoints: ["10 pontos de controlo formal", "Emissão do Certificado Oficial"],
    },
  ];
}

export function predictEstimatedHours(input: PredictionInput): {
  minHours: number;
  maxHours: number;
  medianHours: number;
} {
  let baseHours = 32.0;

  if (input.bodyType === "suv" || input.bodyType === "station_wagon") {
    baseHours += 4.0;
  }

  if (input.serviceType === "PPF") {
    baseHours += 2.0; // PPF thicker material, requires wet install precision
  }

  if (input.hasHighContrast) {
    baseHours += 3.0; // Extra tucking & disassembly for color change
  }

  return {
    minHours: Math.round((baseHours - 3) * 10) / 10,
    maxHours: Math.round((baseHours + 5) * 10) / 10,
    medianHours: Math.round(baseHours * 10) / 10,
  };
}
