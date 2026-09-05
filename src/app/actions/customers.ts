"use server";

import { revalidatePath } from "next/cache";
import { Customer } from "@/domains/crm/types";
import {
  createCustomer,
  getPrimaryOrganizationId,
  CustomerCreateInput,
} from "@/server/customers";

export type ActionResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

export async function createCustomerAction(
  input: Partial<Customer> & { b2bDetails?: CustomerCreateInput["b2bDetails"] }
): Promise<ActionResult> {
  try {
    if (!input.name?.trim()) {
      return { ok: false, error: "O nome do cliente é obrigatório." };
    }
    if (!input.email?.trim() && !input.phone?.trim()) {
      return { ok: false, error: "Introduz pelo menos um contacto (telefone ou email)." };
    }

    const organizationId = await getPrimaryOrganizationId();
    const customer = await createCustomer(organizationId, {
      type: input.type ?? "individual",
      name: input.name.trim(),
      legalName: input.legalName,
      nif: input.nif,
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      phoneNormalized: (input.phoneNormalized ?? input.phone ?? "").replace(/\s/g, ""),
      preferredChannel: input.preferredChannel,
      notes: input.notes,
      status: input.status ?? "active",
      b2bDetails:
        input.type === "business"
          ? {
              discountRate: input.b2bDetails?.discountRate ?? 10,
              paymentTermsDays: input.b2bDetails?.paymentTermsDays ?? 30,
              priorityLevel: input.b2bDetails?.priorityLevel ?? "standard",
              commercialNotes: input.b2bDetails?.commercialNotes,
            }
          : undefined,
    });

    revalidatePath("/customers");
    return { ok: true, customer };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro inesperado ao criar o cliente.",
    };
  }
}
