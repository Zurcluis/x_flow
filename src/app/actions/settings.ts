"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  type OrganizationSettings,
} from "@/server/settings";

export async function getOrganizationSettingsAction(): Promise<OrganizationSettings> {
  const auth = await requireRole(["admin", "workshop_manager"]);
  return getOrganizationSettings(auth.organizationId);
}

export async function updateOrganizationSettingsAction(
  data: Partial<OrganizationSettings>
): Promise<{ ok: boolean; settings?: OrganizationSettings; error?: string }> {
  try {
    const auth = await requireRole(["admin"]);
    const settings = await updateOrganizationSettings(auth.organizationId, data);
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { ok: true, settings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao guardar configurações";
    return { ok: false, error: message };
  }
}
