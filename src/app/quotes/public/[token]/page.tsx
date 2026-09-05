import { PublicQuoteView } from "./PublicQuoteView";
import { getQuoteByToken } from "@/server/quotes";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);

  return <PublicQuoteView quote={quote} token={token} />;
}
