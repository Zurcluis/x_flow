import { B2BPortalView } from "./B2BPortalView";
import { listB2BAccounts } from "@/server/b2b";
import { requireRole } from "@/server/auth";
import { MANAGEMENT_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function B2BPortalPage() {
  const auth = await requireRole(MANAGEMENT_ROLES);
  const accounts = await listB2BAccounts(auth.organizationId);

  return <B2BPortalView initialAccounts={accounts} />;
}
