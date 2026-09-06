import { NewQuoteView } from "./NewQuoteView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const organizationId = await getPrimaryOrganizationId();
  const [vehicles, customers] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
  ]);

  const vehicleParam = typeof sp.vehicle === "string" ? sp.vehicle : undefined;
  const finishParam = typeof sp.finish === "string" ? sp.finish : undefined;
  const coverageParam = typeof sp.coverage === "string" ? sp.coverage : undefined;

  return (
    <NewQuoteView
      vehicles={vehicles}
      customers={customers}
      initialVehicleId={vehicleParam}
      simRef={
        finishParam
          ? {
              finish: finishParam,
              coverageLabel:
                coverageParam === "exterior"
                  ? "Exterior"
                  : coverageParam === "integral"
                  ? "Integral"
                  : "Estendida",
            }
          : null
      }
    />
  );
}
