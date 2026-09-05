import { StockView } from "./StockView";
import { listMaterials } from "@/server/materials";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const organizationId = await getPrimaryOrganizationId();
  const materials = await listMaterials(organizationId);

  return <StockView initialMaterials={materials} />;
}
