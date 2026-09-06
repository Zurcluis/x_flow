"use server";

import { revalidatePath } from "next/cache";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  approveQuote,
  createQuote,
  CreateQuoteInput,
  deleteQuote,
  getQuoteByToken,
  rejectQuote,
} from "@/server/quotes";
import { getDb } from "@/lib/db";

export type ApproveQuoteResult =
  | { ok: true; workOrderId: string }
  | { ok: false; error: string };

export async function createQuoteAction(
  input: CreateQuoteInput
): Promise<
  | { ok: true; quoteId: string; publicToken: string; quoteNumber: string }
  | { ok: false; error: string }
> {
  try {
    if (!input.vehicleId || !input.customerId) {
      return { ok: false, error: "Viatura e cliente são obrigatórios." };
    }
    if (!input.options || input.options.length === 0) {
      return { ok: false, error: "O orçamento precisa de pelo menos uma opção." };
    }

    const organizationId = await getPrimaryOrganizationId();
    const quote = await createQuote(organizationId, input);
    revalidatePath("/quotes");
    revalidatePath("/");
    return {
      ok: true,
      quoteId: quote.id,
      publicToken: quote.publicToken,
      quoteNumber: quote.quoteNumber,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao emitir o orçamento.",
    };
  }
}

export async function deleteQuoteAction(
  quoteId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const organizationId = await getPrimaryOrganizationId();
    const result = await deleteQuote(organizationId, quoteId);
    if (result.ok) {
      revalidatePath("/quotes");
      revalidatePath("/");
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao eliminar o orçamento.",
    };
  }
}

export async function rejectPublicQuoteAction(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const quote = await getQuoteByToken(token);
    if (!quote) return { ok: false, error: "Orçamento não encontrado." };
    if (quote.status === "approved") {
      return { ok: false, error: "Este orçamento já foi aprovado." };
    }
    const organizationId = await getPrimaryOrganizationId();
    await rejectQuote(organizationId, quote.id);
    revalidatePath("/quotes");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao recusar o orçamento.",
    };
  }
}

export async function approveQuoteAction(
  quoteId: string,
  selectedOptionId?: string
): Promise<ApproveQuoteResult> {
  const organizationId = await getPrimaryOrganizationId();
  const result = await approveQuote(organizationId, quoteId);
  if (result.ok && selectedOptionId) {
    await getDb().query(
      `UPDATE quotes SET selected_option_id = $1, updated_at = NOW() WHERE id = $2`,
      [selectedOptionId, quoteId]
    );
  }
  if (result.ok) {
    revalidatePath("/quotes");
    revalidatePath("/production");
    revalidatePath(`/quotes/${quoteId}`);
  }
  return result;
}

export async function approvePublicQuoteAction(
  token: string,
  selectedOptionId?: string,
  approverName?: string
): Promise<ApproveQuoteResult> {
  const quote = await getQuoteByToken(token);
  if (!quote) return { ok: false, error: "Orçamento não encontrado ou link expirado." };
  if (quote.status === "approved") {
    return { ok: false, error: "Este orçamento já foi aprovado." };
  }

  const organizationId = await getPrimaryOrganizationId();
  const result = await approveQuote(organizationId, quote.id);
  if (result.ok && selectedOptionId) {
    await getDb().query(
      `UPDATE quotes SET selected_option_id = $1, approved_by_name = $2 WHERE id = $3`,
      [selectedOptionId, approverName ?? "Cliente", quote.id]
    );
  }
  if (result.ok) {
    revalidatePath("/quotes");
    revalidatePath("/production");
  }
  return result;
}
