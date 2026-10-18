import { notFound } from "next/navigation";
import { PublicQuoteView } from "./PublicQuoteView";
import { getPublicQuoteForOrganization } from "@/server/quotes";
import { requirePublicToken } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { organizationId } = await requirePublicToken("quote", token);
  const quote = await getPublicQuoteForOrganization(organizationId, token);

  if (!quote) {
    notFound();
  }

  return <PublicQuoteView quote={quote} token={token} />;
}
