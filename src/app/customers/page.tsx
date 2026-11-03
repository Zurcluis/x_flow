import { CustomersView } from "./CustomersView";
import { listCustomers } from "@/server/customers";
import { listWebsiteLeads } from "@/server/website-leads";
import { requireRole } from "@/server/auth";
import { canSeeFinancials, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const showFinancials = canSeeFinancials(auth.role);
  const [customers, websiteLeads] = await Promise.all([
    listCustomers(auth.organizationId, {
      includeFinancials: showFinancials,
    }),
    listWebsiteLeads(auth.organizationId),
  ]);

  return (
    <CustomersView
      initialCustomers={customers}
      initialWebsiteLeads={websiteLeads}
      showFinancials={showFinancials}
    />
  );
}
