import { NewCheckinView } from "./NewCheckinView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function NewCheckinPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const [vehicles, customers] = await Promise.all([
    listVehicles(auth.organizationId),
    listCustomers(auth.organizationId),
  ]);

  return <NewCheckinView vehicles={vehicles} customers={customers} />;
}
