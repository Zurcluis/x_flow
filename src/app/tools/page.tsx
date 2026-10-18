import { ToolsView } from "./ToolsView";
import { listTools } from "@/server/team";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const tools = await listTools(auth.organizationId);

  return <ToolsView initialTools={tools} />;
}
