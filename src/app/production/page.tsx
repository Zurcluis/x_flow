import { ProductionView } from "./ProductionView";
import { listWorkOrders } from "@/server/production";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const workOrders = await listWorkOrders(auth.organizationId);

  return <ProductionView initialWorkOrders={workOrders} />;
}
