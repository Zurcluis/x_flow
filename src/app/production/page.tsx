import { ProductionView } from "./ProductionView";
import { listWorkOrders } from "@/server/production";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const organizationId = await getPrimaryOrganizationId();
  const workOrders = await listWorkOrders(organizationId);

  return <ProductionView initialWorkOrders={workOrders} />;
}
