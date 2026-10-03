import { DeliveriesView } from "./DeliveriesView";
import { listDeliveries } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const deliveries = await listDeliveries(organizationId);

  return <DeliveriesView initialDeliveries={deliveries} />;
}
