import { ToolsView } from "./ToolsView";
import { listTools } from "@/server/team";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const organizationId = await getPrimaryOrganizationId();
  const tools = await listTools(organizationId);

  return <ToolsView initialTools={tools} />;
}
