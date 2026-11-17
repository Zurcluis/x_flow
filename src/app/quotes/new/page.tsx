import { NewQuoteView } from "./NewQuoteView";
import { listVehicles } from "@/server/vehicles";
import { listCustomers } from "@/server/customers";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { loadPricingContext } from "@/server/pricing";
import { loadDraftQuote } from "@/server/quotes";
import { decodeQuickCalculatorPrefill } from "@/domains/pricing/quick-calculator";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const sp = await searchParams;
  const organizationId = auth.organizationId;
  const draftParam = typeof sp.draft === "string" ? sp.draft : undefined;
  const calcParam = typeof sp.calc === "string" ? sp.calc : undefined;
  const calculatorPrefill = calcParam
    ? decodeQuickCalculatorPrefill(calcParam)
    : null;
  const [vehicles, customers, pricingContext, draftQuote] = await Promise.all([
    listVehicles(organizationId),
    listCustomers(organizationId),
    loadPricingContext(organizationId),
    draftParam ? loadDraftQuote(organizationId, draftParam) : Promise.resolve(null),
  ]);

  const vehicleParam = typeof sp.vehicle === "string" ? sp.vehicle : undefined;
  const customerParam = typeof sp.customer === "string" ? sp.customer : undefined;
  const finishParam = typeof sp.finish === "string" ? sp.finish : undefined;
  const coverageParam = typeof sp.coverage === "string" ? sp.coverage : undefined;

  return (
    <NewQuoteView
      vehicles={vehicles}
      customers={customers}
      pricingContext={pricingContext}
      initialVehicleId={vehicleParam}
      initialCustomerId={customerParam}
      draftQuote={draftQuote}
      draftRequested={Boolean(draftParam)}
      calculatorPrefill={calculatorPrefill}
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
