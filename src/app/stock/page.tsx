import { StockView } from "./StockView";
import {
  listMaterialRemnants,
  listMaterials,
  listPurchaseOrders,
} from "@/server/materials";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const [materials, remnants, purchaseOrders] = await Promise.all([
    listMaterials(auth.organizationId),
    listMaterialRemnants(auth.organizationId),
    listPurchaseOrders(auth.organizationId),
  ]);

  return (
    <StockView
      initialMaterials={materials}
      initialRemnants={remnants}
      initialPurchaseOrders={purchaseOrders}
    />
  );
}
