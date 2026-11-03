"use server";

import { revalidatePath } from "next/cache";
import { PhaseKey, QCInspection } from "@/domains/production/types";
import { WorkOrder } from "@/domains/checkins/types";
import { requireAuth, type AuthContext } from "@/server/auth";
import { hasRole, SCHEDULING_ROLES } from "@/lib/roles";
import {
  addTimeEntry,
  completePhase,
  saveQcInspection,
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

export async function saveQcInspectionAction(
  workOrderId: string,
  input: {
    inspectorName?: string;
    overallNotes?: string;
    items: Array<{
      id?: string;
      criterionName: string;
      category: string;
      status: "pass" | "fail" | "na";
      reworkNotes?: string;
    }>;
    finalizeApprove?: boolean;
  }
): Promise<{ ok: true; inspection: QCInspection } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const inspection = await saveQcInspection(auth.organizationId, workOrderId, {
      inspectorName: input.inspectorName?.trim() || auth.name,
      overallNotes: input.overallNotes,
      items: input.items,
      finalizeApprove: input.finalizeApprove,
    });
    revalidatePath("/production");
    revalidatePath(`/production/${workOrderId}`);
    revalidatePath(`/production/${workOrderId}/qc`);
    revalidatePath("/deliveries");
    revalidatePath("/deliveries/new");
    if (inspection.certificateNumber) {
      revalidatePath(`/qc/certificate/${inspection.certificateNumber}`);
    }
    return { ok: true, inspection };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Erro ao gravar a inspeção de Controlo de Qualidade.",
    };
  }
}
