import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
import { loadPricingContext } from "@/server/pricing";
import { PricingSettingsView } from "./PricingSettingsView";

export const dynamic = "force-dynamic";

export default async function PricingSettingsPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const context = await loadPricingContext(auth.organizationId);

  return <PricingSettingsView context={context} />;
}
