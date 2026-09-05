import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDetailView } from "./CustomerDetailView";
import { getCustomerById, listCustomers } from "@/server/customers";
import { listVehicles } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const [customer, vehicles, allCustomers] = await Promise.all([
    getCustomerById(organizationId, customerId),
    listVehicles(organizationId),
    listCustomers(organizationId),
  ]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Cliente não encontrado</h2>
        <Link href="/customers">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à lista de clientes</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <CustomerDetailView customer={customer} vehicles={vehicles} customers={allCustomers} />
  );
}
