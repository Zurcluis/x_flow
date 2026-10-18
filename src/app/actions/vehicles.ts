"use server";

import { revalidatePath } from "next/cache";
import { Vehicle } from "@/domains/vehicles/types";
import {
  createVehicle,
  VehicleCreateInput,
  VehicleValidationError,
} from "@/server/vehicles";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export type VehicleActionResult =
  | { ok: true; vehicle: Vehicle }
  | { ok: false; error: string };

export async function createVehicleAction(
  input: Partial<Vehicle> & { customerId?: string }
): Promise<VehicleActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  const customerId = input.customerId ?? input.currentOwner?.customerId;
  try {
    const createInput: VehicleCreateInput = {
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
