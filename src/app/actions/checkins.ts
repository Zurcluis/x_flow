"use server";

import { revalidatePath } from "next/cache";
import { createCheckin, CreateCheckinInput } from "@/server/checkins";
import { getPrimaryOrganizationId } from "@/server/org";

export async function createCheckinAction(
  input: CreateCheckinInput
): Promise<
  | { ok: true; checkinId: string; token: string }
  | { ok: false; error: string }
> {
  try {
    const organizationId = await getPrimaryOrganizationId();
    const checkin = await createCheckin(organizationId, input);
    revalidatePath("/checkins");
    revalidatePath("/");
    return { ok: true, checkinId: checkin.id, token: checkin.token };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao criar o check-in.",
    };
  }
}
