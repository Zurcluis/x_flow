import { PublicQuoteView } from "./PublicQuoteView";
import { getPublicQuoteByToken } from "@/server/quotes";
import { requirePublicToken } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requirePublicToken("quote", token);
  const quote = await getPublicQuoteByToken(token);

  return <PublicQuoteView quote={quote} token={token} />;
}
