"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@/domains/calendar/types";
import {
  createAppointment,
  getAppointmentConflicts,
  cancelAppointment,
  moveAppointment,
  updateAppointment,
  AppointmentInput,
  ConflictInfo,
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
