import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PortfolioSection } from "@/components/portfolio-section";

export const metadata: Metadata = {
  title: "Projetos",
  description:
    "Uma seleção de trabalhos realizados no atelier X-Motion, em Barcelos: PPF, Car Wrap, Color PPF e personalização.",
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: {
    url: "/portfolio",
    title: "Projetos | X-Motion",
    description:
      "Uma seleção de trabalhos realizados no atelier X-Motion, em Barcelos.",
  },
};

export default function PortfolioPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="02 / SELEÇÃO X-MOTION"
        title={
          <>
            O trabalho
            <br />
            <em>fala por si.</em>
          </>
        }
        description="Cada projeto tem a sua expressão. Estas são algumas das nossas."
      />
      <PortfolioSection showHeading={false} showAllLink={false} eagerFirst />
    </main>
  );
}
