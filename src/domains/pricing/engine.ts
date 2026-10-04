import type {
  AdjustKind,
  FormulaComponent,
  FormulaComponentType,
  PricingExpenseItem,
  PricingFormulaVersion,
  PricingPolicy,
  PricingRates,
  PricingValidationError,
  QuoteCostLine,
  ServiceLine,
  SuggestionComponent,
  SuggestionResult,
  FinalFinancials,
} from "./types";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const FORMULA_LABELS: Record<FormulaComponentType, string> = {
  expense_base: "Despesas e reservas atribuídas",
  profit_objective: "Objetivo de lucro",
  spot_surcharge: "Acréscimo pontual por hora",
  fixed_amount: "Montante fixo",
  material: "Material",
  material_margin: "Acréscimo sobre material",
  percent_adjust: "Acréscimo percentual",
  consumable_kits: "Kits de consumíveis",
  sublet: "Serviços subcontratados",
  extras: "Extras",
};

const sum = (values: number[]): number =>
  values.reduce((acc, value) => acc + value, 0);

export function resolvePricingContext(input: {
  policy: PricingPolicy;
  expenseItems: PricingExpenseItem[];
}): PricingRates {
  const { policy, expenseItems } = input;
  const included = expenseItems.filter((item) => item.includedInPricing);
  const operational = sum(
    included
      .filter((item) => item.category === "operational")
      .map((item) => item.monthlyEquivalent)
  );
  const acquisition = sum(
    included
      .filter((item) => item.category === "acquisition")
      .map((item) => item.monthlyEquivalent)
  );

  const capacity = policy.dailyCapacityHours;

  if (policy.method === "monthly") {
    const days = policy.productiveDaysPerMonth;
    if (days === null || !(days > 0)) {
      throw new Error(
        "Configura o método mensal: faltam os dias produtivos."
      );
    }
    if (!(capacity > 0)) {
      throw new Error(
        "A capacidade faturável diária tem de ser superior a zero."
      );
    }

    const monthlyOperational = round2(operational);
    const monthlyCashRecovery = round2(acquisition);
    const monthlyTotal = round2(monthlyOperational + monthlyCashRecovery);
    const hourlyExpenseAggregated = monthlyTotal / (days * capacity);
    const hourlyOperational = monthlyOperational / (days * capacity);
    const hourlyCashRecovery = monthlyCashRecovery / (days * capacity);
    const dailyBaseAggregated = round2(monthlyTotal / days);
    const profitHourly = policy.profitDailyTarget / capacity;
    const completeRate = hourlyExpenseAggregated + profitHourly;

    return {
      method: policy.method,
      capacityHoursPerDay: capacity,
      productiveDays: days,
      monthlyOperational,
      monthlyCashRecovery,
      monthlyTotal,
      dailyBaseAggregated,
      hourlyExpenseAggregated,
      hourlyOperational,
      hourlyCashRecovery,
      profitHourly,
      spotSurchargePerHour: policy.spotSurchargePerHour,
      completeHourlyRate: round2(completeRate),
      spotHourlyRate: round2(completeRate + policy.spotSurchargePerHour),
      vatRate: policy.vatRate,
      subletFeePercent: policy.subletFeePercent,
      wasteRatePercent: policy.wasteRatePercent,
    };
  }

  const hourlyExpenseAggregated = policy.manualDailyExpenses / capacity;
  const profitHourly = policy.profitDailyTarget / capacity;
  const completeRate = hourlyExpenseAggregated + profitHourly;

  return {
    method: policy.method,
    capacityHoursPerDay: capacity,
    productiveDays: null,
    monthlyOperational: 0,
    monthlyCashRecovery: 0,
    monthlyTotal: 0,
    dailyBaseAggregated: round2(policy.manualDailyExpenses),
    hourlyExpenseAggregated,
    hourlyOperational: null,
    hourlyCashRecovery: null,
    profitHourly,
    spotSurchargePerHour: policy.spotSurchargePerHour,
    completeHourlyRate: round2(completeRate),
    spotHourlyRate: round2(completeRate + policy.spotSurchargePerHour),
    vatRate: policy.vatRate,
    subletFeePercent: policy.subletFeePercent,
    wasteRatePercent: policy.wasteRatePercent,
  };
}

export function validatePolicy(
  policy: PricingPolicy,
  expenseItems: PricingExpenseItem[]
): PricingValidationError[] {
  const errors: PricingValidationError[] = [];

  if (
    !(policy.dailyCapacityHours > 0) ||
    !Number.isFinite(policy.dailyCapacityHours)
  ) {
    errors.push({
      field: "dailyCapacityHours",
      message: "A capacidade faturável diária tem de ser superior a zero.",
    });
  }

  if (
    policy.profitDailyTarget < 0 ||
    !Number.isFinite(policy.profitDailyTarget)
  ) {
    errors.push({
      field: "profitDailyTarget",
      message: "O objetivo de lucro diário não pode ser negativo.",
    });
  }

  if (policy.spotSurchargePerHour < 0) {
    errors.push({
      field: "spotSurchargePerHour",
      message: "O acréscimo pontual por hora não pode ser negativo.",
    });
  }

  if (policy.manualDailyExpenses < 0) {
    errors.push({
      field: "manualDailyExpenses",
      message: "As despesas diárias manuais não podem ser negativas.",
    });
  }

  if (
    policy.method === "monthly" &&
    (policy.productiveDaysPerMonth === null ||
      policy.productiveDaysPerMonth <= 0)
  ) {
    errors.push({
      field: "productiveDaysPerMonth",
      message: "Configura o método mensal: faltam os dias produtivos.",
    });
  }

  if (policy.vatRate < 0 || policy.vatRate > 100) {
    errors.push({
      field: "vatRate",
      message: "A taxa de IVA tem de estar entre 0 e 100.",
    });
  }

  if (policy.subletFeePercent < 0 || policy.subletFeePercent > 100) {
    errors.push({
      field: "subletFeePercent",
      message: "A comissão de subcontratação tem de estar entre 0 e 100.",
    });
  }

  if (policy.wasteRatePercent < 0 || policy.wasteRatePercent > 100) {
    errors.push({
      field: "wasteRatePercent",
      message: "A taxa de desperdício tem de estar entre 0 e 100.",
    });
  }

  expenseItems.forEach((item, index) => {
    if (item.amount < 0) {
      errors.push({
        field: `expenseItems[${index}].amount`,
        message: "O montante da rubrica não pode ser negativo.",
      });
    }
    if (item.monthlyEquivalent < 0) {
      errors.push({
        field: `expenseItems[${index}].monthlyEquivalent`,
        message: "O equivalente mensal da rubrica não pode ser negativo.",
      });
    }
  });

  return errors;
}

function resolveComponentValue(
  component: FormulaComponent,
  rates: PricingRates,
  context: {
    billedHours: number;
    spotHoursBilled: number;
    materialCost: number;
    kitsCost: number;
    subletCost: number;
    subletFee: number;
    extrasCost: number;
    subtotal: number;
  }
): number {
  const params = component.params;
  switch (component.type) {
    case "expense_base": {
      const scope = params.scope ?? "aggregated";
      const rate =
        scope === "operational"
          ? rates.hourlyOperational ?? 0
          : scope === "cash_recovery"
            ? rates.hourlyCashRecovery ?? 0
            : rates.hourlyExpenseAggregated;
      return context.billedHours * rate;
    }
    case "profit_objective":
      return context.billedHours * rates.profitHourly;
    case "spot_surcharge":
      return context.spotHoursBilled * rates.spotSurchargePerHour;
    case "fixed_amount":
      return params.amount ?? 0;
    case "material":
      return context.materialCost;
    case "material_margin":
      return (context.materialCost * (params.percent ?? 0)) / 100;
    case "percent_adjust": {
      const base =
        params.base === "material" ? context.materialCost : context.subtotal;
      return (base * (params.percent ?? 0)) / 100;
    }
    case "consumable_kits":
      return context.kitsCost;
    case "sublet":
      return context.subletCost + context.subletFee;
    case "extras":
      return context.extrasCost;
    default:
      return 0;
  }
}

export function computeSuggestion(input: {
  rates: PricingRates;
  formula: PricingFormulaVersion;
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
}): SuggestionResult {
  const { rates, formula, serviceLines, costLines } = input;

  const sortedLines = [...serviceLines].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const declaredHours = round2(sum(sortedLines.map((line) => line.hours)));
  const spotDeclared = sum(
    sortedLines
      .filter((line) => line.mode === "spot")
      .map((line) => line.hours)
  );
  const completeDeclared = declaredHours - spotDeclared;

  const deductedHours = round2(
    sum(
      costLines.map((line) =>
        line.lineType === "sublet" ? line.deductedHours ?? 0 : 0
      )
    )
  );
  let remainingDeduction = Math.max(0, deductedHours);
  const completeHoursBilled = Math.max(0, completeDeclared - remainingDeduction);
  remainingDeduction -= completeDeclared - completeHoursBilled;
  const spotHoursBilled = Math.max(0, spotDeclared - remainingDeduction);
  const billedHours = completeHoursBilled + spotHoursBilled;

  const materialCost = round2(
    sum(
      costLines
        .filter((line) => line.lineType === "material")
        .map((line) =>
          round2(line.quantity * line.unitCost * (1 + line.wasteRatePercent / 100))
        )
    )
  );
  const kitsCost = round2(
    sum(
      costLines
        .filter((line) => line.lineType === "consumable_kit")
        .map((line) => line.totalCost)
    )
  );
  const subletCost = round2(
    sum(
      costLines
        .filter((line) => line.lineType === "sublet")
        .map((line) => line.totalCost)
    )
  );
  const subletFee = round2((subletCost * rates.subletFeePercent) / 100);
  const extrasCost = round2(
    sum(
      costLines
        .filter((line) => line.lineType === "extra")
        .map((line) => line.totalCost)
    )
  );
  const totalDirectCost = round2(
    materialCost + kitsCost + subletCost + extrasCost
  );

  const breakdown: SuggestionComponent[] = [];
  let subtotal = 0;
  let materialMargin = 0;
  let fixedAmounts = 0;

  for (const component of formula.components) {
    if (!component.enabled) continue;
    const value = resolveComponentValue(component, rates, {
      billedHours,
      spotHoursBilled,
      materialCost,
      kitsCost,
      subletCost,
      subletFee,
      extrasCost,
      subtotal,
    });
    subtotal += value;
    breakdown.push({
      type: component.type,
      label: component.label || FORMULA_LABELS[component.type],
      value: round2(value),
    });
    if (component.type === "material_margin") materialMargin += value;
    if (component.type === "fixed_amount") fixedAmounts += value;
  }

  return {
    suggestedPriceBeforeVat: round2(subtotal),
    breakdown,
    costSummary: {
      materialCost,
      materialMargin: round2(materialMargin),
      kitsCost,
      subletCost,
      subletFee,
      extrasCost,
      fixedAmounts: round2(fixedAmounts),
      totalDirectCost,
      declaredHours,
      deductedHours,
      billedHours: round2(billedHours),
      spotHours: round2(spotHoursBilled),
      completeHours: round2(completeHoursBilled),
    },
  };
}

export function computeFinalFinancials(input: {
  rates: PricingRates;
  formula: PricingFormulaVersion;
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  adjustKind: AdjustKind;
  adjustValue: number;
  adjustReason?: string;
}): FinalFinancials {
  const { rates, adjustKind, adjustValue } = input;
  const suggestion = computeSuggestion(input);
  const suggested = suggestion.suggestedPriceBeforeVat;

  let priceBeforeVat: number;
  switch (adjustKind) {
    case "manual_price":
      priceBeforeVat = round2(adjustValue);
      break;
    case "percent_discount":
      priceBeforeVat = round2(suggested * (1 - adjustValue / 100));
      break;
    case "euro_adjust":
      priceBeforeVat = round2(suggested + adjustValue);
      break;
    default:
      priceBeforeVat = suggested;
  }

  const vatAmount = round2((priceBeforeVat * rates.vatRate) / 100);
  const totalWithVat = round2(priceBeforeVat + vatAmount);
  const priceVsSuggested = round2(priceBeforeVat - suggested);
  const priceVsSuggestedPercent =
    suggested > 0
      ? round2((priceBeforeVat - suggested) / suggested * 100)
      : 0;

  const { costSummary } = suggestion;
  const aggregatedAttributed = round2(
    costSummary.billedHours * rates.hourlyExpenseAggregated
  );
  const operationalAttributed =
    rates.hourlyOperational !== null
      ? round2(costSummary.billedHours * rates.hourlyOperational)
      : null;
  const balanceAfterBase = round2(
    priceBeforeVat - costSummary.totalDirectCost - aggregatedAttributed
  );
  const operationalResult =
    operationalAttributed !== null
      ? round2(
          priceBeforeVat - costSummary.totalDirectCost - operationalAttributed
        )
      : null;

  return {
    suggestedPriceBeforeVat: suggested,
    priceBeforeVat,
    adjustKind,
    adjustValue,
    vatAmount,
    totalWithVat,
    priceVsSuggested,
    priceVsSuggestedPercent,
    operationalResult,
    balanceAfterBase,
    operationalAttributed,
    aggregatedAttributed,
    dataQuality: "estimated",
  };
}

export function validateQuotePricing(input: {
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  adjustKind: AdjustKind;
  adjustValue: number;
}): PricingValidationError[] {
  const { serviceLines, costLines, adjustKind, adjustValue } = input;
  const errors: PricingValidationError[] = [];

  serviceLines.forEach((line, index) => {
    if (!Number.isFinite(line.hours) || line.hours <= 0) {
      errors.push({
        field: `serviceLines[${index}].hours`,
        message: "Introduz as horas previstas para cada linha de serviço.",
      });
    }
    if (!line.name || line.name.trim() === "") {
      errors.push({
        field: `serviceLines[${index}].name`,
        message: "Indica o nome da linha de serviço.",
      });
    }
  });

  costLines.forEach((line, index) => {
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      errors.push({
        field: `costLines[${index}].quantity`,
        message: "A quantidade tem de ser superior a zero.",
      });
    }
    if (line.unitCost < 0) {
      errors.push({
        field: `costLines[${index}].unitCost`,
        message: "O custo unitário não pode ser negativo.",
      });
    }
    if (line.wasteRatePercent < 0 || line.wasteRatePercent > 100) {
      errors.push({
        field: `costLines[${index}].wasteRatePercent`,
        message: "A taxa de desperdício tem de estar entre 0 e 100.",
      });
    }
    if (line.deductedHours !== null && line.deductedHours !== undefined) {
      if (line.deductedHours < 0) {
        errors.push({
          field: `costLines[${index}].deductedHours`,
          message: "As horas deduzidas não podem ser negativas.",
        });
      }
    }
    if (line.lineType === "sublet" && !line.supplierServiceId) {
      errors.push({
        field: `costLines[${index}].supplierServiceId`,
        message: "Indica o serviço do fornecedor.",
      });
    }
    if (line.lineType === "material" && (!line.name || line.name.trim() === "")) {
      errors.push({
        field: `costLines[${index}].name`,
        message: "Indica o nome do material.",
      });
    }
  });

  if (adjustKind === "manual_price") {
    if (!Number.isFinite(adjustValue) || adjustValue <= 0) {
      errors.push({
        field: "adjustValue",
        message: "O preço final tem de ser superior a zero.",
      });
    }
  }

  if (adjustKind === "percent_discount") {
    if (adjustValue <= -100 || adjustValue > 100) {
      errors.push({
        field: "adjustValue",
        message: "O desconto tem de estar entre -100% e 100%.",
      });
    }
  }

  return errors;
}

export const DEFAULT_FORMULA_COMPONENTS: {
  complete: FormulaComponent[];
  spot: FormulaComponent[];
} = {
  complete: [
    {
      id: "c1",
      type: "expense_base",
      label: FORMULA_LABELS.expense_base,
      enabled: true,
      params: { scope: "aggregated" },
    },
    {
      id: "c2",
      type: "profit_objective",
      label: FORMULA_LABELS.profit_objective,
      enabled: true,
      params: {},
    },
    {
      id: "c3",
      type: "material",
      label: FORMULA_LABELS.material,
      enabled: true,
      params: {},
    },
    {
      id: "c4",
      type: "consumable_kits",
      label: FORMULA_LABELS.consumable_kits,
      enabled: true,
      params: {},
    },
    {
      id: "c5",
      type: "sublet",
      label: FORMULA_LABELS.sublet,
      enabled: true,
      params: {},
    },
    {
      id: "c6",
      type: "extras",
      label: FORMULA_LABELS.extras,
      enabled: true,
      params: {},
    },
  ],
  spot: [
    {
      id: "s1",
      type: "expense_base",
      label: FORMULA_LABELS.expense_base,
      enabled: true,
      params: { scope: "aggregated" },
    },
    {
      id: "s2",
      type: "profit_objective",
      label: FORMULA_LABELS.profit_objective,
      enabled: true,
      params: {},
    },
    {
      id: "s3",
      type: "spot_surcharge",
      label: FORMULA_LABELS.spot_surcharge,
      enabled: true,
      params: {},
    },
    {
      id: "s4",
      type: "material",
      label: FORMULA_LABELS.material,
      enabled: true,
      params: {},
    },
    {
      id: "s5",
      type: "consumable_kits",
      label: FORMULA_LABELS.consumable_kits,
      enabled: true,
      params: {},
    },
    {
      id: "s6",
      type: "sublet",
      label: FORMULA_LABELS.sublet,
      enabled: true,
      params: {},
    },
    {
      id: "s7",
      type: "extras",
      label: FORMULA_LABELS.extras,
      enabled: true,
      params: {},
    },
  ],
};
