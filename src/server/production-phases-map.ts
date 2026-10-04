// Mapeamento de fases de produção para subcontratações de orçamentos flexíveis.
// Plano (X-Flow_Plano_Orcamentos_Flexiveis_AntiGravity.md §10.6, §12.4, §13 Fase 3):
// os tempos planeados da ordem de trabalho vêm da opção efetivamente aprovada e a
// aprovação é idempotente e transacional. Cada linha sublet da opção aprovada gera
// uma fase de subcontratação com o serviço do fornecedor e o custo real (total da
// linha + taxa de gestão); a fase interna substituída deixa de ser criada.

import type { PoolClient } from "pg";
import { round2 } from "@/domains/pricing/engine";
import type { PhaseKey } from "@/domains/production/types";

type Row = Record<string, unknown>;

export type PhaseInsertClient = Pick<PoolClient, "query">;

// Fase dedicada para subcontratações sem fase interna mapeada (chave nova na migração 23).
export const SUBLET_PHASE_KEY: PhaseKey = "subcontracted";

export interface StandardPhaseDefinition {
  key: PhaseKey;
  name: string;
  weight: number;
}

// Pesos proporcionais às horas fixas do fluxo antigo (Σ = 33 h) — um wrap de 33 h
// aprovado produz exatamente as mesmas horas por fase que antes eram fixas.
export const STANDARD_INTERNAL_PHASES: StandardPhaseDefinition[] = [
  { key: "prep_decontamination", name: "Preparação e Descontaminação", weight: 2 },
  { key: "disassembly", name: "Desmontagem", weight: 2.5 },
  { key: "film_cutting", name: "Corte de Filme", weight: 4 },
  { key: "application", name: "Aplicação", weight: 18 },
  { key: "assembly", name: "Montagem", weight: 2.5 },
  { key: "thermal_cure", name: "Cura Térmica", weight: 1.5 },
  { key: "detailing_finish", name: "Detalhes e Acabamento", weight: 1.5 },
  { key: "quality_control", name: "Controlo de Qualidade", weight: 1 },
];

const PHASE_NAME_MAX_LENGTH = 100;

// Aliases normalizados (sem acentos, minúsculas, espaços/hífens) → chave canónica.
// O ecrã "Fase interna substituída" aceita texto livre (ex.: "desassembly").
const PHASE_KEY_ALIASES: Record<string, PhaseKey> = {
  prep: "prep_decontamination",
  "prep decontamination": "prep_decontamination",
  preparacao: "prep_decontamination",
  "preparacao e descontaminacao": "prep_decontamination",
  decontamination: "prep_decontamination",
  descontaminacao: "prep_decontamination",
  disassembly: "disassembly",
  desassembly: "disassembly",
  desmontagem: "disassembly",
  desmontar: "disassembly",
  "film cutting": "film_cutting",
  "corte de filme": "film_cutting",
  corte: "film_cutting",
  cutting: "film_cutting",
  application: "application",
  aplicacao: "application",
  aplicar: "application",
  assembly: "assembly",
  montagem: "assembly",
  montar: "assembly",
  "thermal cure": "thermal_cure",
  "cura termica": "thermal_cure",
  cura: "thermal_cure",
  "detailing finish": "detailing_finish",
  detailing: "detailing_finish",
  acabamento: "detailing_finish",
  detalhes: "detailing_finish",
  "quality control": "quality_control",
  qc: "quality_control",
  "controlo de qualidade": "quality_control",
  qualidade: "quality_control",
};

export function normalizePhaseKey(raw: string | null | undefined): PhaseKey | null {
  if (!raw) return null;
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return PHASE_KEY_ALIASES[normalized] ?? null;
}

export interface PhasePlanServiceLine {
  mode: "complete" | "spot";
  hours: number;
}

export interface PhasePlanSubletLine {
  lineName: string;
  supplierServiceId: string | null;
  supplierName: string | null;
  serviceName: string | null;
  replacedPhaseKey: string | null;
  phaseHours: number | null;
  deductedHours: number | null;
  totalCost: number;
}

export interface PhasePlanInput {
  serviceLines: PhasePlanServiceLine[];
  subletLines: PhasePlanSubletLine[];
  subletFeePercent: number;
}

export interface PlannedSublet {
  supplierServiceId: string;
  supplierName: string;
  serviceName: string;
  lineName: string;
  replacedPhaseKey: string | null;
  mappedPhaseKey: PhaseKey | null;
  hours: number;
  baseCost: number;
  feeCost: number;
  totalCost: number;
}

export interface PlannedPhase {
  phaseKey: PhaseKey;
  name: string;
  estimatedHours: number;
  source: "internal" | "sublet";
  sublet: PlannedSublet | null;
}

export interface PhasePlan {
  phases: PlannedPhase[];
  replacedInternalPhaseKeys: PhaseKey[];
  internalPlannedHours: number;
  subletBaseCost: number;
  subletFeeCost: number;
  subletRealCost: number;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function clampName(name: string): string {
  return name.length <= PHASE_NAME_MAX_LENGTH ? name : name.slice(0, PHASE_NAME_MAX_LENGTH);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function buildSublet(
  line: PhasePlanSubletLine,
  subletFeePercent: number
): PlannedSublet {
  const baseCost = round2(Math.max(0, line.totalCost));
  const feeCost = round2((baseCost * clampPercent(subletFeePercent)) / 100);
  const hours = round2(
    Math.max(0, line.phaseHours ?? line.deductedHours ?? 0)
  );
  return {
    supplierServiceId: line.supplierServiceId ?? "",
    supplierName: (line.supplierName ?? "").trim(),
    serviceName: (line.serviceName ?? "").trim(),
    lineName: (line.lineName ?? "").trim(),
    replacedPhaseKey: line.replacedPhaseKey ?? null,
    mappedPhaseKey: normalizePhaseKey(line.replacedPhaseKey),
    hours,
    baseCost,
    feeCost,
    totalCost: round2(baseCost + feeCost),
  };
}

// Horas internas aplanadas = declaradas − deduzidas pelas subcontratações,
// espelhando o motor de preços (dedução consome primeiro as horas completas,
// depois as pontuais) para que a produção receba as horas da opção aprovada.
export function computeBilledHours(serviceLines: PhasePlanServiceLine[], subletLines: PhasePlanSubletLine[]): number {
  const declaredHours = round2(
    sum(serviceLines.map((line) => Math.max(0, line.hours)))
  );
  const completeHours = round2(
    sum(
      serviceLines
        .filter((line) => line.mode === "complete")
        .map((line) => Math.max(0, line.hours))
    )
  );
  const deductedHours = round2(
    sum(subletLines.map((line) => Math.max(0, line.deductedHours ?? 0)))
  );
  let remaining = Math.max(0, deductedHours);
  const completeBilled = Math.max(0, round2(completeHours - remaining));
  remaining = round2(Math.max(0, remaining - (completeHours - completeBilled)));
  const spotHours = Math.max(0, round2(declaredHours - completeHours));
  const spotBilled = Math.max(0, round2(spotHours - remaining));
  return round2(completeBilled + spotBilled);
}

function distributeInternalHours(
  billedHours: number,
  replacedKeys: Set<PhaseKey>
): PlannedPhase[] {
  const definitions = STANDARD_INTERNAL_PHASES.filter(
    (definition) => !replacedKeys.has(definition.key)
  );
  const totalWeight = round2(sum(definitions.map((definition) => definition.weight)));
  let accumulated = 0;
  return definitions.map((definition, index) => {
    const hours =
      billedHours <= 0
        ? 0
        : index === definitions.length - 1
        ? round2(Math.max(0, billedHours - accumulated))
        : round2((billedHours * definition.weight) / totalWeight);
    accumulated = round2(accumulated + hours);
    return {
      phaseKey: definition.key,
      name: definition.name,
      estimatedHours: hours,
      source: "internal" as const,
      sublet: null,
    };
  });
}

function subletPhaseName(sublet: PlannedSublet): string {
  const service = sublet.serviceName || sublet.lineName || "Subcontratação";
  const label = sublet.supplierName ? `${service} (${sublet.supplierName})` : service;
  return clampName(`Subcontratação — ${label}`);
}

export function buildPhasePlan(input: PhasePlanInput): PhasePlan {
  const sublets = input.subletLines.map((line) =>
    buildSublet(line, input.subletFeePercent)
  );

  const billedHours = computeBilledHours(input.serviceLines, input.subletLines);
  const replacedInternalPhaseKeys = Array.from(
    new Set(
      sublets
        .map((sublet) => sublet.mappedPhaseKey)
        .filter((key): key is PhaseKey => key !== null)
    )
  );
  const replacedKeys = new Set(replacedInternalPhaseKeys);

  const mappedSubletsByKey = new Map<PhaseKey, PlannedSublet[]>();
  const unmappedSublets: PlannedSublet[] = [];
  for (const sublet of sublets) {
    if (sublet.mappedPhaseKey) {
      const existing = mappedSubletsByKey.get(sublet.mappedPhaseKey) ?? [];
      existing.push(sublet);
      mappedSubletsByKey.set(sublet.mappedPhaseKey, existing);
    } else {
      unmappedSublets.push(sublet);
    }
  }

  const internalPhases = distributeInternalHours(billedHours, replacedKeys);

  const ordered: PlannedPhase[] = [];
  for (const definition of STANDARD_INTERNAL_PHASES) {
    if (replacedKeys.has(definition.key)) {
      for (const sublet of mappedSubletsByKey.get(definition.key) ?? []) {
        ordered.push({
          phaseKey: SUBLET_PHASE_KEY,
          name: subletPhaseName(sublet),
          estimatedHours: sublet.hours,
          source: "sublet",
          sublet,
        });
      }
    } else {
      const internal = internalPhases.find((phase) => phase.phaseKey === definition.key);
      if (internal) ordered.push(internal);
    }
  }

  // Subcontratações sem fase interna mapeada: trabalho externo adicional, mantido
  // antes do último passo (controlo de qualidade) para que este continue no fim.
  const isQualityControlStep = (phase: PlannedPhase) =>
    phase.phaseKey === "quality_control" ||
    (phase.source === "sublet" && phase.sublet?.mappedPhaseKey === "quality_control");
  const tail: PlannedPhase[] = [];
  while (ordered.length > 0 && isQualityControlStep(ordered[ordered.length - 1])) {
    tail.unshift(ordered.pop()!);
  }
  for (const sublet of unmappedSublets) {
    ordered.push({
      phaseKey: SUBLET_PHASE_KEY,
      name: subletPhaseName(sublet),
      estimatedHours: sublet.hours,
      source: "sublet",
      sublet,
    });
  }
  ordered.push(...tail);

  return {
    phases: ordered,
    replacedInternalPhaseKeys,
    internalPlannedHours: round2(
      sum(ordered.filter((phase) => phase.source === "internal").map((phase) => phase.estimatedHours))
    ),
    subletBaseCost: round2(sum(sublets.map((sublet) => sublet.baseCost))),
    subletFeeCost: round2(sum(sublets.map((sublet) => sublet.feeCost))),
    subletRealCost: round2(sum(sublets.map((sublet) => sublet.totalCost))),
  };
}

// ===== Camada de base de dados (executada dentro da transação de aprovação) =====

export async function insertPlannedPhases(
  client: PhaseInsertClient,
  workOrderId: string,
  phases: PlannedPhase[]
): Promise<void> {
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index];
    await client.query(
      `INSERT INTO work_order_phases
        (work_order_id, phase_key, name, status, order_index, estimated_hours,
         supplier_service_id, sublet_base_cost, sublet_fee_cost)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8)`,
      [
        workOrderId,
        phase.phaseKey,
        phase.name,
        index,
        phase.estimatedHours,
        phase.sublet?.supplierServiceId || null,
        phase.sublet?.baseCost ?? null,
        phase.sublet?.feeCost ?? null,
      ]
    );
  }
}

export interface PhasePlanSourceData {
  serviceLines: PhasePlanServiceLine[];
  subletLines: PhasePlanSubletLine[];
  subletFeePercent: number;
}

// Carrega os inputs do plano da opção aprovada. Devolve null quando a opção não é
// flexível (sem linhas de serviço) — o fluxo do configurador mantém as fases padrão.
export async function loadFlexibleOptionPhasePlanData(
  client: PhaseInsertClient,
  organizationId: string,
  quoteId: string,
  optionId: string
): Promise<PhasePlanSourceData | null> {
  const { rows: serviceRows } = await client.query<Row>(
    `SELECT sl.mode, sl.hours
     FROM quote_service_lines sl
     JOIN quote_options o ON o.id = sl.quote_option_id
     JOIN quotes q ON q.id = o.quote_id
     WHERE o.id = $1 AND q.id = $2 AND q.organization_id = $3
     ORDER BY sl.sort_order`,
    [optionId, quoteId, organizationId]
  );
  if (serviceRows.length === 0) return null;

  const { rows: costRows } = await client.query<Row>(
    `SELECT cl.name, cl.total_cost, cl.deducted_hours,
            ss.id AS supplier_service_id, ss.service_name, ss.replaced_phase_key,
            ss.phase_hours, sp.name AS supplier_name
     FROM quote_cost_lines cl
     JOIN quote_options o ON o.id = cl.quote_option_id
     JOIN quotes q ON q.id = o.quote_id
     LEFT JOIN supplier_services ss ON ss.id = cl.supplier_service_id
     LEFT JOIN suppliers sp ON sp.id = ss.supplier_id
     WHERE o.id = $1 AND q.id = $2 AND q.organization_id = $3
       AND cl.line_type = 'sublet'
     ORDER BY cl.sort_order`,
    [optionId, quoteId, organizationId]
  );

  const subletFeePercent = await resolveSubletFeePercent(client, organizationId, optionId);

  return {
    serviceLines: serviceRows.map((row) => ({
      mode: row.mode === "spot" ? ("spot" as const) : ("complete" as const),
      hours: num(row.hours),
    })),
    subletLines: costRows.map((row) => ({
      lineName: String(row.name ?? ""),
      supplierServiceId: row.supplier_service_id ? String(row.supplier_service_id) : null,
      supplierName: (row.supplier_name as string) ?? null,
      serviceName: (row.service_name as string) ?? null,
      replacedPhaseKey: (row.replaced_phase_key as string) ?? null,
      phaseHours: row.phase_hours === null ? null : num(row.phase_hours),
      deductedHours: row.deducted_hours === null ? null : num(row.deducted_hours),
      totalCost: num(row.total_cost),
    })),
    subletFeePercent,
  };
}

// Taxa de gestão da aprovação: preferir o snapshot imutável da opção (a política com
// que a proposta foi calculada); sem snapshot, cair para a política ativa atual.
async function resolveSubletFeePercent(
  client: PhaseInsertClient,
  organizationId: string,
  optionId: string
): Promise<number> {
  const { rows: snapshotRows } = await client.query<Row>(
    `SELECT s.payload->'policy'->>'subletFeePercent' AS fee
     FROM quote_pricing_snapshots s
     WHERE s.quote_option_id = $1
     ORDER BY s.revision DESC
     LIMIT 1`,
    [optionId]
  );
  const fromSnapshot = snapshotRows[0]?.fee;
  if (fromSnapshot !== null && fromSnapshot !== undefined && fromSnapshot !== "") {
    const value = Number(fromSnapshot);
    if (Number.isFinite(value)) return value;
  }

  const { rows: policyRows } = await client.query<Row>(
    `SELECT sublet_fee_percent FROM pricing_policies
     WHERE organization_id = $1 AND status = 'active'
     ORDER BY version DESC LIMIT 1`,
    [organizationId]
  );
  if (policyRows.length > 0 && policyRows[0].sublet_fee_percent !== null) {
    return Number(policyRows[0].sublet_fee_percent);
  }
  return 0;
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}
