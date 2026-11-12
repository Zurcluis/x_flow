import type { Metadata } from "next";
import { BudgetFunnel } from "@/components/budget-funnel";
import { resolveBudgetInitialParams } from "@/lib/proposal";
import { studioColors, studioFinishes } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Pedir orçamento",
  description:
    "Peça o seu orçamento de PPF, Color PPF ou Car Wrap na X-Motion em Barcelos. Resposta em até 24h úteis.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    url: "/ig",
    title: "Pedir orçamento | X-Motion",
    description:
      "Escolha o serviço, indique o seu carro e receba o orçamento por e-mail em até 24h úteis.",
  },
};

type IgOrcamentoPageProps = {
  searchParams: Promise<{
    servico?: string | string[];
    cor?: string | string[];
    acabamento?: string | string[];
    origem?: string | string[];
  }>;
};

export default async function IgOrcamentoPage({ searchParams }: IgOrcamentoPageProps) {
  const params = await searchParams;
  const { initialService, initialMessage, initialSource } = resolveBudgetInitialParams(
    params,
    studioColors,
    studioFinishes,
  );

  return (
    <main id="conteudo">
      <BudgetFunnel
        variant="instagram"
        initialService={initialService}
        initialMessage={initialMessage}
        initialSource={initialSource || "instagram"}
      />
    </main>
  );
}
