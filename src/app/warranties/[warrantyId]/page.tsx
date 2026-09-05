import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarrantyDetailView } from "./WarrantyDetailView";
import { getWarrantyById } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ warrantyId: string }>;
}) {
  const { warrantyId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const warranty = await getWarrantyById(organizationId, warrantyId);

  if (!warranty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Garantia não encontrada</h2>
        <Link href="/warranties">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar a Garantias</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <WarrantyDetailView warranty={warranty} />;
}
