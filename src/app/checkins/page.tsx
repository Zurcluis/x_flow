import { CheckinsView } from "./CheckinsView";
import { listCheckins } from "@/server/checkins";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function CheckinsPage() {
  const organizationId = await getPrimaryOrganizationId();
  const checkins = await listCheckins(organizationId);

  return <CheckinsView initialCheckins={checkins} />;
}
