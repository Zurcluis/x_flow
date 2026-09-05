"use server";

import { revalidatePath } from "next/cache";
import { PhaseKey } from "@/domains/production/types";
import {
  addTimeEntry,
  completePhase,
  startPhase,
  toggleChecklistItem,
} from "@/server/production";

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
