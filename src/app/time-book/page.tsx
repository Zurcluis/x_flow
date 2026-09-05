import { TimeBookView } from "./TimeBookView";
import { listTimeBookBenchmarks } from "@/server/timebook";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function TimeBookPage() {
  const organizationId = await getPrimaryOrganizationId();
  const models = await listTimeBookBenchmarks(organizationId);

  return <TimeBookView initialModels={models} />;
}
