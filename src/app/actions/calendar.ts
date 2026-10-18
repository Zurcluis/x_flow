"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";
import {
  AppointmentConflictError,
  createBay,
  deleteBay,
  updateBay,
  assignVehicleToBay,
  createAppointment,
  getAppointmentConflicts,
  cancelAppointment,
  moveAppointment,
  updateAppointment,
  AppointmentInput,
  ConflictInfo,
  BayInput,
} from "@/server/calendar";
import { assertManagementAccess, requireAuth, type AuthContext } from "@/server/auth";
import { hasRole, SCHEDULING_ROLES } from "@/lib/roles";

function assertSchedulingAccess(auth: AuthContext): void {
  if (!hasRole(auth.role, SCHEDULING_ROLES)) {
    throw new Error("Sem permissão para gerir a agenda.");
  }
}

export type AppointmentResult =
  | { ok: true; appointmentId?: string; conflicts?: ConflictInfo[] }
  | { ok: false; error: string; conflicts?: ConflictInfo[] };

export async function getAppointmentConflictsAction(
  input: AppointmentInput,
  excludeAppointmentId?: string
): Promise<ConflictInfo[]> {
  const auth = await requireAuth();
  assertSchedulingAccess(auth);
  const organizationId = auth.organizationId;
  return getAppointmentConflicts(organizationId, input, excludeAppointmentId);
}

export async function saveAppointmentAction(
  input: AppointmentInput,
  appointmentId?: string
): Promise<AppointmentResult> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const organizationId = auth.organizationId;
    if (appointmentId) {
      await updateAppointment(organizationId, appointmentId, input);
    } else {
      await createAppointment(organizationId, input);
    }
    revalidatePath("/calendar");
    revalidatePath("/");
    revalidatePath("/production");
    return { ok: true, conflicts: [] };
  } catch (e) {
    if (e instanceof AppointmentConflictError) {
      return { ok: false, error: "CONFLICT", conflicts: e.conflicts };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar a marcação.",
    };
  }
}

export async function forceSaveAppointmentAction(
  input: AppointmentInput,
  appointmentId?: string
): Promise<AppointmentResult> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const organizationId = auth.organizationId;
    const options = { checkConflicts: false };
    if (appointmentId) {
      await updateAppointment(organizationId, appointmentId, input, options);
    } else {
      await createAppointment(organizationId, input, options);
    }
    revalidatePath("/calendar");
    revalidatePath("/");
    revalidatePath("/production");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar a marcação.",
    };
  }
}

export async function moveAppointmentAction(
  appointmentId: string,
  newStartIso: string,
  newEndIso: string,
  bayId?: string
): Promise<AppointmentResult> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const organizationId = auth.organizationId;
    const newStart = new Date(newStartIso);
    const newEnd = new Date(newEndIso);
    if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
      return { ok: false, error: "Data ou hora inválida." };
    }
    await moveAppointment(organizationId, appointmentId, newStart, newEnd, bayId);
    revalidatePath("/calendar");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof AppointmentConflictError) {
      return { ok: false, error: "CONFLICT", conflicts: e.conflicts };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao mover a marcação.",
    };
  }
}

export async function cancelAppointmentAction(appointmentId: string): Promise<AppointmentResult> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const organizationId = auth.organizationId;
    await cancelAppointment(organizationId, appointmentId);
    revalidatePath("/calendar");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao cancelar a marcação.",
    };
  }
}

export type AppointmentStatusValue = AppointmentStatus;

// ── Baías (mapa da oficina) ─────────────────────────────────────────────────

export async function createBayAction(
  input: BayInput
): Promise<{ ok: true; bay: WorkshopBay } | { ok: false; error: string }> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    const organizationId = auth.organizationId;
    const bay = await createBay(organizationId, input);
    revalidatePath("/calendar");
    return { ok: true, bay };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao criar a baia." };
  }
}

export async function updateBayAction(
  bayId: string,
  input: Partial<BayInput>
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    const organizationId = auth.organizationId;
    await updateBay(organizationId, bayId, input);
    revalidatePath("/calendar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao atualizar a baia." };
  }
}

export async function deleteBayAction(bayId: string): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    const organizationId = auth.organizationId;
    const r = await deleteBay(organizationId, bayId);
    if (!r.ok) return r;
    revalidatePath("/calendar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao eliminar a baia." };
  }
}

export async function assignVehicleToBayAction(
  vehicleId: string,
  bayId: string,
  date: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    assertSchedulingAccess(auth);
    const organizationId = auth.organizationId;
    const r = await assignVehicleToBay(organizationId, vehicleId, bayId, date);
    if (r.ok) revalidatePath("/calendar");
    return r;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao atribuir a viatura." };
  }
}