"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  approveQuote,
  createQuote,
  deleteQuote,
  emitQuote,
  getQuoteByToken,
  loadDraftQuote,
  rejectQuote,
  updateDraftQuote,
} from "@/server/quotes";
import type { CreateQuoteInput, DraftQuoteData } from "@/domains/quotes/types";

export type ApproveQuoteResult =
  | { ok: true; workOrderId: string }
  | { ok: false; error: string };

export type CreateQuoteResult =
  | { ok: true; quoteId: string; publicToken: string; quoteNumber: string; status: string }
  | { ok: false; error: string };

export type LoadDraftQuoteResult =
  | { ok: true; draft: DraftQuoteData }
  | { ok: false; error: string };

export type UpdateDraftQuoteResult =
  | { ok: true; quoteId: string; publicToken: string; quoteNumber: string; status: string }
  | { ok: false; error: string };

export async function loadDraftQuoteAction(
  quoteId: string
): Promise<LoadDraftQuoteResult> {
  const auth = await requireAuth();
  try {
    if (!quoteId) {
      return { ok: false, error: "Orçamento não indicado." };
    }
    const draft = await loadDraftQuote(auth.organizationId, quoteId);
    if (!draft) {
      return { ok: false, error: "Rascunho não encontrado ou já enviado." };
    }
    return { ok: true, draft };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao carregar o rascunho.",
    };
  }
}

export async function updateDraftQuoteAction(
  input: CreateQuoteInput & { quoteId: string }
): Promise<UpdateDraftQuoteResult> {
  const auth = await requireAuth();
  try {
    if (!input.quoteId) {
      return { ok: false, error: "Orçamento não indicado." };
    }
    if (!input.vehicleId || !input.customerId) {
      return { ok: false, error: "Viatura e cliente são obrigatórios." };
    }
    if (!input.options || input.options.length === 0) {
      return { ok: false, error: "O orçamento precisa de pelo menos uma opção." };
    }

    const quote = await updateDraftQuote(
      auth.organizationId,
      input.quoteId,
      input,
      auth.profileId
    );
    revalidatePath("/quotes");
    revalidatePath("/");
    revalidatePath(`/quotes/${quote.id}`);
    return {
      ok: true,
      quoteId: quote.id,
      publicToken: quote.publicToken,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao atualizar o rascunho.",
    };
  }
}

export async function createQuoteAction(
  input: CreateQuoteInput
): Promise<CreateQuoteResult> {
  const auth = await requireAuth();
  try {
    if (!input.vehicleId || !input.customerId) {
      return { ok: false, error: "Viatura e cliente são obrigatórios." };
    }
    if (!input.options || input.options.length === 0) {
      return { ok: false, error: "O orçamento precisa de pelo menos uma opção." };
    }

    const quote = await createQuote(auth.organizationId, input, auth.profileId);
    revalidatePath("/quotes");
    revalidatePath("/");
    return {
      ok: true,
      quoteId: quote.id,
      publicToken: quote.publicToken,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao emitir o orçamento.",
    };
  }
}

export async function emitQuoteAction(
  quoteId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    if (!quoteId) {
      return { ok: false, error: "Orçamento não indicado." };
    }
    const result = await emitQuote(auth.organizationId, quoteId);
    if (result.ok) {
      revalidatePath("/quotes");
      revalidatePath(`/quotes/${quoteId}`);
    }
    return result;
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
  const auth = await requireAuth();
  try {
    const organizationId = auth.organizationId;
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
    const organizationId = quote.organizationId;
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
  const auth = await requireAuth();
  const organizationId = auth.organizationId;
  const result = await approveQuote(organizationId, quoteId, selectedOptionId);
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

  const result = await approveQuote(quote.organizationId, quote.id, selectedOptionId, approverName);
  if (result.ok) {
    revalidatePath("/quotes");
    revalidatePath("/production");
  }
  return result;
}
