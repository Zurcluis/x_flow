import { DeliveriesView } from "./DeliveriesView";
import { listDeliveries } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const organizationId = await getPrimaryOrganizationId();
  const deliveries = await listDeliveries(organizationId);

  return <DeliveriesView initialDeliveries={deliveries} />;
}
