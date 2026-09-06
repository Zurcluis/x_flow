"use server";

import { revalidatePath } from "next/cache";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  createDelivery,
  DeliveryCreateInput,
  listDeliveryCandidates,
  markInvoicePaid,
} from "@/server/deliveries";

export type DeliveryActionResult =
  | { ok: true; deliveryId: string }
  | { ok: false; error: string };

export async function listDeliveryCandidatesAction() {
  const organizationId = await getPrimaryOrganizationId();
  return listDeliveryCandidates(organizationId);
}

export async function createDeliveryAction(
  input: Omit<DeliveryCreateInput, "deliveredByName"> & { deliveredByName?: string }
): Promise<DeliveryActionResult> {
  try {
    if (!input.workOrderId) {
      return { ok: false, error: "Selecione a ordem de trabalho a entregar." };
    }
    if (!input.receiverName?.trim()) {
      return { ok: false, error: "O nome de quem levanta a viatura é obrigatório." };
    }
    const organizationId = await getPrimaryOrganizationId();
    const { id } = await createDelivery(organizationId, {
      workOrderId: input.workOrderId,
      deliveredByName: input.deliveredByName?.trim() || "Equipa X-Motion",
      receiverName: input.receiverName.trim(),
      receiverIdDocument: input.receiverIdDocument?.trim() || undefined,
      signatureDataUrl: input.signatureDataUrl || undefined,
      belongings: input.belongings ?? [],
      notes: input.notes?.trim() || undefined,
    });
    revalidatePath("/deliveries");
    revalidatePath(`/deliveries/${id}`);
    return { ok: true, deliveryId: id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar a entrega.",
    };
  }
}

export async function markInvoicePaidAction(
  invoiceId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const organizationId = await getPrimaryOrganizationId();
    await markInvoicePaid(organizationId, invoiceId);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar o pagamento.",
    };
  }
}
