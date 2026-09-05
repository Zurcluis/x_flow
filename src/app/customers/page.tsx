import { CustomersView } from "./CustomersView";
import { getPrimaryOrganizationId, listCustomers } from "@/server/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const organizationId = await getPrimaryOrganizationId();
  const customers = await listCustomers(organizationId);

  return <CustomersView initialCustomers={customers} />;
}
