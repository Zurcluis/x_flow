"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import {
  addMaterialBatch,
  createMaterialRemnant,
  createOrUpdateMaterial,
  CreateOrUpdateMaterialInput,
  createPurchaseOrder,
  listMaterials,
  markPurchaseOrderSent,
  receivePurchaseOrder,
  registerMaterialCut,
  useMaterialRemnant as consumeMaterialRemnant,
} from "@/server/materials";

export async function listMaterialsAction() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const materials = await listMaterials(auth.organizationId);
  return { ok: true as const, materials };
}

export async function createOrUpdateMaterialAction(
  input: CreateOrUpdateMaterialInput
) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await createOrUpdateMaterial(
    auth.organizationId,
    input,
    auth.name
  );
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
  }
  return result;
}

export async function addMaterialBatchAction(input: {
  materialId: string;
  batchNumber: string;
  supplierName: string;
  meters: number;
  costPerMeter?: number;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await addMaterialBatch(auth.organizationId, input, auth.name);
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
  }
  return result;
}

export async function registerMaterialCutAction(input: {
  materialId: string;
  batchId?: string;
  metersCut: number;
  estimatedMeters?: number;
  workOrderId?: string;
  createRemnant?: {
    widthCm: number;
    lengthCm: number;
    location: string;
    notes?: string;
  };
  notes?: string;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await registerMaterialCut(
    auth.organizationId,
    input,
    auth.name
  );
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
    if (input.workOrderId) {
      revalidatePath(`/production/${input.workOrderId}`);
    }
  }
  return result;
}

export async function createMaterialRemnantAction(input: {
  materialId: string;
  batchNumber?: string;
  widthCm: number;
  lengthCm: number;
  location: string;
  notes?: string;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await createMaterialRemnant(
    auth.organizationId,
    input,
    auth.name
  );
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
  }
  return result;
}

export async function consumeMaterialRemnantAction(
  remnantId: string,
  workOrderId?: string
) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await consumeMaterialRemnant(
    auth.organizationId,
    remnantId,
    workOrderId,
    auth.name
  );
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
    if (workOrderId) {
      revalidatePath(`/production/${workOrderId}`);
    }
  }
  return result;
}

export async function createPurchaseOrderAction(input: {
  materialId?: string;
  materialName?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  quantityRolls: number;
  metersPerRoll: number;
  estimatedCost?: number;
  notes?: string;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await createPurchaseOrder(auth.organizationId, input);
  if (result.ok) {
    revalidatePath("/stock");
  }
  return result;
}

export async function markPurchaseOrderSentAction(
  orderId: string,
  via: "whatsapp" | "email"
) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await markPurchaseOrderSent(
    auth.organizationId,
    orderId,
    via
  );
  if (result.ok) {
    revalidatePath("/stock");
  }
  return result;
}

export async function receivePurchaseOrderAction(
  orderId: string,
  batchNumber: string
) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const result = await receivePurchaseOrder(
    auth.organizationId,
    orderId,
    batchNumber,
    auth.name
  );
  if (result.ok) {
    revalidatePath("/stock");
    revalidatePath("/production");
  }
  return result;
}
