import { getQuoteByToken } from "@/server/quotes";
import { ClientPortalView } from "./ClientPortalView";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);

  if (!quote || !quote.vehiclePlate) {
    return (
      <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Painel não encontrado</h1>
        <p className="text-xs text-[#a9adae] mt-2 max-w-sm">
          O link não é válido. Por favor, contacta a X-Motion para receber um
          novo link seguro.
        </p>
      </div>
    );
  }

  return <ClientPortalView quote={quote} />;
}
