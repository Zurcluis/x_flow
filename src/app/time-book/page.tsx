import { TimeBookView } from "./TimeBookView";
import { listTimeBookBenchmarks } from "@/server/timebook";
import { getPrimaryOrganizationId } from "@/server/org";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function TimeBookPage() {
  await requireAuth();
  const organizationId = await getPrimaryOrganizationId();
  const models = await listTimeBookBenchmarks(organizationId);

  return <TimeBookView initialModels={models} />;
}
