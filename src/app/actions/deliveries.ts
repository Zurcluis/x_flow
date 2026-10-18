"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import {
  createDelivery,
  deliveryErrorMessage,
  listDeliveryCandidates,
} from "@/server/deliveries";
import type { DeliveryCreateInput } from "@/server/deliveries";

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
    return { ok: true, deliveryId: id };
  } catch (e) {
    return {
      ok: false,
      error: deliveryErrorMessage(e, "Erro ao registar a entrega."),
    };
  }
}
