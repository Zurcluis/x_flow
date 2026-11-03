import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { getOrCreateQcInspection, getWorkOrderDetail } from "@/server/production";
import { QcInspectionView } from "./QcInspectionView";

export const dynamic = "force-dynamic";

export default async function QualityControlPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { workOrderId } = await params;
  const detail = await getWorkOrderDetail(auth.organizationId, workOrderId);
  if (!detail) notFound();

  const initialInspection = await getOrCreateQcInspection(
    auth.organizationId,
    workOrderId,
    auth.name
  );

  return (
    <QcInspectionView
      workOrder={detail.workOrder}
      inspectorName={auth.name}
      initialInspection={initialInspection}
    />
  );
}
