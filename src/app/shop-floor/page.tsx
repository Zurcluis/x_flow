import { ShopFloorView } from "./ShopFloorView";
import { getShopFloorData } from "@/server/shopfloor";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ShopFloorPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const data = await getShopFloorData(organizationId);

  return <ShopFloorView data={data} />;
}
