"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";
import {
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
import { getPrimaryOrganizationId } from "@/server/org";

export type AppointmentResult =
  | { ok: true; appointmentId?: string; conflicts?: ConflictInfo[] }
  | { ok: false; error: string; conflicts?: ConflictInfo[] };

export async function getAppointmentConflictsAction(
  input: AppointmentInput,
  excludeAppointmentId?: string
): Promise<ConflictInfo[]> {
  const organizationId = await getPrimaryOrganizationId();
  return getAppointmentConflicts(organizationId, input, excludeAppointmentId);
}

export async function saveAppointmentAction(
  input: AppointmentInput,
  appointmentId?: string
): Promise<AppointmentResult> {
  try {
    const organizationId = await getPrimaryOrganizationId();
    const conflicts = await getAppointmentConflicts(organizationId, input, appointmentId);
    if (conflicts.length > 0) {
      return { ok: false, error: "CONFLICT", conflicts };
    }
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
  try {
    const organizationId = await getPrimaryOrganizationId();
    if (appointmentId) {
      await updateAppointment(organizationId, appointmentId, input);
    } else {
      await createAppointment(organizationId, input);
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
  try {
    const organizationId = await getPrimaryOrganizationId();
    await moveAppointment(organizationId, appointmentId, new Date(newStartIso), new Date(newEndIso), bayId);
    revalidatePath("/calendar");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao mover a marcação.",
    };
  }
}

export async function cancelAppointmentAction(appointmentId: string): Promise<AppointmentResult> {
  try {
    const organizationId = await getPrimaryOrganizationId();
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
  try {
    const organizationId = await getPrimaryOrganizationId();
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
  try {
    const organizationId = await getPrimaryOrganizationId();
    await updateBay(organizationId, bayId, input);
    revalidatePath("/calendar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao atualizar a baia." };
  }
}

export async function deleteBayAction(bayId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const organizationId = await getPrimaryOrganizationId();
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
  try {
    const organizationId = await getPrimaryOrganizationId();
    const r = await assignVehicleToBay(organizationId, vehicleId, bayId, date);
    if (r.ok) revalidatePath("/calendar");
    return r;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao atribuir a viatura." };
  }
}