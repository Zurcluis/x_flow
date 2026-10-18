import { notFound } from "next/navigation";
import { QuoteDetailView } from "./QuoteDetailView";
import { getQuoteById } from "@/server/quotes";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { quoteId } = await params;
  const quote = await getQuoteById(auth.organizationId, quoteId);

  if (!quote) {
    notFound();
  }

  return <QuoteDetailView quote={quote} />;
}
