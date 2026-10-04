import { requireAuth } from "@/server/auth";
import { getPrimaryOrganizationId } from "@/server/org";
import { loadPricingContext } from "@/server/pricing";
import { PricingSettingsView } from "./PricingSettingsView";

export const dynamic = "force-dynamic";

export default async function PricingSettingsPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const context = await loadPricingContext(organizationId);

  return <PricingSettingsView context={context} />;
}
