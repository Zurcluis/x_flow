import { SimulatorView } from "./SimulatorView";
import { listVehicles, listVehicleFrontCovers } from "@/server/vehicles";
import { listFilms } from "@/server/films";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const [vehicles, coverPhotos, films] = await Promise.all([
    listVehicles(auth.organizationId),
    listVehicleFrontCovers(auth.organizationId),
    listFilms(auth.organizationId),
  ]);

  return (
    <SimulatorView
      vehicles={vehicles}
      coverPhotos={coverPhotos}
      films={films}
    />
  );
}
