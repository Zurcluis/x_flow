import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetailView } from "./InvoiceDetailView";
import { getInvoiceById } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const invoice = await getInvoiceById(organizationId, invoiceId);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Fatura não encontrada</h2>
        <Link href="/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar a Faturação</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <InvoiceDetailView invoice={invoice} />;
}
