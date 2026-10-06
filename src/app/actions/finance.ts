"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createRecurringRule,
  createTransaction,
  generateDueRecurring,
  toggleRecurringRule,
} from "@/server/treasury";
import { markInvoicePaid } from "@/server/deliveries";
import type {
  InvoicePaymentInput,
  RecurringRuleCreateInput,
  TransactionCreateInput,
} from "@/domains/finance/types";

export interface FinanceActionResult {
  ok: boolean;
  error?: string;
}

export async function createTransactionAction(
  input: TransactionCreateInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    if (input.type !== "income" && input.type !== "expense") {
      return { ok: false, error: "Tipo de movimento inválido." };
    }
    if (!input.occurredAt) {
      return { ok: false, error: "A data do movimento é obrigatória." };
    }
    await createTransaction(auth.organizationId, auth.profileId, input);
    revalidatePath("/finance");
    revalidatePath("/invoices");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar o movimento.",
    };
  }
}

export async function createRecurringRuleAction(
  input: RecurringRuleCreateInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    await createRecurringRule(auth.organizationId, input);
    revalidatePath("/finance");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao criar a rubrica recorrente.",
    };
  }
}

export async function toggleRecurringRuleAction(
  ruleId: string,
  active: boolean
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    await toggleRecurringRule(auth.organizationId, ruleId, active);
    revalidatePath("/finance");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao atualizar a rubrica.",
    };
  }
}

export async function markInvoicePaidAction(
  invoiceId: string,
  payment?: InvoicePaymentInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    if (payment && !payment.occurredAt) {
      return { ok: false, error: "A data do pagamento é obrigatória." };
    }
    const organizationId = auth.organizationId;
    await markInvoicePaid(organizationId, invoiceId, payment, auth.profileId);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/finance");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar o pagamento.",
    };
  }
}

export async function generateRecurringAction(): Promise<
  FinanceActionResult & { generated?: number }
> {
  const auth = await requireAuth();
  try {
    const generated = await generateDueRecurring(auth.organizationId);
    revalidatePath("/finance");
    return { ok: true, generated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao gerar rubricas recorrentes.",
    };
  }
}
