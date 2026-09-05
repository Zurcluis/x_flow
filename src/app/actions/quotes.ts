"use server";

import { revalidatePath } from "next/cache";
import { getPrimaryOrganizationId } from "@/server/org";
import { approveQuote } from "@/server/quotes";
import { getDb } from "@/lib/db";

export type ApproveQuoteResult =
  | { ok: true; workOrderId: string }
  | { ok: false; error: string };

export async function approveQuoteAction(
  quoteId: string,
  selectedOptionId?: string
): Promise<ApproveQuoteResult> {
  const organizationId = await getPrimaryOrganizationId();
  const result = await approveQuote(organizationId, quoteId);
  if (result.ok && selectedOptionId) {
    await getDb().query(
      `UPDATE quotes SET selected_option_id = $1, updated_at = NOW() WHERE id = $2`,
      [selectedOptionId, quoteId]
    );
  }
  if (result.ok) {
    revalidatePath("/quotes");
    revalidatePath("/production");
    revalidatePath(`/quotes/${quoteId}`);
  }
  return result;
}
