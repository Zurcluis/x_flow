import { MyDayView } from "./MyDayView";
import { getMyDayData } from "@/server/myday";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function MyDayPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const data = await getMyDayData(
    auth.organizationId,
    auth.profileId,
    auth.name
  );

  return <MyDayView data={data} />;
}
