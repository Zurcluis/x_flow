import { describe, it, expect } from "vitest";
import {
  round2,
  FORMULA_LABELS,
  resolvePricingContext,
  validatePolicy,
  computeSuggestion,
  computeFinalFinancials,
  validateQuotePricing,
  DEFAULT_FORMULA_COMPONENTS,
} from "@/domains/pricing/engine";
import type {
  ExpenseCategory,
  ExpenseKind,
  FormulaComponent,
  FormulaComponentType,
  PricingExpenseItem,
  PricingFormulaVersion,
  PricingPolicy,
  PricingRates,
  QuoteCostLine,
  ServiceLine,
  SuggestionComponent,
} from "@/domains/pricing/types";

const manualPolicy = (overrides: Partial<PricingPolicy> = {}): PricingPolicy => ({
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
  ...overrides,
});

const monthlyPolicy = (days: number | null = 22): PricingPolicy => ({
  ...manualPolicy(),
  method: "monthly",
  productiveDaysPerMonth: days,
});

const expenseItem = (
  index: number,
  name: string,
  category: ExpenseCategory,
  kind: ExpenseKind,
  amount: number,
  includesPersonnel = false
): PricingExpenseItem => ({
  id: `item-${index}`,
  organizationId: "org-1",
  version: 1,
  name,
  category,
  kind,
  amount,
  periodicity: "monthly",
  monthlyEquivalent: amount,
  includedInPricing: true,
  includesPersonnel,
  validationState: "estimated",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const items10 = (): PricingExpenseItem[] => [
  expenseItem(1, "Remuneração e encargos", "operational", "expense", 1328.25, true),
  expenseItem(2, "Renda do pavilhão", "operational", "expense", 630.74),
  expenseItem(3, "Água e eletricidade", "operational", "expense", 200),
  expenseItem(4, "Contabilidade", "operational", "expense", 75),
  expenseItem(5, "Telefone, internet e software", "operational", "expense", 60),
  expenseItem(6, "Seguros e saúde no trabalho", "operational", "expense", 120),
  expenseItem(7, "Manutenção e ferramentas", "operational", "reserve", 200),
  expenseItem(8, "Marketing e divulgação", "operational", "expense", 150),
  expenseItem(9, "Alimentação e pequenas despesas", "operational", "provision", 250),
  expenseItem(10, "Prestação ao Fábio", "acquisition", "cash_recovery", 833.33),
];

const ratesOf = (policy: PricingPolicy, items: PricingExpenseItem[]): PricingRates =>
  resolvePricingContext({ policy, expenseItems: items });

const manualRates = (): PricingRates => ratesOf(manualPolicy(), items10());
const monthlyRates = (): PricingRates => ratesOf(monthlyPolicy(), items10());

const formula = (
  code: "complete" | "spot",
  components: FormulaComponent[] = DEFAULT_FORMULA_COMPONENTS[code]
): PricingFormulaVersion => ({
  id: `fv-${code}`,
  organizationId: "org-1",
  formulaId: `f-${code}`,
  code,
  name: code === "complete" ? "Fórmula completa" : "Fórmula pontual",
  version: 1,
  components: [...components],
  status: "published",
  effectiveFrom: "2026-01-01",
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const withMaterialMargin = (percent: number): FormulaComponent => ({
  id: "cm-1",
  type: "material_margin",
  label: FORMULA_LABELS.material_margin,
  enabled: true,
  params: { percent },
});

const withFixedAmount = (amount: number): FormulaComponent => ({
  id: "cf-1",
  type: "fixed_amount",
  label: FORMULA_LABELS.fixed_amount,
  enabled: true,
  params: { amount },
});

const withPercentAdjust = (
  base: "material" | "service_part" | "subtotal_before_percent",
  percent: number
): FormulaComponent => ({
  id: "cp-1",
  type: "percent_adjust",
  label: FORMULA_LABELS.percent_adjust,
  enabled: true,
  params: { base, percent },
});

const service = (
  mode: ServiceLine["mode"],
  hours: number,
  sortOrder = 0,
  name = mode === "spot" ? "Serviço pontual" : "Serviço completo"
): ServiceLine => ({ name, mode, hours, sortOrder });

const materialLine = (
  quantity: number,
  unitCost: number,
  wasteRatePercent = 0,
  name = "Material"
): QuoteCostLine => ({
  lineType: "material",
  name,
  quantity,
  unit: "m2",
  unitCost,
  wasteRatePercent,
  totalCost: quantity * unitCost,
  kitId: null,
  supplierServiceId: null,
  materialId: null,
  deductedHours: null,
  sortOrder: 0,
});

const kitLine = (totalCost: number, quantity = 1): QuoteCostLine => ({
  lineType: "consumable_kit",
  name: "Kit",
  quantity,
  unit: "unit",
  unitCost: totalCost / quantity,
  wasteRatePercent: 0,
  totalCost,
  kitId: "kit-1",
  supplierServiceId: null,
  materialId: null,
  deductedHours: null,
  sortOrder: 0,
});

const subletLine = (
  totalCost: number,
  deductedHours: number | null = null,
  supplierServiceId: string | null = "svc-1"
): QuoteCostLine => ({
  lineType: "sublet",
  name: "Fornecedor",
  quantity: 1,
  unit: "unit",
  unitCost: totalCost,
  wasteRatePercent: 0,
  totalCost,
  kitId: null,
  supplierServiceId,
  materialId: null,
  deductedHours,
  sortOrder: 0,
});

const extraLine = (totalCost: number): QuoteCostLine => ({
  lineType: "extra",
  name: "Extra",
  quantity: 1,
  unit: "unit",
  unitCost: totalCost,
  wasteRatePercent: 0,
  totalCost,
  kitId: null,
  supplierServiceId: null,
  materialId: null,
  deductedHours: null,
  sortOrder: 0,
});

const suggest = (
  rates: PricingRates,
  formulaVersion: PricingFormulaVersion,
  serviceLines: ServiceLine[],
  costLines: QuoteCostLine[] = []
) => computeSuggestion({ rates, formula: formulaVersion, serviceLines, costLines });

const valueOf = (
  breakdown: SuggestionComponent[],
  type: FormulaComponentType
): number => {
  const entry = breakdown.find((component) => component.type === type);
  expect(entry).toBeDefined();
  return entry?.value ?? Number.NaN;
};

describe("round2", () => {
  it("arredonda para 2 casas com correção de epsilon", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.125)).toBe(10.13);
    expect(round2(121.5)).toBe(121.5);
    expect(round2(2)).toBe(2);
  });
});

describe("FORMULA_LABELS", () => {
  it("tem as etiquetas pt-PT dos dez tipos", () => {
    expect(FORMULA_LABELS.expense_base).toBe("Despesas e reservas atribuídas");
    expect(FORMULA_LABELS.profit_objective).toBe("Objetivo de lucro");
    expect(FORMULA_LABELS.spot_surcharge).toBe("Acréscimo pontual por hora");
    expect(FORMULA_LABELS.fixed_amount).toBe("Montante fixo");
    expect(FORMULA_LABELS.material).toBe("Material");
    expect(FORMULA_LABELS.material_margin).toBe("Acréscimo sobre material");
    expect(FORMULA_LABELS.percent_adjust).toBe("Acréscimo percentual");
    expect(FORMULA_LABELS.consumable_kits).toBe("Kits de consumíveis");
    expect(FORMULA_LABELS.sublet).toBe("Serviços subcontratados");
    expect(FORMULA_LABELS.extras).toBe("Extras");
  });
});

describe("DEFAULT_FORMULA_COMPONENTS", () => {
  it("fórmula completa tem seis componentes c1..c6", () => {
    const components = DEFAULT_FORMULA_COMPONENTS.complete;
    expect(components.map((c) => c.id)).toEqual(["c1", "c2", "c3", "c4", "c5", "c6"]);
    expect(components.map((c) => c.type)).toEqual([
      "expense_base",
      "profit_objective",
      "material",
      "consumable_kits",
      "sublet",
      "extras",
    ]);
    components.forEach((component) => {
      expect(component.enabled).toBe(true);
    });
    expect(components[0].params).toEqual({ scope: "aggregated" });
  });

  it("fórmula pontual tem sete componentes s1..s7", () => {
    const components = DEFAULT_FORMULA_COMPONENTS.spot;
    expect(components.map((c) => c.id)).toEqual(["s1", "s2", "s3", "s4", "s5", "s6", "s7"]);
    expect(components.map((c) => c.type)).toEqual([
      "expense_base",
      "profit_objective",
      "spot_surcharge",
      "material",
      "consumable_kits",
      "sublet",
      "extras",
    ]);
    components.forEach((component) => {
      expect(component.enabled).toBe(true);
    });
    expect(components[0].params).toEqual({ scope: "aggregated" });
  });
});

describe("resolvePricingContext — método manual", () => {
  it("calcula as tarifas base", () => {
    const rates = manualRates();
    expect(rates.method).toBe("manual");
    expect(rates.hourlyExpenseAggregated).toBe(21.5);
    expect(rates.profitHourly).toBe(25);
    expect(rates.completeHourlyRate).toBe(46.5);
    expect(rates.spotHourlyRate).toBe(71.5);
    expect(rates.dailyBaseAggregated).toBe(172);
    expect(rates.productiveDays).toBeNull();
    expect(rates.monthlyOperational).toBe(0);
    expect(rates.monthlyCashRecovery).toBe(0);
    expect(rates.monthlyTotal).toBe(0);
    expect(rates.hourlyOperational).toBeNull();
    expect(rates.hourlyCashRecovery).toBeNull();
  });
});

describe("12.1 — método manual", () => {
  it("Complete 8h, sem material → 372.00", () => {
    const result = suggest(manualRates(), formula("complete"), [service("complete", 8)]);
    expect(result.suggestedPriceBeforeVat).toBe(372);
  });

  it("Wrap 32h + material 400 → 1888.00", () => {
    const result = suggest(
      manualRates(),
      formula("complete"),
      [service("complete", 32, 0, "Wrap")],
      [materialLine(1, 400)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(1888);
    expect(valueOf(result.breakdown, "expense_base")).toBe(688);
    expect(valueOf(result.breakdown, "profit_objective")).toBe(800);
    expect(valueOf(result.breakdown, "material")).toBe(400);
  });

  it("PPF 40h + material 1000 → 2860.00", () => {
    const result = suggest(
      manualRates(),
      formula("complete"),
      [service("complete", 40, 0, "PPF")],
      [materialLine(1, 1000)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(2860);
  });

  it("Óticas spot 1h + material 50 → 121.50", () => {
    const result = suggest(
      manualRates(),
      formula("spot"),
      [service("spot", 1, 0, "Óticas")],
      [materialLine(1, 50)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(121.5);
    expect(valueOf(result.breakdown, "expense_base")).toBe(21.5);
    expect(valueOf(result.breakdown, "profit_objective")).toBe(25);
    expect(valueOf(result.breakdown, "spot_surcharge")).toBe(25);
    expect(valueOf(result.breakdown, "material")).toBe(50);
  });

  it("Chrome delete spot 3h + material 50 → 264.50", () => {
    const result = suggest(
      manualRates(),
      formula("spot"),
      [service("spot", 3, 0, "Chrome delete")],
      [materialLine(1, 50)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(264.5);
  });

  it("Pontual 8h sem material → 572.00", () => {
    const result = suggest(manualRates(), formula("spot"), [service("spot", 8)]);
    expect(result.suggestedPriceBeforeVat).toBe(572);
  });

  it("Misto (Cenário 6): 5h complete + 3h spot + material 80 e 50 → 577.00", () => {
    const rates = manualRates();
    const serviceLines = [service("complete", 5, 0, "Base"), service("spot", 3, 1, "Detalhe")];
    const costLines = [materialLine(1, 80), materialLine(1, 50)];
    const result = suggest(rates, formula("spot"), serviceLines, costLines);

    expect(result.suggestedPriceBeforeVat).toBe(577);
    expect(result.costSummary.billedHours).toBe(8);
    expect(valueOf(result.breakdown, "expense_base")).toBe(172);
    expect(valueOf(result.breakdown, "profit_objective")).toBe(200);
    expect(valueOf(result.breakdown, "spot_surcharge")).toBe(75);
    expect(valueOf(result.breakdown, "material")).toBe(130);

    const final = computeFinalFinancials({
      rates,
      formula: formula("spot"),
      serviceLines,
      costLines,
      adjustKind: "manual_price",
      adjustValue: 600,
    });
    expect(final.priceVsSuggested).toBe(23);
    expect(final.vatAmount).toBe(138);
    expect(final.totalWithVat).toBe(738);
    expect(final.balanceAfterBase).toBe(298);
    expect(final.operationalResult).toBeNull();
  });

  it("Material com desperdício de 15% e margem de 10%", () => {
    const rates = manualRates();
    const costLines = [materialLine(10, 20, 15)];
    const base = suggest(rates, formula("complete"), [service("complete", 1)], costLines);
    expect(base.costSummary.materialCost).toBe(230);

    const withMargin = suggest(
      rates,
      formula("complete", [...DEFAULT_FORMULA_COMPONENTS.complete, withMaterialMargin(10)]),
      [service("complete", 1)],
      costLines
    );
    expect(valueOf(withMargin.breakdown, "material_margin")).toBe(23);
    expect(withMargin.suggestedPriceBeforeVat).toBe(299.5);
  });
});

describe("12.2 — configuração dinâmica (manual)", () => {
  it("manualDailyExpenses 200 → tarifas 50.00 e 75.00", () => {
    const rates = ratesOf(manualPolicy({ manualDailyExpenses: 200 }), items10());
    expect(rates.completeHourlyRate).toBe(50);
    expect(rates.spotHourlyRate).toBe(75);
  });

  it("profitDailyTarget 240 → tarifas 51.50 e 76.50", () => {
    const rates = ratesOf(manualPolicy({ profitDailyTarget: 240 }), items10());
    expect(rates.completeHourlyRate).toBe(51.5);
    expect(rates.spotHourlyRate).toBe(76.5);
  });

  it("dailyCapacityHours 6 → tarifas 62.00 e 87.00", () => {
    const rates = ratesOf(manualPolicy({ dailyCapacityHours: 6 }), items10());
    expect(rates.completeHourlyRate).toBe(62);
    expect(rates.spotHourlyRate).toBe(87);
  });

  it("spotSurchargePerHour 30 → tarifas 46.50 e 76.50", () => {
    const rates = ratesOf(manualPolicy({ spotSurchargePerHour: 30 }), items10());
    expect(rates.completeHourlyRate).toBe(46.5);
    expect(rates.spotHourlyRate).toBe(76.5);
  });

  it("spotSurchargePerHour 0 → tarifas iguais (46.50)", () => {
    const rates = ratesOf(manualPolicy({ spotSurchargePerHour: 0 }), items10());
    expect(rates.completeHourlyRate).toBe(46.5);
    expect(rates.spotHourlyRate).toBe(rates.completeHourlyRate);
  });

  it("validatePolicy bloqueia configurações inválidas", () => {
    expect(validatePolicy(manualPolicy({ dailyCapacityHours: 0 }), items10()).some((e) => e.field === "dailyCapacityHours")).toBe(true);
    expect(validatePolicy(manualPolicy({ dailyCapacityHours: -2 }), items10()).some((e) => e.field === "dailyCapacityHours")).toBe(true);
    expect(validatePolicy(manualPolicy({ profitDailyTarget: -5 }), items10()).some((e) => e.field === "profitDailyTarget")).toBe(true);
    const semDias = monthlyPolicy(null);
    const errosSemDias = validatePolicy(semDias, items10());
    expect(errosSemDias.some((e) => e.field === "productiveDaysPerMonth")).toBe(true);
    expect(validatePolicy(manualPolicy({ vatRate: 150 }), items10()).some((e) => e.field === "vatRate")).toBe(true);
    expect(validatePolicy(manualPolicy(), items10())).toEqual([]);
  });
});

describe("12.3 — sem dupla contagem", () => {
  const pontuais = () => [
    service("spot", 1, 0),
    service("spot", 1, 1),
    service("spot", 1, 2),
    service("complete", 5, 3),
  ];

  it("3 pontuais de 1h + 1 completo de 5h → 447.00", () => {
    const rates = manualRates();
    const result = suggest(rates, formula("spot"), pontuais());
    expect(result.suggestedPriceBeforeVat).toBe(447);
    expect(valueOf(result.breakdown, "expense_base")).toBe(172);
    expect(valueOf(result.breakdown, "profit_objective")).toBe(200);
    expect(valueOf(result.breakdown, "spot_surcharge")).toBe(75);
  });

  it("Só 6h faturadas: despesas atribuídas 129.00; por recuperar 43.00", () => {
    const rates = manualRates();
    const serviceLines = [
      service("spot", 1, 0),
      service("spot", 1, 1),
      service("spot", 1, 2),
      service("complete", 3, 3),
    ];
    const final = computeFinalFinancials({
      rates,
      formula: formula("spot"),
      serviceLines,
      costLines: [],
      adjustKind: "none",
      adjustValue: 0,
    });
    expect(final.aggregatedAttributed).toBe(129);
    expect(round2(172 - final.aggregatedAttributed)).toBe(43);
  });
});

describe("12.5 — método mensal", () => {
  it("totais mensais das rubricas", () => {
    const rates = monthlyRates();
    expect(rates.monthlyOperational).toBe(3013.99);
    expect(rates.monthlyCashRecovery).toBe(833.33);
    expect(rates.monthlyTotal).toBe(3847.32);
    expect(rates.productiveDays).toBe(22);
  });

  it("22 dias e 8h: tarifas e sugestões sem arredondar a tarifa antes do cálculo", () => {
    const rates = monthlyRates();
    expect(rates.dailyBaseAggregated).toBe(174.88);
    expect(rates.hourlyExpenseAggregated).toBeCloseTo(21.8597727, 6);
    expect(rates.completeHourlyRate).toBe(46.86);
    expect(rates.spotHourlyRate).toBe(71.86);

    expect(
      suggest(monthlyRates(), formula("complete"), [service("complete", 8)]).suggestedPriceBeforeVat
    ).toBe(374.88);
    expect(
      suggest(monthlyRates(), formula("spot"), [service("spot", 8)]).suggestedPriceBeforeVat
    ).toBe(574.88);
    expect(
      suggest(monthlyRates(), formula("complete"), [service("complete", 32, 0, "Wrap")], [materialLine(1, 400)])
        .suggestedPriceBeforeVat
    ).toBe(1899.51);
  });

  it("mudar a renda para 700 → monthlyTotal 3916.58", () => {
    const items = items10();
    items[1].amount = 700;
    items[1].monthlyEquivalent = 700;
    const rates = ratesOf(monthlyPolicy(), items);
    expect(rates.monthlyTotal).toBe(3916.58);
  });

  it("excluir a prestação → monthlyTotal 3013.99 e tarifas reduzidas", () => {
    const items = items10();
    items[9].includedInPricing = false;
    const rates = ratesOf(monthlyPolicy(), items);
    expect(rates.monthlyTotal).toBe(3013.99);
    expect(rates.dailyBaseAggregated).toBe(137);
    expect(rates.completeHourlyRate).toBe(42.12);
    expect(rates.spotHourlyRate).toBe(67.12);
  });

  it("20 dias → dailyBaseAggregated 192.37 e tarifas 49.05 / 74.05", () => {
    const rates = ratesOf(monthlyPolicy(20), items10());
    expect(rates.dailyBaseAggregated).toBe(192.37);
    expect(rates.completeHourlyRate).toBe(49.05);
    expect(rates.spotHourlyRate).toBe(74.05);
  });

  it("24 dias → dailyBaseAggregated 160.31 e tarifas 45.04 / 70.04", () => {
    const rates = ratesOf(monthlyPolicy(24), items10());
    expect(rates.dailyBaseAggregated).toBe(160.31);
    expect(rates.completeHourlyRate).toBe(45.04);
    expect(rates.spotHourlyRate).toBe(70.04);
  });

  it("computeFinalFinancials mensal separa operação de aquisição", () => {
    const final = computeFinalFinancials({
      rates: monthlyRates(),
      formula: formula("complete"),
      serviceLines: [service("complete", 32, 0, "Wrap")],
      costLines: [materialLine(1, 400)],
      adjustKind: "none",
      adjustValue: 0,
    });
    expect(final.priceBeforeVat).toBe(1899.51);
    expect(final.operationalAttributed).toBe(548);
    expect(final.aggregatedAttributed).toBe(699.51);
    expect(final.balanceAfterBase).toBe(800);
    expect(final.operationalResult).toBe(951.51);
    expect(final.dataQuality).toBe("estimated");
  });

  it("resolvePricingContext mensal exige dias e capacidade", () => {
    expect(() => ratesOf(monthlyPolicy(null), items10())).toThrow(
      "Configura o método mensal: faltam os dias produtivos."
    );
    expect(() => ratesOf(monthlyPolicy(22), items10())).not.toThrow();
    expect(() =>
      ratesOf({ ...monthlyPolicy(22), dailyCapacityHours: 0 }, items10())
    ).toThrow("A capacidade faturável diária tem de ser superior a zero.");
  });
});

describe("Kits de consumíveis", () => {
  it("Wrap 32h manual + kit 40 → 1928.00", () => {
    const result = suggest(
      manualRates(),
      formula("complete"),
      [service("complete", 32, 0, "Wrap")],
      [materialLine(1, 400), kitLine(40)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(1928);
    expect(result.costSummary.kitsCost).toBe(40);
  });

  it("Óticas 1h + kit spot 8 → 129.50", () => {
    const result = suggest(
      manualRates(),
      formula("spot"),
      [service("spot", 1, 0, "Óticas")],
      [materialLine(1, 50), kitLine(8)]
    );
    expect(result.suggestedPriceBeforeVat).toBe(129.5);
  });
});

describe("Sublet — regras 1 e 2", () => {
  it("Sublet 120 com 3h deduzidas em 8h completas", () => {
    const rates = manualRates();
    const result = suggest(rates, formula("complete"), [service("complete", 8)], [subletLine(120, 3)]);
    expect(result.costSummary.billedHours).toBe(5);
    expect(result.costSummary.subletCost).toBe(120);
    expect(result.costSummary.subletFee).toBe(18);
    expect(valueOf(result.breakdown, "sublet")).toBe(138);
    expect(result.suggestedPriceBeforeVat).toBe(370.5);
  });

  it("Dedução maior que as horas é permitida", () => {
    const rates = manualRates();
    const serviceLines = [service("complete", 8)];
    const costLines = [subletLine(120, 10)];
    const result = suggest(rates, formula("complete"), serviceLines, costLines);
    expect(result.costSummary.billedHours).toBe(0);
    expect(result.suggestedPriceBeforeVat).toBe(138);
    expect(validateQuotePricing({
      serviceLines,
      costLines,
      adjustKind: "none",
      adjustValue: 0,
    })).toEqual([]);
  });
});

describe("Ajustes manuais e IVA", () => {
  const oticas = () => ({
    rates: manualRates(),
    formulaVersion: formula("spot"),
    serviceLines: [service("spot", 1, 0, "Óticas")],
    costLines: [materialLine(1, 50)],
  });

  it("preço manual 180 sobre sugestão 121.50", () => {
    const { rates, formulaVersion, serviceLines, costLines } = oticas();
    const final = computeFinalFinancials({
      rates,
      formula: formulaVersion,
      serviceLines,
      costLines,
      adjustKind: "manual_price",
      adjustValue: 180,
    });
    expect(final.suggestedPriceBeforeVat).toBe(121.5);
    expect(final.priceVsSuggested).toBe(58.5);
    expect(final.priceVsSuggestedPercent).toBe(48.15);
    expect(final.vatAmount).toBe(41.4);
    expect(final.totalWithVat).toBe(221.4);
  });

  it("desconto de 10% sobre 121.50", () => {
    const { rates, formulaVersion, serviceLines, costLines } = oticas();
    const final = computeFinalFinancials({
      rates,
      formula: formulaVersion,
      serviceLines,
      costLines,
      adjustKind: "percent_discount",
      adjustValue: 10,
    });
    expect(final.priceBeforeVat).toBe(109.35);
    expect(final.vatAmount).toBe(25.15);
    expect(final.totalWithVat).toBe(134.5);
  });

  it("ajuste em euros de −20 sobre 264.50", () => {
    const final = computeFinalFinancials({
      rates: manualRates(),
      formula: formula("spot"),
      serviceLines: [service("spot", 3, 0, "Chrome delete")],
      costLines: [materialLine(1, 50)],
      adjustKind: "euro_adjust",
      adjustValue: -20,
    });
    expect(final.priceBeforeVat).toBe(244.5);
  });

  it("preço manual preservado entre sugestão e final", () => {
    const { rates, formulaVersion, serviceLines, costLines } = oticas();
    const suggestion = suggest(rates, formulaVersion, serviceLines, costLines);
    const repeat = suggest(rates, formulaVersion, serviceLines, costLines);
    expect(repeat).toEqual(suggestion);
    const final = computeFinalFinancials({
      rates,
      formula: formulaVersion,
      serviceLines,
      costLines,
      adjustKind: "manual_price",
      adjustValue: 180,
    });
    expect(final.suggestedPriceBeforeVat).toBe(121.5);
    expect(final.priceBeforeVat).toBe(180);
  });
});

describe("validações do orçamento", () => {
  const validInput = () => ({
    serviceLines: [service("complete", 8)],
    costLines: [] as QuoteCostLine[],
    adjustKind: "none" as const,
    adjustValue: 0,
  });

  it("horas 0 ou negativas → erro", () => {
    expect(validateQuotePricing({
      ...validInput(),
      serviceLines: [service("complete", 0)],
    }).some((e) => e.field === "serviceLines[0].hours")).toBe(true);
    expect(validateQuotePricing({
      ...validInput(),
      serviceLines: [service("complete", -1)],
    }).some((e) => e.field === "serviceLines[0].hours")).toBe(true);
  });

  it("material sem nome → erro", () => {
    const errors = validateQuotePricing({
      ...validInput(),
      costLines: [materialLine(1, 100, 0, "")],
    });
    expect(errors.some((e) => e.field === "costLines[0].name")).toBe(true);
  });

  it("sublet sem supplierServiceId → erro", () => {
    const errors = validateQuotePricing({
      ...validInput(),
      costLines: [subletLine(120, null, null)],
    });
    expect(errors.some((e) => e.field === "costLines[0].supplierServiceId")).toBe(true);
  });

  it("manual_price 0 → 'O preço final tem de ser superior a zero.'", () => {
    const errors = validateQuotePricing({ ...validInput(), adjustKind: "manual_price", adjustValue: 0 });
    expect(errors).toContainEqual({
      field: "adjustValue",
      message: "O preço final tem de ser superior a zero.",
    });
  });

  it("percent_discount 150 → erro", () => {
    const errors = validateQuotePricing({ ...validInput(), adjustKind: "percent_discount", adjustValue: 150 });
    expect(errors.some((e) => e.field === "adjustValue")).toBe(true);
  });

  it("deductedHours negativos → erro", () => {
    const errors = validateQuotePricing({
      ...validInput(),
      costLines: [subletLine(120, -2)],
    });
    expect(errors.some((e) => e.field === "costLines[0].deductedHours")).toBe(true);
  });

  it("entrada válida não produz erros e mensagens são em pt-PT", () => {
    expect(validateQuotePricing(validInput())).toEqual([]);
    const errors = validateQuotePricing({
      ...validInput(),
      serviceLines: [service("complete", 0)],
    });
    errors.forEach((error) => {
      expect(error.message.length).toBeGreaterThan(0);
      expect(error.message).toMatch(/[a-zãáâêéíóôõúç]/i);
    });
  });

  it("rubricas com montantes negativos são bloqueadas", () => {
    const items = items10();
    items[0].amount = -5;
    items[1].monthlyEquivalent = -3;
    const errors = validatePolicy(manualPolicy(), items);
    expect(errors).toContainEqual({
      field: "expenseItems[0].amount",
      message: "O montante da rubrica não pode ser negativo.",
    });
    expect(errors).toContainEqual({
      field: "expenseItems[1].monthlyEquivalent",
      message: "O equivalente mensal da rubrica não pode ser negativo.",
    });
  });

  it("percentuais de política fora do intervalo são bloqueados", () => {
    const errors = validatePolicy(
      manualPolicy({ subletFeePercent: 101, wasteRatePercent: -1 }),
      items10()
    );
    expect(errors.some((e) => e.field === "subletFeePercent")).toBe(true);
    expect(errors.some((e) => e.field === "wasteRatePercent")).toBe(true);
  });
});

describe("componentes avulsos", () => {
  it("fixed_amount soma o montante fixo", () => {
    const result = suggest(
      manualRates(),
      formula("complete", [...DEFAULT_FORMULA_COMPONENTS.complete, withFixedAmount(100)]),
      [service("complete", 8)]
    );
    expect(valueOf(result.breakdown, "fixed_amount")).toBe(100);
    expect(result.suggestedPriceBeforeVat).toBe(472);
    expect(result.costSummary.fixedAmounts).toBe(100);
  });

  it("percent_adjust com base material e com base subtotal", () => {
    const serviceLines = [service("complete", 8)];
    const costLines = [materialLine(1, 400)];
    const onMaterial = suggest(
      manualRates(),
      formula("complete", [...DEFAULT_FORMULA_COMPONENTS.complete, withPercentAdjust("material", 50)]),
      serviceLines,
      costLines
    );
    expect(valueOf(onMaterial.breakdown, "percent_adjust")).toBe(200);
    expect(onMaterial.suggestedPriceBeforeVat).toBe(972);

    const onSubtotal = suggest(
      manualRates(),
      formula("complete", [...DEFAULT_FORMULA_COMPONENTS.complete, withPercentAdjust("subtotal_before_percent", 10)]),
      serviceLines,
      costLines
    );
    expect(valueOf(onSubtotal.breakdown, "percent_adjust")).toBe(77.2);
    expect(onSubtotal.suggestedPriceBeforeVat).toBe(849.2);
  });

  it("extras entram como custo direto", () => {
    const result = suggest(
      manualRates(),
      formula("complete"),
      [service("complete", 8)],
      [extraLine(30)]
    );
    expect(valueOf(result.breakdown, "extras")).toBe(30);
    expect(result.costSummary.extrasCost).toBe(30);
    expect(result.costSummary.totalDirectCost).toBe(30);
    expect(result.suggestedPriceBeforeVat).toBe(402);
  });

  it("expense_base com scope operational e cash_recovery no método mensal", () => {
    const rates = monthlyRates();
    const operational = formula("complete", [
      { id: "c1", type: "expense_base", label: FORMULA_LABELS.expense_base, enabled: true, params: { scope: "operational" } },
      { id: "c2", type: "profit_objective", label: FORMULA_LABELS.profit_objective, enabled: true, params: {} },
    ]);
    const resultOperational = suggest(rates, operational, [service("complete", 8)]);
    expect(valueOf(resultOperational.breakdown, "expense_base")).toBe(137);
    expect(resultOperational.suggestedPriceBeforeVat).toBe(337);

    const cashRecovery = formula("complete", [
      { id: "c1", type: "expense_base", label: FORMULA_LABELS.expense_base, enabled: true, params: { scope: "cash_recovery" } },
      { id: "c2", type: "profit_objective", label: FORMULA_LABELS.profit_objective, enabled: true, params: {} },
    ]);
    const resultCash = suggest(rates, cashRecovery, [service("complete", 8)]);
    expect(valueOf(resultCash.breakdown, "expense_base")).toBe(37.88);
    expect(resultCash.suggestedPriceBeforeVat).toBe(237.88);
  });

  it("expense_base com scope operational no método manual contribui zero", () => {
    const manualScoped = formula("complete", [
      { id: "c1", type: "expense_base", label: FORMULA_LABELS.expense_base, enabled: true, params: { scope: "operational" } },
      { id: "c2", type: "profit_objective", label: FORMULA_LABELS.profit_objective, enabled: true, params: {} },
    ]);
    const result = suggest(manualRates(), manualScoped, [service("complete", 8)]);
    expect(valueOf(result.breakdown, "expense_base")).toBe(0);
    expect(result.suggestedPriceBeforeVat).toBe(200);
  });

  it("componentes desativados não entram na fórmula", () => {
    const disabled = formula("complete", [
      ...DEFAULT_FORMULA_COMPONENTS.complete.filter((c) => c.type !== "material"),
      { ...DEFAULT_FORMULA_COMPONENTS.complete[2], enabled: false },
    ]);
    const result = suggest(manualRates(), disabled, [service("complete", 8)], [materialLine(1, 400)]);
    expect(result.breakdown.find((c) => c.type === "material")).toBeUndefined();
    expect(result.suggestedPriceBeforeVat).toBe(372);
  });
});

describe("imutabilidade e idempotência do cálculo", () => {
  const setup = () => ({
    rates: manualRates(),
    formulaVersion: formula("spot"),
    serviceLines: [service("complete", 5), service("spot", 3)],
    costLines: [materialLine(1, 80), materialLine(1, 50)],
  });

  it("recalcular duas vezes dá os mesmos valores", () => {
    const { rates, formulaVersion, serviceLines, costLines } = setup();
    expect(suggest(rates, formulaVersion, serviceLines, costLines)).toEqual(
      suggest(rates, formulaVersion, serviceLines, costLines)
    );
  });

  it("alterar rates depois não afeta um resultado já obtido", () => {
    const { rates, formulaVersion, serviceLines, costLines } = setup();
    const before = suggest(rates, formulaVersion, serviceLines, costLines);
    rates.hourlyExpenseAggregated = 999;
    rates.profitHourly = 999;
    const after = suggest(rates, formulaVersion, serviceLines, costLines);
    expect(before.suggestedPriceBeforeVat).toBe(577);
    expect(after.suggestedPriceBeforeVat).not.toBe(577);
  });
});
