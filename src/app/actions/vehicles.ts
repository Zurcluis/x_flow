"use server";

import { revalidatePath } from "next/cache";
import { Vehicle } from "@/domains/vehicles/types";
import { createVehicle, VehicleCreateInput } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export type VehicleActionResult =
  | { ok: true; vehicle: Vehicle }
  | { ok: false; error: string };

export async function createVehicleAction(
  input: Partial<Vehicle> & { customerId?: string }
): Promise<VehicleActionResult> {
  try {
    if (!input.plateDisplay?.trim()) {
      return { ok: false, error: "A matrícula é obrigatória." };
    }
    if (!input.make?.trim() || !input.model?.trim()) {
      return { ok: false, error: "Marca e modelo são obrigatórios." };
    }

    const organizationId = await getPrimaryOrganizationId();
    const createInput: VehicleCreateInput = {
      plateDisplay: input.plateDisplay.trim().toUpperCase(),
      plateNormalized: (input.plateNormalized ?? input.plateDisplay).replace(/[\s-]/g, "").toUpperCase(),
      make: input.make.trim(),
      model: input.model.trim(),
      generationYear: input.generationYear ?? new Date().getFullYear(),
      bodyType: input.bodyType ?? "sedan",
      originalColorName: input.originalColorName?.trim() ?? "Por identificar",
      originalColorFamily: input.originalColorFamily ?? "other",
      vin: input.vin,
      currentMileage: input.currentMileage,
      notes: input.notes,
      customerId: input.customerId ?? input.currentOwner?.customerId,
    };

    const vehicle = await createVehicle(organizationId, createInput);
    revalidatePath("/vehicles");
    return { ok: true, vehicle };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado ao criar a viatura.";
    if (message.includes("vehicles_org_plate_unique") || message.includes("duplicate key")) {
      return { ok: false, error: "Já existe uma viatura com essa matrícula." };
    }
    return { ok: false, error: message };
  }
}
