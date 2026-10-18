import { DeliveriesView } from "./DeliveriesView";
import { listDeliveries } from "@/server/deliveries";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const deliveries = await listDeliveries(auth.organizationId);

  return <DeliveriesView initialDeliveries={deliveries} />;
}
