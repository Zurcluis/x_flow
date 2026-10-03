import { requireAuth } from "@/server/auth";
import { VehiclePassportStandaloneView } from "./VehiclePassportStandaloneView";

export const dynamic = "force-dynamic";

export default async function VehiclePassportPublicPage() {
  await requireAuth();

  return <VehiclePassportStandaloneView />;
}
