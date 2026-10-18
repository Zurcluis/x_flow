import { QuotesView } from "./QuotesView";
import { countQuotesWaitingOverFourDays, listQuotes } from "@/server/quotes";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const quotes = await listQuotes(auth.organizationId);
  const waitingOverFourDays = countQuotesWaitingOverFourDays(quotes);

  return (
    <QuotesView
      initialQuotes={quotes}
      waitingOverFourDays={waitingOverFourDays}
    />
  );
}
