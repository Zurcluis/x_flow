import { SimulatorView } from "./SimulatorView";
import { listVehicles, listVehicleFrontCovers } from "@/server/vehicles";
import { listFilms } from "@/server/films";
import { getPrimaryOrganizationId } from "@/server/org";
import { initialFinishPresets } from "@/lib/demo-data/vision-simulation-data";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, coverPhotos, films] = await Promise.all([
    listVehicles(organizationId),
    listVehicleFrontCovers(organizationId),
    listFilms(organizationId),
  ]);

  return (
    <SimulatorView
      vehicles={vehicles}
      coverPhotos={coverPhotos}
      films={films.length > 0 ? films : initialFinishPresets}
    />
  );
}
