import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import { VehicleTimeBookModel } from "@/domains/timebook/types";





function confidence(samples: number): "initial" | "learning" | "reliable" {
  if (samples >= 15) return "reliable";
  if (samples >= 5) return "learning";
  return "initial";
}

export async function listTimeBookBenchmarks(
  organizationId: string
): Promise<VehicleTimeBookModel[]> {
  const { rows } = await getDb().query<Record<string, unknown>>(
    `SELECT v.make, v.model, v.generation_year, v.body_type,
            te.phase_key, te.hours_spent
     FROM work_order_time_entries te
     JOIN work_orders w ON w.id = te.work_order_id
     JOIN vehicles v ON v.id = w.vehicle_id
     WHERE w.organization_id = $1`,
    [organizationId]
  );

  if (rows.length === 0) return [];

  // agrupar por viatura (marca+modelo) → fase
  const byModel = new Map<
    string,
    { make: string; model: string; year: number; body: string; phases: Map<string, number[]> }
  >();
  for (const r of rows) {
    const key = `${r.make}|${r.model}`;
    if (!byModel.has(key)) {
      byModel.set(key, {
        make: String(r.make),
        model: String(r.model),
        year: Number(r.generation_year),
        body: String(r.body_type),
        phases: new Map(),
      });
    }
    const phases = byModel.get(key)!.phases;
    const pk = String(r.phase_key);
    if (!phases.has(pk)) phases.set(pk, []);
    phases.get(pk)!.push(Number(r.hours_spent));
  }

  const results: VehicleTimeBookModel[] = [];
  for (const [key, entry] of byModel) {
    const phaseBenchmarks: VehicleTimeBookModel["panels"] = [];
    let totalSamples = 0;
    let totalMedian = 0;
    for (const [phaseKey, values] of entry.phases) {
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const medianMinutes = Math.round(median * 60);
      totalSamples += values.length;
      totalMedian += median;
      phaseBenchmarks.push({
        panelCode: phaseKey,
        panelName: PHASE_NAMES[phaseKey] ?? phaseKey,
        serviceType: "PPF",
        medianMinutes,
        minMinutes: Math.round(sorted[0] * 60),
        maxMinutes: Math.round(sorted[sorted.length - 1] * 60),
        sampleCount: values.length,
        confidence: confidence(values.length),
      });
    }
    results.push({
      id: `tb-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      make: entry.make,
      model: entry.model,
      generationYear: entry.year,
      bodyType: entry.body,
        serviceType: entry.body.toLowerCase().includes("wrap") ? "Wrap" : "PPF",
      totalEstimatedHours: totalMedian,
      totalMedianHours: totalMedian,
      totalSamples,
      overallConfidence: confidence(totalSamples),
      panels: phaseBenchmarks,
    });
  }
  return results.sort((a, b) => b.totalSamples - a.totalSamples);
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
};

export { getPrimaryOrganizationId };
