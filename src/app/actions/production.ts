"use server";

import { revalidatePath } from "next/cache";
import { PhaseKey } from "@/domains/production/types";
import { WorkOrder } from "@/domains/checkins/types";
import { requireAuth, type AuthContext } from "@/server/auth";
import { hasRole, SCHEDULING_ROLES } from "@/lib/roles";
import {
  addTimeEntry,
  completePhase,
  startPhase,
  toggleChecklistItem,
  updateWorkOrderStatus,
} from "@/server/production";

function assertSchedulingAccess(auth: AuthContext): void {
  if (!hasRole(auth.role, SCHEDULING_ROLES)) {
    throw new Error("Sem permissão para gerir a produção.");
  }
}

export async function updateWorkOrderStatusAction(
  workOrderId: string,
  status: WorkOrder["status"]
) {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sem permissão." };
  }
  const organizationId = auth.organizationId;
  const result = await updateWorkOrderStatus(organizationId, workOrderId, status);
  if (result.ok) {
    revalidatePath("/production");
    revalidatePath(`/production/${workOrderId}`);
  }
  return result;
}

export async function completePhaseAction(workOrderId: string, phaseId: string) {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sem permissão." };
  }
  const result = await completePhase(auth.organizationId, workOrderId, phaseId);
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/production");
  }
  return result;
}

export async function startPhaseAction(workOrderId: string, phaseId: string) {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sem permissão." };
  }
  const result = await startPhase(auth.organizationId, workOrderId, phaseId);
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/production");
  }
  return result;
}

export async function toggleChecklistItemAction(
  workOrderId: string,
  itemId: string,
  completed: boolean
) {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sem permissão." };
  }
  const result = await toggleChecklistItem(
    auth.organizationId,
    workOrderId,
    itemId,
    completed,
    auth.name
  );
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/production");
  }
  return result;
}

export async function addTimeEntryAction(
  workOrderId: string,
  phaseKey: PhaseKey,
  hoursSpent: number,
  notes?: string
) {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sem permissão." };
  }
  const result = await addTimeEntry(
    auth.organizationId,
    workOrderId,
    phaseKey,
    auth.name,
    hoursSpent,
    notes
  );
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/production");
    revalidatePath("/time-book");
  }
  return result;
}
