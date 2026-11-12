import type { Metadata } from "next";
import { BudgetFunnel } from "@/components/budget-funnel";
import { resolveBudgetInitialParams } from "@/lib/proposal";
import { studioColors, studioFinishes } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Pedir orçamento",
  description:
    "Peça um orçamento para PPF, Color PPF, Car Wrap ou detalhes automóveis na X-Motion em Barcelos. Resposta em até 24h úteis.",
  alternates: {
    canonical: "/orcamento",
  },
  openGraph: {
    url: "/orcamento",
    title: "Pedir orçamento | X-Motion",
    description:
      "Peça um orçamento para PPF, Color PPF ou Car Wrap em Barcelos. Resposta clara por e-mail em até 24h úteis.",
  },
};

type OrcamentoPageProps = {
  searchParams: Promise<{
    servico?: string | string[];
    cor?: string | string[];
    acabamento?: string | string[];
    origem?: string | string[];
  }>;
};

export default async function OrcamentoPage({ searchParams }: OrcamentoPageProps) {
  const params = await searchParams;
  const { initialService, initialMessage, initialSource } = resolveBudgetInitialParams(
    params,
    studioColors,
    studioFinishes,
  );

  return (
    <main id="conteudo">
      <BudgetFunnel
        initialService={initialService}
        initialMessage={initialMessage}
        initialSource={initialSource}
      />
    </main>
  );
}
