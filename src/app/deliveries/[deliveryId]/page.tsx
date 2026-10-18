import { notFound } from "next/navigation";
import { DeliveryDetailView } from "./DeliveryDetailView";
import { getDeliveryById } from "@/server/deliveries";
import { getInvoiceByWorkOrderId } from "@/server/finance";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { deliveryId } = await params;
  const delivery = await getDeliveryById(auth.organizationId, deliveryId);

  if (!delivery) {
    notFound();
  }

  const linkedInvoice = delivery.workOrderId
    ? await getInvoiceByWorkOrderId(auth.organizationId, delivery.workOrderId)
    : null;

  return <DeliveryDetailView delivery={delivery} linkedInvoice={linkedInvoice} />;
}
