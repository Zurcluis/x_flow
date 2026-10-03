import { InvoicesView } from "./InvoicesView";
import { listInvoices } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const invoices = await listInvoices(organizationId);

  return <InvoicesView initialInvoices={invoices} />;
}
