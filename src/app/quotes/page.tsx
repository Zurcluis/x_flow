import { QuotesView } from "./QuotesView";
import { listQuotes } from "@/server/quotes";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const organizationId = await getPrimaryOrganizationId();
  const quotes = await listQuotes(organizationId);

  return <QuotesView initialQuotes={quotes} />;
}
