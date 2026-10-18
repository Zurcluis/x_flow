import { CustomersView } from "./CustomersView";
import { listCustomers } from "@/server/customers";
import { requireRole } from "@/server/auth";
import { canSeeFinancials, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const showFinancials = canSeeFinancials(auth.role);
  const customers = await listCustomers(auth.organizationId, {
    includeFinancials: showFinancials,
  });

  return <CustomersView initialCustomers={customers} showFinancials={showFinancials} />;
}
