import { MANAGEMENT_ROLES } from "@/lib/roles";
import { isGeminiConfigured } from "@/server/ai/gemini";
import { requireRole } from "@/server/auth";
import { listCustomers } from "@/server/customers";
import {
  getInboxSummaryCounts,
  getInboxThreadWithMessages,
  listCustomerShareableQuotes,
  listInboxChannelAccounts,
  listInboxThreads,
} from "@/server/inbox/repository";
import { listWebsiteLeads } from "@/server/website-leads";
import { InboxView } from "./InboxView";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireRole(MANAGEMENT_ROLES);
  const sp = await searchParams;
  const requestedThreadId = typeof sp.thread === "string" ? sp.thread : undefined;

  const [accounts, threads, counts, customers, websiteLeads] = await Promise.all([
    listInboxChannelAccounts(auth.organizationId),
    listInboxThreads(auth.organizationId, { limit: 150 }),
    getInboxSummaryCounts(auth.organizationId),
    listCustomers(auth.organizationId, { includeFinancials: false }),
    listWebsiteLeads(auth.organizationId),
  ]);

  const initialThreadId =
    (requestedThreadId && threads.some((t) => t.id === requestedThreadId)
      ? requestedThreadId
      : threads[0]?.id) ?? null;

  const initialDetail = initialThreadId
    ? await getInboxThreadWithMessages(auth.organizationId, initialThreadId)
    : null;

  const initialShareableQuotes = initialDetail?.thread.linkedCustomerId
    ? await listCustomerShareableQuotes(
        auth.organizationId,
        initialDetail.thread.linkedCustomerId
      )
    : [];

  const newWebsiteLeadsCount = websiteLeads.filter((l) => l.status === "new").length;
  const nowDate = new Date();
  const renderedAt = nowDate.toISOString();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const aiEnabled = isGeminiConfigured();
  const autoSyncNeeded =
    accounts.length === 0 ||
    accounts.some(
      (acc) =>
        acc.status === "active" &&
        (!acc.lastSyncedAt || nowDate.getTime() - Date.parse(acc.lastSyncedAt) > 2 * 60 * 1000)
    );

  return (
    <InboxView
      initialAccounts={accounts}
      initialThreads={threads}
      initialCounts={counts}
      initialCustomers={customers}
      initialDetail={initialDetail}
      initialShareableQuotes={initialShareableQuotes}
      appBaseUrl={appBaseUrl}
      aiEnabled={aiEnabled}
      autoSyncNeeded={autoSyncNeeded}
      newWebsiteLeadsCount={newWebsiteLeadsCount}
      renderedAt={renderedAt}
    />
  );
}
