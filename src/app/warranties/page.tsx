import { WarrantiesView } from "./WarrantiesView";
import { listWarranties } from "@/server/finance";
import { listWorkOrders } from "@/server/production";
import { getPrimaryOrganizationId } from "@/server/org";
import { WarrantyRecord } from "./WarrantiesView";

export const dynamic = "force-dynamic";

export default async function WarrantiesPage() {
  const organizationId = await getPrimaryOrganizationId();
  const [warranties, workOrders] = await Promise.all([
    listWarranties(organizationId),
    listWorkOrders(organizationId),
  ]);

  const records: WarrantyRecord[] = warranties.map((w) => {
    const wo = workOrders.find((o) => o.id === w.workOrderId);
    return {
      id: w.id,
      vehiclePlate: w.vehiclePlate,
      vehicleModel: w.vehicleModel,
      customerName: w.customerName,
      serviceName: wo?.serviceTitle ?? "Serviço X-Motion",
      materialUsed: w.materialName,
      batchNumber: w.batchNumber,
      yearsWarranty: w.warrantyYears,
      certificateNumber: w.certificateNumber,
      issuedAt: w.startsAt,
      expiresAt: w.expiresAt,
      status: w.status === "active" ? "active" : w.status === "expired" ? "expired" : "active",
    };
  });

  return <WarrantiesView initialWarranties={records} />;
}
