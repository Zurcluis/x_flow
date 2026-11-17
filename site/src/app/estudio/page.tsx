import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { StudioExperience } from "@/components/studio-experience";

export const metadata: Metadata = {
  title: "Estúdio de cor",
  description:
    "Personalize a fotografia do seu carro com IA ou explore cores e acabamentos no estúdio de cor X-Motion, com confirmação em amostra física.",
  alternates: {
    canonical: "/estudio",
  },
  openGraph: {
    url: "/estudio",
    title: "Estúdio de cor | X-Motion",
    description:
      "Personalize pintura, película nos vidros, jantes e kit aerodinâmico no estúdio de cor X-Motion.",
  },
};

const steps = [
  {
    index: "01",
    title: "Explore",
    text: "Escolha a vista, a cor e o acabamento no simulador.",
  },
  {
    index: "02",
    title: "Confirme",
    text: "Veja a amostra física e avalie o carro com a X-Motion.",
  },
  {
    index: "03",
    title: "Defina",
    text: "Confirme material, cobertura, valor e prazo no orçamento.",
  },
];

export default function EstudioPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="03 / ESTÚDIO DE COR"
        title={
          <>
            Imagine a mudança.
            <br />
            <em>Em todos os ângulos.</em>
          </>
        }
        description="Explore cores e acabamentos. A sua escolha começa aqui."
      >
        <div className="page-intro-actions">
          <a href="#estudio" className="button gold">
            Explorar o estúdio
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <Link href="/projetos" className="text-link">
            Ver projetos
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageIntro>
      <StudioExperience />
      <section className="studio-steps light-section section-pad">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DO ECRÃ À AMOSTRA</span>
            <h2>
              Simular é o começo.
              <br />
              <span>Confirmar é o passo seguinte.</span>
            </h2>
          </div>
          <p>
            A simulação ajuda a explorar. A decisão final faz-se com uma amostra física e uma
            avaliação ao carro.
          </p>
        </div>
        <div className="process-grid studio-steps-grid">
          {steps.map((step) => (
            <div className="process-item" key={step.index}>
              <span className="process-index">{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
