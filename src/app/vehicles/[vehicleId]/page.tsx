import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclePassportView } from "./VehiclePassportView";
import { getVehiclePassport } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function VehiclePassportPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const vehicle = await getVehiclePassport(organizationId, vehicleId);

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Viatura não encontrada</h2>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à lista de viaturas</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <VehiclePassportView vehicle={vehicle} />;
}
