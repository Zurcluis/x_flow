import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteDetailView } from "./QuoteDetailView";
import { getQuoteById } from "@/server/quotes";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const quote = await getQuoteById(organizationId, quoteId);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Orçamento não encontrado</h2>
        <Link href="/quotes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à lista de orçamentos</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <QuoteDetailView quote={quote} />;
}
