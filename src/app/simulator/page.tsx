import { SimulatorView } from "./SimulatorView";
import { listVehicles, listVehicleFrontCovers } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, coverPhotos] = await Promise.all([
    listVehicles(organizationId),
    listVehicleFrontCovers(organizationId),
  ]);

  return <SimulatorView vehicles={vehicles} coverPhotos={coverPhotos} />;
}
