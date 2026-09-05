import { NewQuoteView } from "./NewQuoteView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, customers] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
  ]);

  return <NewQuoteView vehicles={vehicles} customers={customers} />;
}
