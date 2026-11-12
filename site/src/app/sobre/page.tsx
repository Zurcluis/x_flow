import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AtelierSection } from "@/components/atelier-section";
import { ContactSection } from "@/components/contact-section";
import { FAQSection } from "@/components/faq-section";
import { PageIntro } from "@/components/page-intro";
import { ProcessSection } from "@/components/process-section";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a X-Motion em Barcelos: o nosso espaço, método de preparação, critérios de acabamento em PPF e Car Wrap e acompanhamento até à entrega.",
  alternates: {
    canonical: "/sobre",
  },
  openGraph: {
    url: "/sobre",
    title: "Sobre nós | X-Motion",
    description:
      "Conheça a X-Motion em Barcelos: o nosso espaço, método técnico e acompanhamento para proteção e personalização automóvel.",
  },
};

const pillars = [
  {
    index: "01",
    title: "Preparação antes da película",
    description:
      "Lavagem técnica, descontaminação e inspeção cuidada da pintura sob iluminação dedicada antes de aplicar qualquer filme ou vinil.",
  },
  {
    index: "02",
    title: "Contornos e desmontagem controlada",
    description:
      "Quando tecnicamente indicado, desmontamos apenas o necessário para ocultar bordas e preservar borrachas, clips e encaixes de origem.",
  },
  {
    index: "03",
    title: "Recomendação transparente",
    description:
      "Explicamos claramente quando compensa PPF transparente de 200 microns, Color PPF ou Car Wrap em função do uso real e do seu objetivo.",
  },
  {
    index: "04",
    title: "Entrega e manutenção explicada",
    description:
      "Inspeção final em conjunto junto à viatura e orientações práticas de lavagem e cuidados para prolongar o acabamento.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Início",
      item: siteConfig.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Sobre nós",
      item: `${siteConfig.url}/sobre`,
    },
  ],
};

export default function SobrePage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="SOBRE NÓS · BARCELOS"
        title={
          <>
            A diferença
            <br />
            está no
            <br />
            <em>cuidado.</em>
          </>
        }
        description="Proteção e personalização automóvel em Barcelos, com espaço dedicado, critério técnico na escolha dos materiais e transparência em cada etapa."
      >
        <div className="page-intro-actions">
          <a href="#proposta" className="button gold">
            Pedir orçamento
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <Link href="/projetos" className="text-link">
            Ver trabalhos realizados
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageIntro>

      <AtelierSection showHeading={false} ctaHref="/servicos" ctaLabel="Explorar serviços" />

      <section className="about-pillars section-pad" aria-labelledby="pillars-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">O QUE NOS DISTINGUE</span>
            <h2 id="pillars-heading">
              Critério técnico.
              <br />
              <em>Sem atalhos.</em>
            </h2>
          </div>
          <p>
            Cada carro entra no nosso espaço com um plano definido — do estado inicial da pintura
            à revisão no momento da entrega.
          </p>
        </div>
        <div className="about-pillars-grid">
          {pillars.map((item) => (
            <article key={item.index} className="about-pillar">
              <span className="process-index">{item.index}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <ProcessSection eyebrow="DO PRIMEIRO CONTACTO À ENTREGA" />
      <FAQSection limit={4} eyebrow="DÚVIDAS FREQUENTES" />
      <ContactSection eyebrow="O SEU PRÓXIMO PROJETO" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}

