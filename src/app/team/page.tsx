import { TeamView } from "./TeamView";
import { listTeam } from "@/server/team";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const organizationId = await getPrimaryOrganizationId();
  const team = await listTeam(organizationId);

  return <TeamView initialTeam={team} />;
}
