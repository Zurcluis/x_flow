// Tipos partilhados do domínio de preços flexíveis.
// Contrato único usado pelo motor, pelo servidor e pelas interfaces.

export type PricingMethod = "manual" | "monthly";
export type ExpenseCategory = "operational" | "acquisition";
export type ExpenseKind =
  | "expense"
  | "provision"
  | "reserve"
  | "cash_recovery";
export type ExpenseValidationState =
  | "estimated"
  | "validated"
  | "needs_breakdown";
export type PolicyStatus = "draft" | "active" | "archived";

export interface PricingExpenseItem {
  id: string;
  organizationId: string;
  version: number;
  name: string;
  description?: string | null;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  periodicity: "monthly" | "yearly";
  monthlyEquivalent: number;
  includedInPricing: boolean;
  includesPersonnel: boolean;
  source?: string | null;
  validationState: ExpenseValidationState;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PricingPolicy {
  id: string;
  organizationId: string;
  version: number;
  method: PricingMethod;
  manualDailyExpenses: number;
  dailyCapacityHours: number;
  profitDailyTarget: number;
  spotSurchargePerHour: number;
  productiveDaysPerMonth: number | null;
  subletFeePercent: number;
  wasteRatePercent: number;
  vatRate: number;
  status: PolicyStatus;
  effectiveFrom: string;
  publishedAt?: string | null;
  createdAt: string;
}

export type FormulaComponentType =
  | "expense_base"
  | "profit_objective"
  | "spot_surcharge"
  | "fixed_amount"
  | "material"
  | "material_margin"
  | "percent_adjust"
  | "consumable_kits"
  | "sublet"
  | "extras";

export interface FormulaComponentParams {
  scope?: "aggregated" | "operational" | "cash_recovery";
  amount?: number;
  percent?: number;
  base?: "material" | "service_part" | "subtotal_before_percent";
}

export interface FormulaComponent {
  id: string;
  type: FormulaComponentType;
  label: string;
  enabled: boolean;
  params: FormulaComponentParams;
}

export type FormulaCode = "complete" | "spot" | "custom";

export interface PricingFormulaVersion {
  id: string;
  organizationId: string;
  formulaId: string;
  code: FormulaCode;
  name: string;
  description?: string | null;
  version: number;
  components: FormulaComponent[];
  status: "draft" | "published" | "archived";
  effectiveFrom: string;
  publishedAt?: string | null;
  createdAt: string;
}

export type ConsumableKitKind = "spot" | "ppf_front" | "wrap_full" | "custom";

export interface ConsumableKit {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  kind: ConsumableKitKind;
  price: number;
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface SupplierService {
  id: string;
  organizationId: string;
  supplierId: string;
  supplierName: string;
  serviceName: string;
  basePrice: number;
  replacedPhaseKey?: string | null;
  phaseHours?: number | null;
  active: boolean;
  createdAt: string;
}

export type CostLineType = "material" | "consumable_kit" | "sublet" | "extra";
export type CostLineUnit = "linear_meter" | "m2" | "unit" | "package";

export interface QuoteCostLine {
  id?: string;
  lineType: CostLineType;
  name: string;
  quantity: number;
  unit: CostLineUnit;
  unitCost: number;
  wasteRatePercent: number;
  totalCost: number;
  kitId?: string | null;
  supplierServiceId?: string | null;
  materialId?: string | null;
  deductedHours?: number | null;
  notes?: string | null;
  sortOrder: number;
}

export type ServiceLineMode = "complete" | "spot";

export interface ServiceLine {
  id?: string;
  name: string;
  description?: string | null;
  mode: ServiceLineMode;
  hours: number;
  notes?: string | null;
  sortOrder: number;
}

export type AdjustKind =
  | "none"
  | "manual_price"
  | "percent_discount"
  | "euro_adjust";

export interface PricingRates {
  method: PricingMethod;
  capacityHoursPerDay: number;
  productiveDays: number | null;
  monthlyOperational: number;
  monthlyCashRecovery: number;
  monthlyTotal: number;
  dailyBaseAggregated: number;
  hourlyExpenseAggregated: number;
  hourlyOperational: number | null;
  hourlyCashRecovery: number | null;
  profitHourly: number;
  spotSurchargePerHour: number;
  completeHourlyRate: number;
  spotHourlyRate: number;
  vatRate: number;
  subletFeePercent: number;
  wasteRatePercent: number;
}

export interface SuggestionComponent {
  type: FormulaComponentType;
  label: string;
  value: number;
}

export interface CostSummary {
  materialCost: number;
  materialMargin: number;
  kitsCost: number;
  subletCost: number;
  subletFee: number;
  extrasCost: number;
  fixedAmounts: number;
  totalDirectCost: number;
  declaredHours: number;
  deductedHours: number;
  billedHours: number;
  spotHours: number;
  completeHours: number;
}

export interface SuggestionResult {
  suggestedPriceBeforeVat: number;
  breakdown: SuggestionComponent[];
  costSummary: CostSummary;
}

export interface FinalFinancials {
  suggestedPriceBeforeVat: number;
  priceBeforeVat: number;
  adjustKind: AdjustKind;
  adjustValue: number;
  vatAmount: number;
  totalWithVat: number;
  priceVsSuggested: number;
  priceVsSuggestedPercent: number;
  operationalResult: number | null;
  balanceAfterBase: number;
  operationalAttributed: number | null;
  aggregatedAttributed: number;
  dataQuality: "estimated";
}

export interface PricingValidationError {
  field: string;
  message: string;
}
