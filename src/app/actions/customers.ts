"use server";

import { revalidatePath } from "next/cache";
import { Customer, CustomerDraft } from "@/domains/crm/types";
import { createCustomer, CustomerValidationError } from "@/server/customers";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export type ActionResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

export async function createCustomerAction(
  input: CustomerDraft
): Promise<ActionResult> {
  const auth = await requireRole(SCHEDULING_ROLES);
  try {
    const customer = await createCustomer(auth.organizationId, {
      type: input.type ?? "individual",
      name: input.name ?? "",
      legalName: input.legalName,
      nif: input.nif,
      email: input.email ?? "",
      phone: input.phone ?? "",
      phoneNormalized: input.phoneNormalized ?? input.phone ?? "",
      preferredChannel: input.preferredChannel,
      notes: input.notes,
      status: input.status ?? "active",
      b2bDetails:
        input.type === "business" && input.b2bDetails
          ? {
              discountRate: input.b2bDetails.discountRate ?? 0,
              paymentTermsDays: input.b2bDetails.paymentTermsDays ?? 30,
              priorityLevel: input.b2bDetails.priorityLevel ?? "standard",
              commercialNotes: input.b2bDetails.commercialNotes,
            }
          : undefined,
    });

    revalidatePath("/customers");
    return { ok: true, customer };
  } catch (e) {
    if (e instanceof CustomerValidationError) {
      return { ok: false, error: e.message };
    }
    console.error("Falha ao criar cliente", e);
    return { ok: false, error: "Não foi possível guardar o cliente. Tenta novamente." };
  }
}
