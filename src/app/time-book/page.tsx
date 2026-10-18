import { TimeBookView } from "./TimeBookView";
import { listTimeBookBenchmarks } from "@/server/timebook";
import { requireRole } from "@/server/auth";
import { canSeeFinancials, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function TimeBookPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const models = await listTimeBookBenchmarks(auth.organizationId);

  return (
    <TimeBookView
      initialModels={models}
      canUseConfigurator={canSeeFinancials(auth.role)}
    />
  );
}
