import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AtelierSection } from "@/components/atelier-section";
import { ContactSection } from "@/components/contact-section";
import { PageIntro } from "@/components/page-intro";
import { ProcessSection } from "@/components/process-section";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "O atelier",
  description:
    "Conheça o atelier X-Motion, em Barcelos, e a forma como cada projeto de PPF, Car Wrap ou Color PPF é avaliado e executado.",
  alternates: {
    canonical: "/atelier",
  },
  openGraph: {
    url: "/atelier",
    title: "O atelier | X-Motion",
    description:
      "Conheça o atelier X-Motion, em Barcelos, e a forma como cada projeto é avaliado e executado.",
  },
};

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
      name: "O atelier",
      item: `${siteConfig.url}/atelier`,
    },
  ],
};

export default function AtelierPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="O ATELIER"
        title={
          <>
            A diferença
            <br />
            está no
            <br />
            <em>cuidado.</em>
          </>
        }
        description="Conheça o espaço e a forma como abordamos cada projeto, em Barcelos."
      >
        <div className="page-intro-actions">
          <a href="#proposta" className="button gold">
            Pedir proposta
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <Link href="/projetos" className="text-link">
            Ver projetos
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageIntro>
      <AtelierSection showHeading={false} />
      <ProcessSection eyebrow="COMO TRABALHAMOS" />
      <ContactSection eyebrow="O SEU PRÓXIMO PROJETO" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
