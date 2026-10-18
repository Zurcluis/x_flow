import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { listVehicles } from "@/server/vehicles";
import { initialVisionAnalyses } from "@/lib/demo-data/vision-simulation-data";
import { VisionAnalysisDetailView } from "./VisionAnalysisDetailView";

export const dynamic = "force-dynamic";

export default async function VisionAnalysisDetailPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { analysisId } = await params;
  const analysis = initialVisionAnalyses.find((item) => item.id === analysisId);
  if (!analysis) notFound();

  const vehicles = await listVehicles(auth.organizationId);
  const normalizedPlate = analysis.vehiclePlate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const vehicleId = vehicles.find(
    (vehicle) => vehicle.plateNormalized === normalizedPlate
  )?.id;

  return (
    <VisionAnalysisDetailView
      initialAnalysis={analysis}
      vehicleId={vehicleId}
    />
  );
}
