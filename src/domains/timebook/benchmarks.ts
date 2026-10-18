import type {
  BenchmarkConfidence,
  PanelTimeBenchmark,
  VehicleTimeBookModel,
} from "@/domains/timebook/types";

export interface TimeBookEntryRow {
  make: string;
  model: string;
  generationYear: number;
  bodyType: string;
  vehicleId: string;
  serviceTitle: string;
  workOrderId: string;
  estimatedHours: number;
  phaseKey: string;
  hoursSpent: number;
  notes: string | null;
}

const PHASE_NAMES: Record<string, string> = {
  prep_decontamination: "Preparação e Descontaminação",
  disassembly: "Desmontagem",
  film_cutting: "Corte de Filme",
  application: "Aplicação",
  assembly: "Montagem",
  thermal_cure: "Cura Térmica",
  detailing_finish: "Detalhes e Acabamento",
  quality_control: "Controlo de Qualidade",
  subcontracted: "Subcontratação",
};

const AUTO_NOTES = new Set(["Conclusão de fase"]);

export function confidence(samples: number): BenchmarkConfidence {
  if (samples >= 15) return "reliable";
  if (samples >= 5) return "learning";
  return "initial";
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface ModelGroup {
  make: string;
  model: string;
  generationYear: number;
  bodyType: string;
  serviceCategory: string;
  vehicleIds: Set<string>;
  estimatedHoursByWorkOrder: Map<string, number>;
  estimatedHoursByVehicle: Map<string, number>;
  totalHoursByVehicle: Map<string, number>;
  phases: Map<string, Map<string, number>>;
}

/**
 * Constrói benchmarks apenas com viaturas concluídas e registos reais.
 * Registos automáticos de conclusão de fase (horas estimadas) são excluídos
 * para não contaminar a mediana com tempos planeados. Cada grupo é
 * modelo + ano + carroçaria + serviço, e cada viatura conta uma vez.
 */
export function buildTimeBookModels(rows: TimeBookEntryRow[]): VehicleTimeBookModel[] {
  const byModel = new Map<string, ModelGroup>();

  for (const row of rows) {
    const notes = (row.notes ?? "").trim();
    if (AUTO_NOTES.has(notes) || !(row.hoursSpent > 0)) continue;

    const serviceCategory = row.serviceTitle.trim() || "Serviço não especificado";
    const key = [
      row.make,
      row.model,
      row.generationYear,
      row.bodyType,
      serviceCategory.toLowerCase(),
    ].join("|");

    let group = byModel.get(key);
    if (!group) {
      group = {
        make: row.make,
        model: row.model,
        generationYear: row.generationYear,
        bodyType: row.bodyType,
        serviceCategory,
        vehicleIds: new Set(),
        estimatedHoursByWorkOrder: new Map(),
        estimatedHoursByVehicle: new Map(),
        totalHoursByVehicle: new Map(),
        phases: new Map(),
      };
      byModel.set(key, group);
    }

    group.vehicleIds.add(row.vehicleId);
    group.totalHoursByVehicle.set(
      row.vehicleId,
      round2((group.totalHoursByVehicle.get(row.vehicleId) ?? 0) + row.hoursSpent)
    );

    if (!group.estimatedHoursByWorkOrder.has(row.workOrderId)) {
      group.estimatedHoursByWorkOrder.set(row.workOrderId, row.estimatedHours);
      group.estimatedHoursByVehicle.set(
        row.vehicleId,
        round2((group.estimatedHoursByVehicle.get(row.vehicleId) ?? 0) + row.estimatedHours)
      );
    }

    let phaseEntries = group.phases.get(row.phaseKey);
    if (!phaseEntries) {
      phaseEntries = new Map();
      group.phases.set(row.phaseKey, phaseEntries);
    }
    phaseEntries.set(
      row.vehicleId,
      round2((phaseEntries.get(row.vehicleId) ?? 0) + row.hoursSpent)
    );
  }

  const results: VehicleTimeBookModel[] = [];

  for (const [key, group] of byModel) {
    const serviceType: VehicleTimeBookModel["serviceType"] =
      group.serviceCategory.toLowerCase().includes("wrap") ? "Wrap" : "PPF";
    const panels: PanelTimeBenchmark[] = [];

    for (const [phaseKey, entriesByVehicle] of group.phases) {
      const values = [...entriesByVehicle.values()];
      const phaseMedian = median(values);

      panels.push({
        panelCode: phaseKey,
        panelName: PHASE_NAMES[phaseKey] ?? phaseKey,
        serviceType,
        medianMinutes: Math.round(phaseMedian * 60),
        minMinutes: Math.round(Math.min(...values) * 60),
        maxMinutes: Math.round(Math.max(...values) * 60),
        sampleCount: values.length,
        confidence: confidence(values.length),
      });
    }

    panels.sort((a, b) => b.medianMinutes - a.medianMinutes);

    const totalMedianHours = median([...group.totalHoursByVehicle.values()]);
    const totalEstimatedHours = median([...group.estimatedHoursByVehicle.values()]);
    const sampleCount = group.vehicleIds.size;

    results.push({
      id: `tb-${slug(key)}`,
      make: group.make,
      model: group.model,
      generationYear: group.generationYear,
      bodyType: group.bodyType,
      serviceType,
      serviceCategory: group.serviceCategory,
      totalEstimatedHours: round2(totalEstimatedHours),
      totalMedianHours: round2(totalMedianHours),
      totalSamples: sampleCount,
      overallConfidence: confidence(sampleCount),
      panels,
    });
  }

  return results.sort(
    (a, b) =>
      b.totalSamples - a.totalSamples ||
      a.make.localeCompare(b.make) ||
      a.model.localeCompare(b.model) ||
      a.serviceCategory.localeCompare(b.serviceCategory)
  );
}
