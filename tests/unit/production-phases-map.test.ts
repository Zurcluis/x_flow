import { describe, it, expect } from "vitest";
import {
  buildPhasePlan,
  computeBilledHours,
  normalizePhaseKey,
  STANDARD_INTERNAL_PHASES,
  SUBLET_PHASE_KEY,
} from "@/server/production-phases-map";
import type {
  PhasePlanInput,
  PhasePlanSubletLine,
} from "@/server/production-phases-map";
import type {
  QuoteCostLine,
  ServiceLine,
  PricingFormulaVersion,
  PricingRates,
} from "@/domains/pricing/types";
import { computeSuggestion, resolvePricingContext } from "@/domains/pricing/engine";
import type { PricingPolicy } from "@/domains/pricing/types";

const serviceLine = (mode: "complete" | "spot", hours: number) => ({ mode, hours });

const subletLine = (overrides: Partial<PhasePlanSubletLine> = {}): PhasePlanSubletLine => ({
  lineName: "Fornecedor X · Desmontagem de para-choques",
  supplierServiceId: "ss-1",
  supplierName: "Fornecedor X",
  serviceName: "Desmontagem de para-choques",
  replacedPhaseKey: "disassembly",
  phaseHours: null,
  deductedHours: 2.5,
  totalCost: 120,
  ...overrides,
});

const planInput = (overrides: Partial<PhasePlanInput> = {}): PhasePlanInput => ({
  serviceLines: [serviceLine("complete", 10)],
  subletLines: [],
  subletFeePercent: 15,
  ...overrides,
});

const internalPhases = (phases: ReturnType<typeof buildPhasePlan>["phases"]) =>
  phases.filter((phase) => phase.source === "internal");

describe("normalizePhaseKey", () => {
  it("mapeia chaves canónicas e variantes com espaços/hífens", () => {
    expect(normalizePhaseKey("disassembly")).toBe("disassembly");
    expect(normalizePhaseKey("film_cutting")).toBe("film_cutting");
    expect(normalizePhaseKey("prep-decontamination")).toBe("prep_decontamination");
    expect(normalizePhaseKey("Quality Control")).toBe("quality_control");
  });

  it("mapeia aliases em português e acentos", () => {
    expect(normalizePhaseKey("Desassembly")).toBe("disassembly");
    expect(normalizePhaseKey("desassembly")).toBe("disassembly");
    expect(normalizePhaseKey("Desmontagem")).toBe("disassembly");
    expect(normalizePhaseKey("Aplicação")).toBe("application");
    expect(normalizePhaseKey("Corte de Filme")).toBe("film_cutting");
    expect(normalizePhaseKey("Cura térmica")).toBe("thermal_cure");
    expect(normalizePhaseKey("QC")).toBe("quality_control");
    expect(normalizePhaseKey("Controlo de Qualidade")).toBe("quality_control");
    expect(normalizePhaseKey("Acabamento")).toBe("detailing_finish");
  });

  it("devolve null para texto livre, vazio ou indefinido", () => {
    expect(normalizePhaseKey("wheel_refurb")).toBeNull();
    expect(normalizePhaseKey("")).toBeNull();
    expect(normalizePhaseKey(null)).toBeNull();
    expect(normalizePhaseKey(undefined)).toBeNull();
  });
});

describe("buildPhasePlan — sem subcontratações", () => {
  it("cria as 8 fases internas com horas proporcionais às da opção aprovada", () => {
    const plan = buildPhasePlan(planInput({ serviceLines: [serviceLine("complete", 8)] }));
    expect(plan.phases.length).toBe(8);
    expect(plan.phases.every((phase) => phase.source === "internal")).toBe(true);
    expect(plan.phases.every((phase) => phase.sublet === null)).toBe(true);
    expect(plan.replacedInternalPhaseKeys).toEqual([]);
    expect(plan.internalPlannedHours).toBe(8);
    const total = plan.phases.reduce((acc, phase) => acc + phase.estimatedHours, 0);
    expect(Math.abs(total - 8) < 0.005).toBe(true);
    const application = plan.phases.find((phase) => phase.phaseKey === "application");
    expect(application?.estimatedHours).toBe(4.36);
    expect(plan.phases[plan.phases.length - 1].phaseKey).toBe("quality_control");
  });

  it("horas deduzidas consomem primeiro as completas e depois as pontuais (espelho do motor)", () => {
    const input = planInput({
      serviceLines: [serviceLine("complete", 5), serviceLine("spot", 3)],
      subletLines: [subletLine({ deductedHours: 4, replacedPhaseKey: null })],
    });
    expect(computeBilledHours(input.serviceLines, input.subletLines)).toBe(4);
    const plan = buildPhasePlan(input);
    expect(plan.internalPlannedHours).toBe(4);
    expect(internalPhases(plan.phases).length).toBe(8);
  });

  it("dedução maior que as horas declaradas deixa as fases internas a zero horas", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 3)],
        subletLines: [subletLine({ deductedHours: 5, phaseHours: 5 })],
      })
    );
    expect(plan.internalPlannedHours).toBe(0);
    for (const phase of internalPhases(plan.phases)) {
      expect(phase.estimatedHours).toBe(0);
    }
    const subletPhase = plan.phases.find((phase) => phase.source === "sublet");
    expect(subletPhase?.estimatedHours).toBe(5);
  });
});

describe("buildPhasePlan — subcontratação substitui fase interna", () => {
  it("remove a fase interna e cria a fase de subcontratação no mesmo lugar, com custo real", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [
          subletLine({
            replacedPhaseKey: "desassembly",
            phaseHours: 3,
            deductedHours: 2.5,
            totalCost: 120,
          }),
        ],
      })
    );
    expect(plan.replacedInternalPhaseKeys).toEqual(["disassembly"]);
    expect(plan.phases.some((phase) => phase.phaseKey === "disassembly")).toBe(false);

    const subletPhase = plan.phases[1];
    expect(subletPhase.phaseKey).toBe(SUBLET_PHASE_KEY);
    expect(subletPhase.source).toBe("sublet");
    expect(subletPhase.estimatedHours).toBe(3);
    expect(subletPhase.sublet?.baseCost).toBe(120);
    expect(subletPhase.sublet?.feeCost).toBe(18);
    expect(subletPhase.sublet?.totalCost).toBe(138);
    expect(subletPhase.sublet?.supplierServiceId).toBe("ss-1");
    expect(subletPhase.name).toContain("Desmontagem de para-choques");
    expect(subletPhase.name).toContain("Fornecedor X");

    expect(plan.internalPlannedHours).toBe(7.5);
    expect(plan.subletBaseCost).toBe(120);
    expect(plan.subletFeeCost).toBe(18);
    expect(plan.subletRealCost).toBe(138);
    expect(plan.phases[plan.phases.length - 1].phaseKey).toBe("quality_control");
  });

  it("custo real soma base e taxa de gestão de todas as linhas", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [
          subletLine({ totalCost: 120, supplierServiceId: "ss-1" }),
          subletLine({ totalCost: 100, supplierServiceId: "ss-2", replacedPhaseKey: null }),
        ],
      })
    );
    expect(plan.subletBaseCost).toBe(220);
    expect(plan.subletFeeCost).toBe(33);
    expect(plan.subletRealCost).toBe(253);
  });

  it("duas subcontratações da mesma fase interna: fase interna removida uma vez", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [
          subletLine({ serviceName: "Desmontagem dianteira", phaseHours: 3, deductedHours: 2.5, totalCost: 120 }),
          subletLine({ serviceName: "Desmontagem traseira", phaseHours: null, deductedHours: 2, totalCost: 100 }),
        ],
      })
    );
    expect(plan.replacedInternalPhaseKeys).toEqual(["disassembly"]);
    const subletPhases = plan.phases.filter((phase) => phase.source === "sublet");
    expect(subletPhases.length).toBe(2);
    expect(subletPhases[0].estimatedHours).toBe(3);
    expect(subletPhases[1].estimatedHours).toBe(2);
    expect(subletPhases[0].name).toContain("Desmontagem dianteira");
    expect(subletPhases[1].name).toContain("Desmontagem traseira");
    expect(plan.internalPlannedHours).toBe(5.5);
  });

  it("prioriza phase_hours do serviço do fornecedor sobre horas deduzidas da linha", () => {
    const plan = buildPhasePlan(
      planInput({
        subletLines: [subletLine({ phaseHours: 3, deductedHours: 5, replacedPhaseKey: null })],
        serviceLines: [serviceLine("complete", 5)],
      })
    );
    expect(plan.phases.find((phase) => phase.source === "sublet")?.estimatedHours).toBe(3);
  });

  it("sem phase_hours usa as horas deduzidas; sem ambas fica a zero", () => {
    const fallback = buildPhasePlan(
      planInput({
        subletLines: [subletLine({ phaseHours: null, deductedHours: 5, replacedPhaseKey: null })],
        serviceLines: [serviceLine("complete", 5)],
      })
    );
    expect(fallback.phases.find((phase) => phase.source === "sublet")?.estimatedHours).toBe(5);

    const zero = buildPhasePlan(
      planInput({
        subletLines: [subletLine({ phaseHours: null, deductedHours: null, replacedPhaseKey: null })],
        serviceLines: [serviceLine("complete", 5)],
      })
    );
    expect(zero.phases.find((phase) => phase.source === "sublet")?.estimatedHours).toBe(0);
  });
});

describe("buildPhasePlan — subcontratação sem fase interna mapeada", () => {
  it("mantém as 8 fases internas e coloca a fase de subcontratação antes do QC", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [subletLine({ replacedPhaseKey: "wheel_refurb" })],
      })
    );
    expect(plan.replacedInternalPhaseKeys).toEqual([]);
    expect(plan.phases.length).toBe(9);
    expect(plan.phases[7].source).toBe("sublet");
    expect(plan.phases[7].phaseKey).toBe(SUBLET_PHASE_KEY);
    expect(plan.phases[8].phaseKey).toBe("quality_control");
  });

  it("replaced_phase_key nulo comporta-se como chave desconhecida", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [subletLine({ replacedPhaseKey: null })],
      })
    );
    expect(plan.replacedInternalPhaseKeys).toEqual([]);
    expect(plan.phases.length).toBe(9);
    expect(plan.phases[8].phaseKey).toBe("quality_control");
  });

  it("com o QC substituído, o passo final continua no fim", () => {
    const plan = buildPhasePlan(
      planInput({
        serviceLines: [serviceLine("complete", 10)],
        subletLines: [
          subletLine({ replacedPhaseKey: "quality_control", serviceName: "QC externo" }),
          subletLine({ replacedPhaseKey: null, serviceName: "Polimento externo" }),
        ],
      })
    );
    expect(plan.replacedInternalPhaseKeys).toEqual(["quality_control"]);
    const last = plan.phases[plan.phases.length - 1];
    expect(last.source).toBe("sublet");
    expect(last.sublet?.serviceName).toBe("QC externo");
    const beforeLast = plan.phases[plan.phases.length - 2];
    expect(beforeLast.sublet?.serviceName).toBe("Polimento externo");
    expect(plan.phases.some((phase) => phase.phaseKey === "quality_control")).toBe(false);
  });
});

describe("buildPhasePlan — taxas e arredondamento", () => {
  it("taxa de gestão limitada a 0-100", () => {
    const above = buildPhasePlan(
      planInput({ subletFeePercent: 150, subletLines: [subletLine({ totalCost: 120, replacedPhaseKey: null })] })
    );
    expect(above.subletFeeCost).toBe(120);

    const below = buildPhasePlan(
      planInput({ subletFeePercent: -10, subletLines: [subletLine({ totalCost: 120, replacedPhaseKey: null })] })
    );
    expect(below.subletFeeCost).toBe(0);
  });

  it("custos negativos são truncados a zero", () => {
    const plan = buildPhasePlan(
      planInput({ subletLines: [subletLine({ totalCost: -50, replacedPhaseKey: null })] })
    );
    expect(plan.subletRealCost).toBe(0);
  });

  it("distribuição proporcional não perde cêntimos com horas não inteiras", () => {
    const plan = buildPhasePlan(planInput({ serviceLines: [serviceLine("complete", 7.33)] }));
    const total = plan.phases.reduce((acc, phase) => acc + phase.estimatedHours, 0);
    expect(Math.abs(total - 7.33) < 0.005).toBe(true);
    expect(plan.internalPlannedHours).toBe(7.33);
  });

  it("nome da fase de subcontratação respeita o limite de 100 caracteres", () => {
    const plan = buildPhasePlan(
      planInput({
        subletLines: [
          subletLine({
            replacedPhaseKey: null,
            serviceName: "Desmontagem completa do interior, banco dianteiro, teto e alcatifas com tratamento",
            supplierName: "Fornecedor Internacional de Serviços de Recuperação Automóvel do Norte",
          }),
        ],
      })
    );
    const name = plan.phases.find((phase) => phase.source === "sublet")?.name ?? "";
    expect(name.length).toBeLessThanOrEqual(100);
    expect(name.startsWith("Subcontratação — ")).toBe(true);
  });

  it("sem nome de serviço usa o nome da linha", () => {
    const plan = buildPhasePlan(
      planInput({
        subletLines: [
          subletLine({ replacedPhaseKey: null, serviceName: null, supplierName: null, lineName: "Troca de vidro" }),
        ],
      })
    );
    const name = plan.phases.find((phase) => phase.source === "sublet")?.name ?? "";
    expect(name).toContain("Troca de vidro");
  });
});

describe("integração com o motor de preços", () => {
  const policy: PricingPolicy = {
    id: "policy-1",
    organizationId: "org-1",
    version: 1,
    method: "manual",
    manualDailyExpenses: 172,
    dailyCapacityHours: 8,
    profitDailyTarget: 200,
    spotSurchargePerHour: 25,
    productiveDaysPerMonth: null,
    subletFeePercent: 15,
    wasteRatePercent: 15,
    vatRate: 23,
    status: "active",
    effectiveFrom: "2026-01-01",
    publishedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const rates: PricingRates = resolvePricingContext({ policy, expenseItems: [] });

  const formula: PricingFormulaVersion = {
    id: "formula-1",
    organizationId: "org-1",
    formulaId: "formula-1",
    code: "complete",
    name: "Serviço completo",
    version: 1,
    components: [
      { id: "c1", type: "sublet", label: "Serviços subcontratados", enabled: true, params: {} },
    ],
    status: "published",
    effectiveFrom: "2026-01-01",
    publishedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const engineSubletLine = (totalCost: number, deductedHours: number | null): QuoteCostLine => ({
    lineType: "sublet",
    name: "Fornecedor X · Desmontagem",
    quantity: 1,
    unit: "unit",
    unitCost: totalCost,
    wasteRatePercent: 0,
    totalCost,
    supplierServiceId: "ss-1",
    deductedHours,
    notes: null,
    sortOrder: 0,
  });

  it("horas internas planeadas e custo real coincidem com o motor de preços", () => {
    const serviceLines: ServiceLine[] = [
      { name: "Wrap completo", mode: "complete", hours: 5, sortOrder: 0 },
      { name: "Retrovisores", mode: "spot", hours: 3, sortOrder: 1 },
    ];
    const engineLines = [engineSubletLine(120, 4)];
    const suggestion = computeSuggestion({ rates, formula, serviceLines, costLines: engineLines });

    const plan = buildPhasePlan({
      serviceLines: [
        { mode: "complete", hours: 5 },
        { mode: "spot", hours: 3 },
      ],
      subletLines: [subletLine({ totalCost: 120, deductedHours: 4 })],
      subletFeePercent: 15,
    });

    expect(plan.internalPlannedHours).toBe(suggestion.costSummary.billedHours);
    expect(plan.subletBaseCost).toBe(suggestion.costSummary.subletCost);
    expect(plan.subletFeeCost).toBe(suggestion.costSummary.subletFee);
    const engineSubletValue = suggestion.breakdown.find((item) => item.type === "sublet");
    expect(engineSubletValue?.value).toBe(plan.subletRealCost);
  });
});

describe("definições das fases padrão", () => {
  it("8 fases técnicas com pesos que somam 33 horas e o QC no fim", () => {
    expect(STANDARD_INTERNAL_PHASES.length).toBe(8);
    const totalWeight = STANDARD_INTERNAL_PHASES.reduce((acc, phase) => acc + phase.weight, 0);
    expect(Math.abs(totalWeight - 33) < 0.005).toBe(true);
    expect(STANDARD_INTERNAL_PHASES[STANDARD_INTERNAL_PHASES.length - 1].key).toBe("quality_control");
  });
});
