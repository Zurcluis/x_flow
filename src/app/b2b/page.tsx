import { B2BPortalView } from "./B2BPortalView";
import { listB2BAccounts } from "@/server/b2b";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function B2BPortalPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const accounts = await listB2BAccounts(organizationId);

  return <B2BPortalView initialAccounts={accounts} />;
}
