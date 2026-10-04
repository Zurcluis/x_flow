"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  archiveExpenseItem,
  createExpenseItemVersion,
  createPolicyVersion,
  getExpenseItems,
  publishFormulaVersion,
  saveKit,
  saveSupplier,
  saveSupplierService,
  todayIso,
} from "@/server/pricing";
import { validatePolicy } from "@/domains/pricing/engine";
import type {
  ConsumableKitKind,
  ExpenseCategory,
  ExpenseKind,
  ExpenseValidationState,
  FormulaComponent,
  PricingMethod,
  PricingPolicy,
} from "@/domains/pricing/types";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export interface SavePolicyInput {
  method: PricingMethod;
  manualDailyExpenses: number;
  dailyCapacityHours: number;
  profitDailyTarget: number;
  spotSurchargePerHour: number;
  productiveDaysPerMonth: number | null;
  subletFeePercent: number;
  wasteRatePercent: number;
  vatRate: number;
  intent: "draft" | "publish";
  effectiveFrom: string;
}

export async function savePolicySettingsAction(
  input: SavePolicyInput
): Promise<{ ok: true; policyId: string; version: number } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (input.method !== "manual" && input.method !== "monthly") {
      return { ok: false, error: "Método de preços inválido." };
    }
    if (input.intent !== "draft" && input.intent !== "publish") {
      return { ok: false, error: "Intenção inválida para a política de preços." };
    }
    if (!isIsoDate(input.effectiveFrom)) {
      return { ok: false, error: "A data de vigência é inválida." };
    }

    const errors: string[] = [];
    if (!Number.isFinite(input.dailyCapacityHours) || input.dailyCapacityHours <= 0) {
      errors.push("A capacidade faturável diária tem de ser superior a zero.");
    }
    if (!isNonNegativeNumber(input.manualDailyExpenses)) {
      errors.push("As despesas diárias manuais têm de ser um número igual ou superior a zero.");
    }
    if (!isNonNegativeNumber(input.profitDailyTarget)) {
      errors.push("O objetivo de lucro diário tem de ser um número igual ou superior a zero.");
    }
    if (!isNonNegativeNumber(input.spotSurchargePerHour)) {
      errors.push("O acréscimo pontual por hora tem de ser um número igual ou superior a zero.");
    }
    if (
      input.productiveDaysPerMonth !== null &&
      (!Number.isFinite(input.productiveDaysPerMonth) || input.productiveDaysPerMonth <= 0)
    ) {
      errors.push("Os dias produtivos mensais têm de ser superiores a zero.");
    }
    if (!isNonNegativeNumber(input.subletFeePercent) || input.subletFeePercent > 100) {
      errors.push("A comissão de subcontratação tem de estar entre 0 e 100.");
    }
    if (!isNonNegativeNumber(input.wasteRatePercent) || input.wasteRatePercent > 100) {
      errors.push("A taxa de desperdício tem de estar entre 0 e 100.");
    }
    if (!Number.isFinite(input.vatRate) || input.vatRate < 0 || input.vatRate > 100) {
      errors.push("A taxa de IVA tem de estar entre 0 e 100.");
    }
    if (errors.length > 0) {
      return { ok: false, error: errors.join(" ") };
    }

    const expenseItems = await getExpenseItems(auth.organizationId, {
      asOf: todayIso(),
    });
    const policy: PricingPolicy = {
      id: "",
      organizationId: auth.organizationId,
      version: 0,
      method: input.method,
      manualDailyExpenses: input.manualDailyExpenses,
      dailyCapacityHours: input.dailyCapacityHours,
      profitDailyTarget: input.profitDailyTarget,
      spotSurchargePerHour: input.spotSurchargePerHour,
      productiveDaysPerMonth: input.productiveDaysPerMonth ?? null,
      subletFeePercent: input.subletFeePercent,
      wasteRatePercent: input.wasteRatePercent,
      vatRate: input.vatRate,
      status: "draft",
      effectiveFrom: input.effectiveFrom,
      createdAt: "",
    };
    const policyErrors = validatePolicy(policy, expenseItems);
    if (policyErrors.length > 0) {
      return { ok: false, error: policyErrors.map((e) => e.message).join(" ") };
    }

    const { policyId, version } = await createPolicyVersion(
      auth.organizationId,
      {
        method: input.method,
        manualDailyExpenses: input.manualDailyExpenses,
        dailyCapacityHours: input.dailyCapacityHours,
        profitDailyTarget: input.profitDailyTarget,
        spotSurchargePerHour: input.spotSurchargePerHour,
        productiveDaysPerMonth: input.productiveDaysPerMonth ?? null,
        subletFeePercent: input.subletFeePercent,
        wasteRatePercent: input.wasteRatePercent,
        vatRate: input.vatRate,
        effectiveFrom: input.effectiveFrom,
      },
      { intent: input.intent, profileId: auth.profileId }
    );

    revalidatePath("/settings/pricing");
    revalidatePath("/quotes/new");
    return { ok: true, policyId, version };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar a política de preços.",
    };
  }
}

export interface SaveExpenseItemInput {
  id?: string;
  name: string;
  description?: string | null;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  periodicity: "monthly" | "yearly";
  includedInPricing: boolean;
  includesPersonnel: boolean;
  source?: string | null;
  validationState: ExpenseValidationState;
  effectiveFrom: string;
  notes?: string | null;
}

export async function saveExpenseItemAction(
  input: SaveExpenseItemInput
): Promise<{ ok: true; id: string; version: number } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!input.name || input.name.trim() === "") {
      return { ok: false, error: "O nome da rubrica é obrigatório." };
    }
    if (!["operational", "acquisition"].includes(input.category)) {
      return { ok: false, error: "Categoria da rubrica inválida." };
    }
    if (!["expense", "provision", "reserve", "cash_recovery"].includes(input.kind)) {
      return { ok: false, error: "Natureza da rubrica inválida." };
    }
    if (!["monthly", "yearly"].includes(input.periodicity)) {
      return { ok: false, error: "Periodicidade da rubrica inválida." };
    }
    if (!["estimated", "validated", "needs_breakdown"].includes(input.validationState)) {
      return { ok: false, error: "Estado de validação da rubrica inválido." };
    }
    if (!isNonNegativeNumber(input.amount)) {
      return { ok: false, error: "O montante tem de ser um número igual ou superior a zero." };
    }
    if (!isIsoDate(input.effectiveFrom)) {
      return { ok: false, error: "A data de vigência é inválida." };
    }

    const { id, version } = await createExpenseItemVersion(auth.organizationId, {
      name: input.name.trim(),
      description: input.description ?? null,
      category: input.category,
      kind: input.kind,
      amount: input.amount,
      periodicity: input.periodicity,
      includedInPricing: input.includedInPricing !== false,
      includesPersonnel: input.includesPersonnel === true,
      source: input.source ?? null,
      validationState: input.validationState,
      effectiveFrom: input.effectiveFrom,
      notes: input.notes ?? null,
    });

    revalidatePath("/settings/pricing");
    return { ok: true, id, version };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar a rubrica.",
    };
  }
}

export async function archiveExpenseItemAction(
  itemId: string,
  effectiveTo: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!itemId) {
      return { ok: false, error: "Rubrica não indicada." };
    }
    if (!isIsoDate(effectiveTo)) {
      return { ok: false, error: "A data de fim de vigência é inválida." };
    }
    await archiveExpenseItem(auth.organizationId, itemId, effectiveTo);
    revalidatePath("/settings/pricing");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao arquivar a rubrica.",
    };
  }
}

export interface SaveKitInput {
  id?: string;
  name: string;
  kind: ConsumableKitKind;
  price: number;
  active?: boolean;
}

export async function saveKitAction(
  input: SaveKitInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!input.name || input.name.trim() === "") {
      return { ok: false, error: "O nome do kit é obrigatório." };
    }
    if (!["spot", "ppf_front", "wrap_full", "custom"].includes(input.kind)) {
      return { ok: false, error: "Tipo de kit inválido." };
    }
    if (!isNonNegativeNumber(input.price)) {
      return { ok: false, error: "O preço do kit tem de ser um número igual ou superior a zero." };
    }
    const id = await saveKit(auth.organizationId, {
      id: input.id,
      name: input.name.trim(),
      kind: input.kind,
      price: input.price,
      active: input.active ?? true,
    });
    revalidatePath("/settings/pricing");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar o kit.",
    };
  }
}

export interface SaveSupplierInput {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export async function saveSupplierAction(
  input: SaveSupplierInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!input.name || input.name.trim() === "") {
      return { ok: false, error: "O nome do fornecedor é obrigatório." };
    }
    const id = await saveSupplier(auth.organizationId, {
      id: input.id,
      name: input.name.trim(),
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
    });
    revalidatePath("/settings/pricing");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar o fornecedor.",
    };
  }
}

export interface SaveSupplierServiceInput {
  id?: string;
  supplierId: string;
  serviceName: string;
  basePrice: number;
  replacedPhaseKey?: string | null;
  phaseHours?: number | null;
  active?: boolean;
}

export async function saveSupplierServiceAction(
  input: SaveSupplierServiceInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!input.supplierId) {
      return { ok: false, error: "Indica o fornecedor do serviço." };
    }
    if (!input.serviceName || input.serviceName.trim() === "") {
      return { ok: false, error: "O nome do serviço é obrigatório." };
    }
    if (!isNonNegativeNumber(input.basePrice)) {
      return {
        ok: false,
        error: "O preço base tem de ser um número igual ou superior a zero.",
      };
    }
    if (input.phaseHours !== null && input.phaseHours !== undefined && !Number.isFinite(input.phaseHours)) {
      return { ok: false, error: "As horas da fase têm de ser um número válido." };
    }
    const id = await saveSupplierService(auth.organizationId, {
      id: input.id,
      supplierId: input.supplierId,
      serviceName: input.serviceName.trim(),
      basePrice: input.basePrice,
      replacedPhaseKey: input.replacedPhaseKey ?? null,
      phaseHours: input.phaseHours ?? null,
      active: input.active ?? true,
    });
    revalidatePath("/settings/pricing");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar o serviço do fornecedor.",
    };
  }
}

export interface PublishFormulaInput {
  formulaId: string;
  name: string;
  description?: string | null;
  components: FormulaComponent[];
  effectiveFrom: string;
}

export async function publishFormulaAction(
  input: PublishFormulaInput
): Promise<{ ok: true; versionId: string; version: number } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!input.formulaId) {
      return { ok: false, error: "Fórmula não indicada." };
    }
    if (!input.name || input.name.trim() === "") {
      return { ok: false, error: "O nome da fórmula é obrigatório." };
    }
    if (!isIsoDate(input.effectiveFrom)) {
      return { ok: false, error: "A data de vigência é inválida." };
    }

    const { versionId, version } = await publishFormulaVersion(auth.organizationId, {
      formulaId: input.formulaId,
      name: input.name.trim(),
      description: input.description ?? null,
      components: input.components,
      effectiveFrom: input.effectiveFrom,
      profileId: auth.profileId,
    });

    revalidatePath("/settings/pricing");
    revalidatePath("/quotes/new");
    return { ok: true, versionId, version };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao publicar a fórmula.",
    };
  }
}
