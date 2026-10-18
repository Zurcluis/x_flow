import { MovementsView } from "./MovementsView";
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
import {
  ensureDefaultCategories,
  listBankAccounts,
  listCategories,
  listTransactions,
} from "@/server/treasury";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const organizationId = auth.organizationId;
  await ensureDefaultCategories(organizationId);
  const transactions = await listTransactions(organizationId, {});
  const categories = await listCategories(organizationId);
  const accounts = await listBankAccounts(organizationId);

  return (
    <MovementsView
      initialTransactions={transactions}
      categories={categories}
      accounts={accounts}
    />
  );
}
