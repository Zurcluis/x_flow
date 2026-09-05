import { InvoicesView } from "./InvoicesView";
import { listInvoices } from "@/server/finance";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const organizationId = await getPrimaryOrganizationId();
  const invoices = await listInvoices(organizationId);

  return <InvoicesView initialInvoices={invoices} />;
}
