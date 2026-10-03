import { CustomersView } from "./CustomersView";
import { getPrimaryOrganizationId, listCustomers } from "@/server/customers";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const customers = await listCustomers(organizationId);

  return <CustomersView initialCustomers={customers} />;
}
