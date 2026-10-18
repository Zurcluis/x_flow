import { notFound } from "next/navigation";
import { VehiclePassportView } from "./VehiclePassportView";
import { getVehiclePassport } from "@/server/vehicles";
import { requireRole } from "@/server/auth";
import { canSeeFinancials, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function VehiclePassportPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { vehicleId } = await params;
  const vehicle = await getVehiclePassport(auth.organizationId, vehicleId, {
    includeFinancials: canSeeFinancials(auth.role),
  });

  if (!vehicle) notFound();

  return <VehiclePassportView vehicle={vehicle} />;
}
