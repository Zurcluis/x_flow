import { notFound } from "next/navigation";
import { CustomerDetailView } from "./CustomerDetailView";
import { getCustomerById, listCustomers } from "@/server/customers";
import { listVehicles } from "@/server/vehicles";
import { requireRole } from "@/server/auth";
import { canSeeFinancials, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { customerId } = await params;
  const showFinancials = canSeeFinancials(auth.role);
  const options = { includeFinancials: showFinancials };
  const [customer, vehicles, allCustomers] = await Promise.all([
    getCustomerById(auth.organizationId, customerId, options),
    listVehicles(auth.organizationId),
    listCustomers(auth.organizationId, options),
  ]);

  if (!customer) notFound();

  return (
    <CustomerDetailView
      customer={customer}
      vehicles={vehicles}
      customers={allCustomers}
      showFinancials={showFinancials}
    />
  );
}
