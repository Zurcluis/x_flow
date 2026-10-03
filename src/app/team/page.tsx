import { TeamView } from "./TeamView";
import { listTeam } from "@/server/team";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const team = await listTeam(organizationId);

  return <TeamView initialTeam={team} />;
}
