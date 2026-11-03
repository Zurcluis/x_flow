"use server";

import { revalidatePath } from "next/cache";
import { ItemType, Vehicle, VehicleNote } from "@/domains/vehicles/types";
import {
  addVehicleNote,
  createVehicle,
  deleteVehicleNote,
  updateVehicle,
  VehicleCreateInput,
  VehicleValidationError,
} from "@/server/vehicles";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export type VehicleActionResult =
  | { ok: true; vehicle: Vehicle }
  | { ok: false; error: string };

export type VehicleNoteActionResult =
  | { ok: true; note: VehicleNote }
  | { ok: false; error: string };

export type DeleteVehicleNoteActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createVehicleAction(
  input: Partial<Vehicle> & { customerId?: string; itemType?: ItemType }
): Promise<VehicleActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  const customerId = input.customerId ?? input.currentOwner?.customerId;
  try {
    const createInput: VehicleCreateInput = {
      itemType: input.itemType,
      plateDisplay: input.plateDisplay ?? "",
      plateNormalized: input.plateNormalized ?? input.plateDisplay ?? "",
      make: input.make ?? "",
      model: input.model ?? "",
      generationYear: input.generationYear ?? NaN,
      bodyType: input.bodyType ?? "sedan",
      originalColorName: input.originalColorName ?? "",
      originalColorFamily: input.originalColorFamily ?? "other",
      vin: input.vin,
      currentMileage: input.currentMileage,
      fuelType: input.fuelType,
      notes: input.notes,
      customerId,
    };

    const vehicle = await createVehicle(auth.organizationId, createInput);
    revalidatePath("/vehicles");
    if (vehicle.currentOwner?.customerId) {
      revalidatePath(`/customers/${vehicle.currentOwner.customerId}`);
    }
    return { ok: true, vehicle };
  } catch (e) {
    if (e instanceof VehicleValidationError) {
      return { ok: false, error: e.message };
    }
    const message = e instanceof Error ? e.message : "";
    if (message.includes("vehicles_org_plate_unique") || message.includes("duplicate key")) {
      return { ok: false, error: "Já existe uma viatura com essa matrícula." };
    }
    console.error("Falha ao criar viatura", e);
    return { ok: false, error: "Não foi possível guardar a viatura. Tenta novamente." };
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  input: Partial<Vehicle> & { customerId?: string; itemType?: ItemType }
): Promise<VehicleActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    const updateInput: Partial<VehicleCreateInput> & { itemType?: ItemType } = {
      itemType: input.itemType,
      plateDisplay: input.plateDisplay,
      plateNormalized: input.plateNormalized,
      make: input.make,
      model: input.model,
      generationYear: input.generationYear,
      bodyType: input.bodyType,
      originalColorName: input.originalColorName,
      originalColorFamily: input.originalColorFamily,
      vin: input.vin,
      currentMileage: input.currentMileage,
      fuelType: input.fuelType,
      notes: input.notes,
    };
    if ("customerId" in input) {
      updateInput.customerId = input.customerId;
    }

    const vehicle = await updateVehicle(auth.organizationId, vehicleId, updateInput);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${vehicleId}`);
    if (vehicle.currentOwner?.customerId) {
      revalidatePath(`/customers/${vehicle.currentOwner.customerId}`);
    }
    return { ok: true, vehicle };
  } catch (e) {
    if (e instanceof VehicleValidationError) {
      return { ok: false, error: e.message };
    }
    const message = e instanceof Error ? e.message : "";
    if (message.includes("vehicles_org_plate_unique") || message.includes("duplicate key")) {
      return { ok: false, error: "Já existe uma viatura com essa matrícula." };
    }
    console.error("Falha ao atualizar viatura", e);
    return { ok: false, error: "Não foi possível atualizar a viatura. Tenta novamente." };
  }
}

export async function addVehicleNoteAction(
  vehicleId: string,
  input: { category: "technical" | "bodywork" | "general"; content: string }
): Promise<VehicleNoteActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    const note = await addVehicleNote(auth.organizationId, vehicleId, {
      category: input.category,
      content: input.content,
      authorId: auth.profileId,
      authorName: auth.name,
    });
    revalidatePath(`/vehicles/${vehicleId}`);
    return { ok: true, note };
  } catch (e) {
    if (e instanceof VehicleValidationError) {
      return { ok: false, error: e.message };
    }
    console.error("Falha ao adicionar nota à viatura", e);
    return { ok: false, error: "Não foi possível registar a nota no passaporte." };
  }
}

export async function deleteVehicleNoteAction(
  vehicleId: string,
  noteId: string
): Promise<DeleteVehicleNoteActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    await deleteVehicleNote(auth.organizationId, vehicleId, noteId);
    revalidatePath(`/vehicles/${vehicleId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof VehicleValidationError) {
      return { ok: false, error: e.message };
    }
    console.error("Falha ao eliminar nota da viatura", e);
    return { ok: false, error: "Não foi possível eliminar a nota do passaporte." };
  }
}
