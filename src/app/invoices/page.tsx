import { InvoicesView } from "./InvoicesView";
import { listInvoices } from "@/server/finance";
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const invoices = await listInvoices(auth.organizationId);

  return <InvoicesView initialInvoices={invoices} />;
}
