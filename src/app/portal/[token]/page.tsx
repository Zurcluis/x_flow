import { notFound } from "next/navigation";
import { requirePublicToken } from "@/server/auth";
import { getPublicQuoteByToken } from "@/server/quotes";
import { ClientPortalView } from "./ClientPortalView";

export const dynamic = "force-dynamic";

function isQuoteExpired(expiresAt: string): boolean {
  const timestamp = new Date(expiresAt).getTime();
  return Number.isFinite(timestamp) && timestamp < Date.now();
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requirePublicToken("quote", token);
  const quote = await getPublicQuoteByToken(token);

  if (!quote || !quote.vehiclePlate) {
    notFound();
  }

  return (
    <ClientPortalView
      quote={quote}
      token={token}
      expired={isQuoteExpired(quote.expiresAt)}
    />
  );
}
