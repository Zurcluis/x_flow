import { RecurringView } from "./RecurringView";
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
import {
  ensureDefaultCategories,
  listCategories,
  listRecurringRules,
} from "@/server/treasury";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const organizationId = auth.organizationId;
  await ensureDefaultCategories(organizationId);
  const rules = await listRecurringRules(organizationId);
  const categories = await listCategories(organizationId);

  return <RecurringView rules={rules} categories={categories} />;
}
