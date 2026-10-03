import { ToolsView } from "./ToolsView";
import { listTools } from "@/server/team";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const tools = await listTools(organizationId);

  return <ToolsView initialTools={tools} />;
}
