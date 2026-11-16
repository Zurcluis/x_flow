"use server";

import { revalidatePath } from "next/cache";
import { CustomerValidationError } from "@/domains/crm/validation";
import type { Customer } from "@/domains/crm/types";
import type {
  InboxCategory,
  InboxChannelAccount,
  InboxMessageRecord,
  InboxShareableQuote,
  InboxSyncReport,
  InboxThreadRecord,
  InboxThreadStatus,
} from "@/domains/inbox/types";
import { MANAGEMENT_ROLES } from "@/lib/roles";
import { requireRole } from "@/server/auth";
import {
  convertInboxThreadToCustomer,
  getInboxSummaryCounts,
  getInboxThreadWithMessages,
  linkInboxThreadToCustomer,
  listCustomerShareableQuotes,
  listInboxChannelAccounts,
  listInboxThreads,
  updateInboxThreadMetadata,
  type InboxSummaryCounts,
} from "@/server/inbox/repository";
import {
  analyzeInboxThreadWithAi,
  draftInboxReplyWithAi,
  enrichUnprocessedInboxThreads,
} from "@/server/inbox/ai";
import { sendInboxReply } from "@/server/inbox/send";
import { syncOrganizationInbox } from "@/server/inbox/sync";

export async function syncInboxAction(): Promise<
  | {
      ok: true;
      report: InboxSyncReport;
      accounts: InboxChannelAccount[];
      threads: InboxThreadRecord[];
      counts: InboxSummaryCounts;
    }
  | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const report = await syncOrganizationInbox(auth.organizationId);
    await enrichUnprocessedInboxThreads(auth.organizationId, { limit: 3 }).catch(() => 0);
    const [accounts, threads, counts] = await Promise.all([
      listInboxChannelAccounts(auth.organizationId),
      listInboxThreads(auth.organizationId, { limit: 150 }),
      getInboxSummaryCounts(auth.organizationId),
    ]);

    revalidatePath("/inbox");
    return { ok: true, report, accounts, threads, counts };
  } catch (error) {
    console.error("[inbox] falha ao sincronizar:", error);
    return { ok: false, error: "Não foi possível sincronizar as mensagens neste momento." };
  }
}

export async function getInboxThreadDetailAction(threadId: string): Promise<
  | {
      ok: true;
      thread: InboxThreadRecord;
      messages: InboxMessageRecord[];
      shareableQuotes: InboxShareableQuote[];
    }
  | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const detail = await getInboxThreadWithMessages(auth.organizationId, threadId);
    if (!detail) {
      return { ok: false, error: "Conversa não encontrada." };
    }
    const shareableQuotes = detail.thread.linkedCustomerId
      ? await listCustomerShareableQuotes(auth.organizationId, detail.thread.linkedCustomerId)
      : [];
    return {
      ok: true,
      thread: detail.thread,
      messages: detail.messages,
      shareableQuotes,
    };
  } catch (error) {
    console.error("[inbox] falha ao abrir conversa:", error);
    return { ok: false, error: "Não foi possível carregar as mensagens desta conversa." };
  }
}

export async function listCustomerShareableQuotesAction(
  customerId: string
): Promise<InboxShareableQuote[]> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    return await listCustomerShareableQuotes(auth.organizationId, customerId);
  } catch {
    return [];
  }
}

export async function sendInboxReplyAction(input: {
  threadId: string;
  text: string;
  confirmed: boolean;
}): Promise<
  | {
      ok: true;
      thread: InboxThreadRecord;
      message: InboxMessageRecord;
      counts: InboxSummaryCounts;
    }
  | { ok: false; error: string; windowClosed?: boolean }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const outcome = await sendInboxReply({
      organizationId: auth.organizationId,
      profileId: auth.profileId,
      threadId: input.threadId,
      text: input.text,
      confirmed: input.confirmed,
    });

    if (!outcome.ok) {
      return { ok: false, error: outcome.error, windowClosed: outcome.windowClosed };
    }

    const counts = await getInboxSummaryCounts(auth.organizationId);
    revalidatePath("/inbox");
    if (outcome.thread.linkedCustomerId) {
      revalidatePath(`/customers/${outcome.thread.linkedCustomerId}`);
    }
    return {
      ok: true,
      thread: outcome.thread,
      message: outcome.message,
      counts,
    };
  } catch (error) {
    console.error("[inbox] falha ao enviar resposta:", error);
    return { ok: false, error: "Não foi possível enviar a resposta neste momento." };
  }
}

export async function updateInboxThreadAction(
  threadId: string,
  patch: {
    category?: InboxCategory;
    status?: InboxThreadStatus;
  }
): Promise<{ ok: true; thread: InboxThreadRecord } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const updated = await updateInboxThreadMetadata(auth.organizationId, threadId, patch);
    if (!updated) {
      return { ok: false, error: "Conversa não encontrada." };
    }
    revalidatePath("/inbox");
    return { ok: true, thread: updated };
  } catch (error) {
    if (error instanceof CustomerValidationError) {
      return { ok: false, error: error.message };
    }
    console.error("[inbox] falha ao atualizar conversa:", error);
    return { ok: false, error: "Não foi possível atualizar a conversa." };
  }
}

export async function linkInboxCustomerAction(
  threadId: string,
  customerId: string | null
): Promise<
  | { ok: true; thread: InboxThreadRecord; customer: Customer | null }
  | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const result = await linkInboxThreadToCustomer(auth.organizationId, threadId, customerId);
    revalidatePath("/inbox");
    return { ok: true, thread: result.thread, customer: result.customer };
  } catch (error) {
    if (error instanceof CustomerValidationError) {
      return { ok: false, error: error.message };
    }
    console.error("[inbox] falha ao associar cliente:", error);
    return { ok: false, error: "Não foi possível associar o cliente." };
  }
}

export async function convertInboxThreadToCustomerAction(
  threadId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    instagramHandle?: string;
    notes?: string;
    type?: "individual" | "business";
  }
): Promise<
  | { ok: true; thread: InboxThreadRecord; customer: Customer; reusedExisting: boolean }
  | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const result = await convertInboxThreadToCustomer(auth.organizationId, threadId, input);
    revalidatePath("/inbox");
    revalidatePath("/customers");
    return {
      ok: true,
      thread: result.thread,
      customer: result.customer,
      reusedExisting: result.reusedExisting,
    };
  } catch (error) {
    if (error instanceof CustomerValidationError) {
      return { ok: false, error: error.message };
    }
    console.error("[inbox] falha ao converter conversa em cliente:", error);
    return { ok: false, error: "Não foi possível criar ou associar o cliente." };
  }
}

export async function analyzeInboxThreadAction(
  threadId: string
): Promise<{ ok: true; thread: InboxThreadRecord } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const updated = await analyzeInboxThreadWithAi(auth.organizationId, threadId);
    if (!updated) {
      return { ok: false, error: "A análise IA não está disponível ou não produziu resultado." };
    }
    revalidatePath("/inbox");
    return { ok: true, thread: updated };
  } catch (error) {
    console.error("[inbox] falha ao analisar conversa:", error);
    return { ok: false, error: "Não foi possível analisar esta conversa com IA." };
  }
}

export async function suggestInboxReplyAction(
  threadId: string
): Promise<{ ok: true; draftText: string } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const detail = await getInboxThreadWithMessages(auth.organizationId, threadId);
    if (!detail) {
      return { ok: false, error: "Conversa não encontrada." };
    }
    return await draftInboxReplyWithAi({
      organizationId: auth.organizationId,
      threadId,
      customerName: detail.thread.participantName,
    });
  } catch (error) {
    console.error("[inbox] falha ao sugerir resposta:", error);
    return { ok: false, error: "Não foi possível gerar uma sugestão de resposta." };
  }
}
