import { RecurringView } from "./RecurringView";
import { requireAuth } from "@/server/auth";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  ensureDefaultCategories,
  listCategories,
  listRecurringRules,
} from "@/server/treasury";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  await ensureDefaultCategories(organizationId);
  const rules = await listRecurringRules(organizationId);
  const categories = await listCategories(organizationId);

  return <RecurringView rules={rules} categories={categories} />;
}
