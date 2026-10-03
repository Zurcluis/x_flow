import { NewCheckinView } from "./NewCheckinView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function NewCheckinPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, customers] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
  ]);

  return <NewCheckinView vehicles={vehicles} customers={customers} />;
}
