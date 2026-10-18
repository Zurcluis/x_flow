import { ShopFloorView } from "./ShopFloorView";
import { getShopFloorData } from "@/server/shopfloor";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ShopFloorPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const data = await getShopFloorData(auth.organizationId);

  return <ShopFloorView data={data} />;
}
