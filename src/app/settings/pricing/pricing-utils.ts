import type {
  FormulaCode,
  FormulaComponent,
  FormulaComponentParams,
  FormulaComponentType,
  PricingExpenseItem,
  PricingPolicy,
  PricingMethod,
  PricingRates,
  PricingFormulaVersion,
  SupplierService,
} from "@/domains/pricing/types";
import { round2, resolvePricingContext } from "@/domains/pricing/engine";
import { formatCurrency } from "@/lib/formatting";

export interface PolicyForm {
  method: PricingMethod;
  manualDailyExpenses: number;
  dailyCapacityHours: number;
  profitDailyTarget: number;
  spotSurchargePerHour: number;
  productiveDaysPerMonth: number | null;
  subletFeePercent: number;
  wasteRatePercent: number;
  vatRate: number;
  effectiveFrom: string;
}

export const DEFAULT_POLICY_FORM: PolicyForm = {
  method: "manual",
  manualDailyExpenses: 172,
  dailyCapacityHours: 8,
  profitDailyTarget: 200,
  spotSurchargePerHour: 25,
  productiveDaysPerMonth: null,
  subletFeePercent: 15,
  wasteRatePercent: 15,
  vatRate: 23,
  effectiveFrom: "",
};

export function policyFormFromPolicy(policy: PricingPolicy): PolicyForm {
  return {
    method: policy.method,
    manualDailyExpenses: policy.manualDailyExpenses,
    dailyCapacityHours: policy.dailyCapacityHours,
    profitDailyTarget: policy.profitDailyTarget,
    spotSurchargePerHour: policy.spotSurchargePerHour,
    productiveDaysPerMonth: policy.productiveDaysPerMonth,
    subletFeePercent: policy.subletFeePercent,
    wasteRatePercent: policy.wasteRatePercent,
    vatRate: policy.vatRate,
    effectiveFrom: policy.effectiveFrom,
  };
}

export function buildFormPolicy(form: PolicyForm): PricingPolicy {
  return {
    id: "form-draft",
    organizationId: "",
    version: 0,
    method: form.method,
    manualDailyExpenses: form.manualDailyExpenses,
    dailyCapacityHours: form.dailyCapacityHours,
    profitDailyTarget: form.profitDailyTarget,
    spotSurchargePerHour: form.spotSurchargePerHour,
    productiveDaysPerMonth:
      form.method === "monthly" ? form.productiveDaysPerMonth : null,
    subletFeePercent: form.subletFeePercent,
    wasteRatePercent: form.wasteRatePercent,
    vatRate: form.vatRate,
    status: "draft",
    effectiveFrom: form.effectiveFrom,
    publishedAt: null,
    createdAt: "",
  };
}

export function tryResolveRates(
  policy: PricingPolicy | null,
  items: PricingExpenseItem[]
): PricingRates | null {
  if (!policy) return null;
  try {
    return resolvePricingContext({ policy, expenseItems: items });
  } catch {
    return null;
  }
}

export function expenseTotals(items: PricingExpenseItem[]): {
  operational: number;
  acquisition: number;
  total: number;
} {
  const included = items.filter((item) => item.includedInPricing);
  const operational = round2(
    included
      .filter((item) => item.category === "operational")
      .reduce((acc, item) => acc + item.monthlyEquivalent, 0)
  );
  const acquisition = round2(
    included
      .filter((item) => item.category === "acquisition")
      .reduce((acc, item) => acc + item.monthlyEquivalent, 0)
  );
  return {
    operational,
    acquisition,
    total: round2(operational + acquisition),
  };
}

export function cloneComponents(
  components: FormulaComponent[]
): FormulaComponent[] {
  return components.map((component) => ({
    ...component,
    params: { ...component.params },
  }));
}

export function defaultParamsFor(
  type: FormulaComponentType
): FormulaComponentParams {
  switch (type) {
    case "fixed_amount":
      return { amount: 0 };
    case "material_margin":
      return { percent: 0 };
    case "percent_adjust":
      return { percent: 0, base: "subtotal_before_percent" };
    case "expense_base":
      return { scope: "aggregated" };
    default:
      return {};
  }
}

export function toFormulaVersion(
  code: FormulaCode,
  components: FormulaComponent[]
): PricingFormulaVersion {
  return {
    id: "",
    organizationId: "",
    formulaId: "",
    code,
    name: "",
    description: null,
    version: 0,
    components,
    status: "draft",
    effectiveFrom: "",
    publishedAt: null,
    createdAt: "",
  };
}

export function formatRate(value: number, unit: "/h" | "/dia"): string {
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} €${unit}`;
}

export function formatSignedCurrency(value: number): string {
  if (Math.abs(value) < 0.005) return formatCurrency(0);
  return value > 0
    ? `+${formatCurrency(value)}`
    : `-${formatCurrency(Math.abs(value))}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Tipos auxiliares para grupos de fornecedores (derivados no client).
export function groupSupplierServices(
  services: SupplierService[]
): { supplierId: string; supplierName: string; services: SupplierService[] }[] {
  const map = new Map<string, { supplierId: string; supplierName: string; services: SupplierService[] }>();
  for (const service of services) {
    const entry = map.get(service.supplierId);
    if (entry) {
      entry.services.push(service);
    } else {
      map.set(service.supplierId, {
        supplierId: service.supplierId,
        supplierName: service.supplierName,
        services: [service],
      });
    }
  }
  return Array.from(map.values());
}
