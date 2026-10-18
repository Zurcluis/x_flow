import { notFound } from "next/navigation";
import { InvoiceDetailView } from "./InvoiceDetailView";
import { getInvoiceById } from "@/server/finance";
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const auth = await requireRole(FINANCIAL_ROLES);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(auth.organizationId, invoiceId);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailView invoice={invoice} />;
}
