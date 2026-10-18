"use server";

import { revalidatePath } from "next/cache";
import { assertFinancialAccess, requireAuth } from "@/server/auth";
import {
  createRecurringRule,
  createTransaction,
  generateDueRecurring,
  toggleRecurringRule,
} from "@/server/treasury";
import { getInvoiceById } from "@/server/finance";
import { markInvoicePaid } from "@/server/deliveries";
import {
  isIsoDateTime,
  isMoneyAmount,
  isPositiveMoneyAmount,
  isUuid,
} from "@/domains/finance/validation";
import type {
  InvoicePaymentInput,
  RecurringRuleCreateInput,
  TransactionCreateInput,
} from "@/domains/finance/types";

export interface FinanceActionResult {
  ok: boolean;
  error?: string;
}

const PAYMENT_METHODS = new Set<string>([
  "bank_transfer",
  "mbway",
  "multibanco",
  "cash",
  "credit_30_days",
]);

function safeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message;
  if (/violat|duplicate key|relation|column|syntax|null value|invalid input/i.test(message)) {
    return fallback;
  }
  return message.length > 0 && message.length <= 240 ? message : fallback;
}

export async function createTransactionAction(
  input: TransactionCreateInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    assertFinancialAccess(auth);
    if (input.type !== "income" && input.type !== "expense") {
      return { ok: false, error: "Tipo de movimento inválido." };
    }
    if (!isIsoDateTime(input.occurredAt)) {
      return { ok: false, error: "A data do movimento é inválida." };
    }
    if (!isPositiveMoneyAmount(input.amount)) {
      return { ok: false, error: "Introduz um valor superior a zero." };
    }
    if (input.vatAmount !== undefined && !isMoneyAmount(input.vatAmount)) {
      return { ok: false, error: "O IVA tem de ser um número igual ou superior a zero." };
    }
    await createTransaction(auth.organizationId, auth.profileId, input);
    revalidatePath("/finance");
    revalidatePath("/finance/movements");
    revalidatePath("/invoices");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: safeErrorMessage(e, "Erro ao registar o movimento."),
    };
  }
}

export async function createRecurringRuleAction(
  input: RecurringRuleCreateInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    assertFinancialAccess(auth);
    await createRecurringRule(auth.organizationId, input);
    revalidatePath("/finance");
    revalidatePath("/finance/recurring");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: safeErrorMessage(e, "Erro ao criar a rubrica recorrente."),
    };
  }
}

export async function toggleRecurringRuleAction(
  ruleId: string,
  active: boolean
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    assertFinancialAccess(auth);
    if (!isUuid(ruleId)) {
      return { ok: false, error: "Rubrica recorrente não encontrada." };
    }
    await toggleRecurringRule(auth.organizationId, ruleId, active);
    revalidatePath("/finance");
    revalidatePath("/finance/recurring");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: safeErrorMessage(e, "Erro ao atualizar a rubrica."),
    };
  }
}

export async function markInvoicePaidAction(
  invoiceId: string,
  payment?: InvoicePaymentInput
): Promise<FinanceActionResult> {
  const auth = await requireAuth();
  try {
    assertFinancialAccess(auth);
    if (!isUuid(invoiceId)) {
      return { ok: false, error: "Fatura não encontrada." };
    }
    if (payment) {
      if (!isIsoDateTime(payment.occurredAt)) {
        return { ok: false, error: "A data do pagamento é inválida." };
      }
      if (!PAYMENT_METHODS.has(payment.method)) {
        return { ok: false, error: "Método de pagamento inválido." };
      }
    }
    const invoice = await getInvoiceById(auth.organizationId, invoiceId);
    if (!invoice) {
      return { ok: false, error: "Fatura não encontrada." };
    }
    if (invoice.paymentStatus === "paid") {
      return { ok: false, error: "Esta fatura já está liquidada." };
    }
    if (invoice.paymentStatus === "cancelled") {
      return { ok: false, error: "Não é possível liquidar uma fatura anulada." };
    }
    const organizationId = auth.organizationId;
    await markInvoicePaid(organizationId, invoiceId, payment, auth.profileId);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/finance");
    revalidatePath("/finance/movements");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: safeErrorMessage(e, "Erro ao registar o pagamento."),
    };
  }
}

export async function generateRecurringAction(): Promise<
  FinanceActionResult & { generated?: number }
> {
  const auth = await requireAuth();
  try {
    assertFinancialAccess(auth);
    const generated = await generateDueRecurring(auth.organizationId);
    revalidatePath("/finance");
    revalidatePath("/finance/movements");
    return { ok: true, generated };
  } catch (e) {
    return {
      ok: false,
      error: safeErrorMessage(e, "Erro ao gerar rubricas recorrentes."),
    };
  }
}
