import { ShopFloorView } from "./ShopFloorView";
import { getShopFloorData } from "@/server/shopfloor";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function ShopFloorPage() {
  const organizationId = await getPrimaryOrganizationId();
  const data = await getShopFloorData(organizationId);

  return <ShopFloorView data={data} />;
}
