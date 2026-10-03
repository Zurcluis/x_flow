import { VehiclesView } from "./VehiclesView";
import { listVehicles, listVehicleFrontCovers } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";
import { listCustomers } from "@/server/customers";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, customers, coverPhotos] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
    listVehicleFrontCovers(organizationId),
  ]);

  return (
    <VehiclesView
      initialVehicles={vehicles}
      customers={customers}
      coverPhotos={coverPhotos}
    />
  );
}
