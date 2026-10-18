import { CheckinsView } from "./CheckinsView";
import { listCheckins } from "@/server/checkins";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function CheckinsPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const checkins = await listCheckins(auth.organizationId);

  return <CheckinsView initialCheckins={checkins} />;
}
