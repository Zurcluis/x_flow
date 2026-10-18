import { FinanceView } from "./FinanceView";
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
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
  const auth = await requireRole(FINANCIAL_ROLES);
  const organizationId = auth.organizationId;
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
