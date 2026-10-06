import { MovementsView } from "./MovementsView";
import { requireAuth } from "@/server/auth";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  ensureDefaultCategories,
  listBankAccounts,
  listCategories,
  listTransactions,
} from "@/server/treasury";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
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
