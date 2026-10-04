import { NewQuoteView } from "./NewQuoteView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";
import { loadPricingContext } from "@/server/pricing";
import { loadDraftQuote } from "@/server/quotes";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const organizationId = await getPrimaryOrganizationId();
  const draftParam = typeof sp.draft === "string" ? sp.draft : undefined;
  const [vehicles, customers, pricingContext, draftQuote] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
    loadPricingContext(organizationId),
    draftParam ? loadDraftQuote(organizationId, draftParam) : Promise.resolve(null),
  ]);

  const vehicleParam = typeof sp.vehicle === "string" ? sp.vehicle : undefined;
  const finishParam = typeof sp.finish === "string" ? sp.finish : undefined;
  const coverageParam = typeof sp.coverage === "string" ? sp.coverage : undefined;

  return (
    <NewQuoteView
      vehicles={vehicles}
      customers={customers}
      pricingContext={pricingContext}
      initialVehicleId={vehicleParam}
      draftQuote={draftQuote}
      draftRequested={Boolean(draftParam)}
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
