"use server";

import { revalidatePath } from "next/cache";
import { PhaseKey } from "@/domains/production/types";
import { WorkOrder } from "@/domains/checkins/types";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  addTimeEntry,
  completePhase,
  startPhase,
  toggleChecklistItem,
  updateWorkOrderStatus,
} from "@/server/production";

export async function updateWorkOrderStatusAction(
  workOrderId: string,
  status: WorkOrder["status"]
) {
  const organizationId = await getPrimaryOrganizationId();
  const result = await updateWorkOrderStatus(organizationId, workOrderId, status);
  if (result.ok) {
    revalidatePath("/production");
    revalidatePath(`/production/${workOrderId}`);
  }
  return result;
}

export async function completePhaseAction(workOrderId: string, phaseId: string) {
  const result = await completePhase(workOrderId, phaseId);
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/production");
  }
  return result;
}

export async function startPhaseAction(workOrderId: string, phaseId: string) {
  const result = await startPhase(workOrderId, phaseId);
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
  const result = await toggleChecklistItem(itemId, completed, "João Martins");
  if (result.ok) revalidatePath(`/production/${workOrderId}`);
  return result;
}

export async function addTimeEntryAction(
  workOrderId: string,
  phaseKey: PhaseKey,
  technicianName: string,
  hoursSpent: number,
  notes?: string
) {
  const result = await addTimeEntry(workOrderId, phaseKey, technicianName, hoursSpent, notes);
  if (result.ok) {
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath("/time-book");
  }
  return result;
}
