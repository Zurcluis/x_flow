"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import {
  createDelivery,
  deliveryErrorMessage,
  listDeliveryCandidates,
  markAftersalesStep,
  submitDeliveryFeedback,
  type DeliveryCreateInput,
  type PublicDeliveryFeedbackData,
} from "@/server/deliveries";

export type DeliveryActionResult =
  | { ok: true; deliveryId: string }
  | { ok: false; error: string };

export async function listDeliveryCandidatesAction() {
  const auth = await requireRole(SCHEDULING_ROLES);
  return listDeliveryCandidates(auth.organizationId);
}

export async function createDeliveryAction(
  input: Omit<DeliveryCreateInput, "deliveredByName">
): Promise<DeliveryActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    if (!input.workOrderId) {
      return { ok: false, error: "Selecione a ordem de trabalho a entregar." };
    }
    if (!input.receiverName?.trim()) {
      return { ok: false, error: "O nome de quem levanta a viatura é obrigatório." };
    }
    if (!input.signatureDataUrl?.trim()) {
      return { ok: false, error: "Recolhe a assinatura de quem levanta a viatura." };
    }
    const { id } = await createDelivery(auth.organizationId, {
      workOrderId: input.workOrderId,
      deliveredByName: auth.name,
      receiverName: input.receiverName.trim(),
      receiverIdDocument: input.receiverIdDocument?.trim() || undefined,
      signatureDataUrl: input.signatureDataUrl,
      belongings: input.belongings ?? [],
      notes: input.notes?.trim() || undefined,
    });
    revalidatePath("/deliveries");
    revalidatePath(`/deliveries/${id}`);
    revalidatePath("/warranties");
    revalidatePath("/invoices");
    revalidatePath("/finance");
    return { ok: true, deliveryId: id };
  } catch (e) {
    return {
      ok: false,
      error: deliveryErrorMessage(e, "Erro ao registar a entrega."),
    };
  }
}

export async function submitDeliveryFeedbackAction(
  token: string,
  input: {
    rating: number;
    comment?: string;
    googleReviewClicked?: boolean;
  }
): Promise<
  | { ok: true; feedback: PublicDeliveryFeedbackData }
  | { ok: false; error: string }
> {
  try {
    const feedback = await submitDeliveryFeedback(token, input);
    revalidatePath(`/feedback/${token}`);
    revalidatePath("/deliveries");
    return { ok: true, feedback };
  } catch (e) {
    return {
      ok: false,
      error: deliveryErrorMessage(e, "Erro ao submeter a avaliação."),
    };
  }
}

export async function markAftersalesStepAction(
  deliveryId: string,
  step: "d7_sent" | "d30_completed",
  notes?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    await markAftersalesStep(auth.organizationId, deliveryId, step, notes);
    revalidatePath("/deliveries");
    revalidatePath(`/deliveries/${deliveryId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: deliveryErrorMessage(e, "Erro ao atualizar acompanhamento pós-venda."),
    };
  }
}
