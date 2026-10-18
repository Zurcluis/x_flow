import { VehiclesView } from "./VehiclesView";
import { listVehicles, listVehicleFrontCovers } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const [vehicles, customers, coverPhotos] = await Promise.all([
    listVehicles(auth.organizationId),
    listCustomers(auth.organizationId),
    listVehicleFrontCovers(auth.organizationId),
  ]);

  return (
    <VehiclesView
      initialVehicles={vehicles}
      customers={customers}
      coverPhotos={coverPhotos}
    />
  );
}
