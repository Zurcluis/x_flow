"use server";

import { revalidatePath } from "next/cache";
import { createCheckin, CreateCheckinInput } from "@/server/checkins";
import { requireAuth } from "@/server/auth";

export async function createCheckinAction(
  input: CreateCheckinInput
): Promise<
  | { ok: true; checkinId: string; token: string }
  | { ok: false; error: string }
> {
  const auth = await requireAuth();
  try {
    const organizationId = auth.organizationId;
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
