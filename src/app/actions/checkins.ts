"use server";

import { revalidatePath } from "next/cache";
import {
  CheckinValidationError,
  createCheckin,
  CreateCheckinInput,
} from "@/server/checkins";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export async function createCheckinAction(
  input: CreateCheckinInput
): Promise<
  | { ok: true; checkinId: string; token: string }
  | { ok: false; error: string }
> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    const checkin = await createCheckin(auth.organizationId, input, auth.profileId);
    revalidatePath("/checkins");
    revalidatePath("/");
    return { ok: true, checkinId: checkin.id, token: checkin.token };
  } catch (e) {
    if (e instanceof CheckinValidationError) {
      return { ok: false, error: e.message };
    }
    console.error("Falha ao criar check-in", e);
    return { ok: false, error: "Não foi possível guardar o check-in. Tenta novamente." };
  }
}
