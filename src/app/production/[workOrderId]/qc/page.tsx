import { requireAuth } from "@/server/auth";
import { QcInspectionView } from "./QcInspectionView";

export const dynamic = "force-dynamic";

export default async function QualityControlPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  await requireAuth();
  const { workOrderId } = await params;

  return <QcInspectionView workOrderId={workOrderId} />;
}
