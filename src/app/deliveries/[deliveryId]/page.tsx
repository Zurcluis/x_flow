import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryDetailView } from "./DeliveryDetailView";
import { getDeliveryById } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const delivery = await getDeliveryById(organizationId, deliveryId);

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Entrega não encontrada</h2>
        <Link href="/deliveries">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar a Entregas</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <DeliveryDetailView delivery={delivery} />;
}
