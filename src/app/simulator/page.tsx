import { SimulatorView } from "./SimulatorView";
import { listVehicles } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const organizationId = await getPrimaryOrganizationId();
  const vehicles = await listVehicles(organizationId);

  return <SimulatorView vehicles={vehicles} />;
}
