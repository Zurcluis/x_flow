import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkOrderDetailView } from "./WorkOrderDetailView";
import { getWorkOrderDetail } from "@/server/production";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const detail = await getWorkOrderDetail(organizationId, workOrderId);

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Ordem de trabalho não encontrada</h2>
        <Link href="/production">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao quadro de produção</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <WorkOrderDetailView
      workOrder={detail.workOrder}
      initialPhases={detail.phases}
      initialTimeEntries={detail.timeEntries}
      materialUsage={detail.materialUsage}
    />
  );
}
