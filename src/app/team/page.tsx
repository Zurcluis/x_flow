import { TeamView } from "./TeamView";
import { listTeam } from "@/server/team";
import { requireRole } from "@/server/auth";
import { hasRole, MANAGEMENT_ROLES, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const team = await listTeam(auth.organizationId);

  return (
    <TeamView
      initialTeam={team}
      canManage={hasRole(auth.role, MANAGEMENT_ROLES)}
    />
  );
}
