import { StockView } from "./StockView";
import { listMaterials } from "@/server/materials";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const materials = await listMaterials(auth.organizationId);

  return <StockView initialMaterials={materials} />;
}
