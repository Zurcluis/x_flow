import { FinanceView } from "./FinanceView";
import { requireAuth } from "@/server/auth";
import { getPrimaryOrganizationId } from "@/server/org";
import { listInvoices } from "@/server/finance";
import {
  ensureDefaultCategories,
  generateDueRecurring,
  getTreasurySummary,
  listRecurringRules,
  listTransactions,
} from "@/server/treasury";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  await ensureDefaultCategories(organizationId);
  const generated = await generateDueRecurring(organizationId);
  const summary = await getTreasurySummary(organizationId);
  const transactions = await listTransactions(organizationId, {});
  const recurring = await listRecurringRules(organizationId);
  const invoices = await listInvoices(organizationId);

  return (
    <FinanceView
      summary={summary}
      recentTransactions={transactions.slice(0, 10)}
      recurring={recurring}
      invoices={invoices}
      generatedCount={generated}
    />
  );
}
