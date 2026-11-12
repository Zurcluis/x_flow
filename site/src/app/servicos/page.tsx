import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactSection } from "@/components/contact-section";
import { PageIntro } from "@/components/page-intro";
import { ProcessSection } from "@/components/process-section";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "PPF, Car Wrap, Color PPF e detalhes em Barcelos. Conheça as soluções da X-Motion e peça uma avaliação para o seu carro.",
  alternates: {
    canonical: "/servicos",
  },
  openGraph: {
    url: "/servicos",
    title: "Serviços | X-Motion",
    description:
      "PPF, Car Wrap, Color PPF e detalhes em Barcelos. Conheça as soluções da X-Motion.",
  },
};

const breadcrumb = {
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
      name: "Serviços",
      item: `${siteConfig.url}/servicos`,
    },
  ],
};

export default function ServicosPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="SERVIÇOS"
        title={
          <>
            Proteger.
            <br />
            <em>Transformar.</em>
          </>
        }
        description="Quatro formas de trabalhar o seu carro, sempre a partir de uma conversa e de uma avaliação."
      >
        <div className="page-intro-actions">
          <Link href="/orcamento" className="button gold">
            Pedir orçamento
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/projetos" className="text-link">
            Ver projetos
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageIntro>
      <section className="services-index light-section section-pad" aria-label="Serviços X-Motion">
        <div className="services-index-grid">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/servicos/${service.id}`}
              className="service-index-card"
            >
              <div className="service-index-image">
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  width={service.image.width}
                  height={service.image.height}
                  sizes="(max-width: 800px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="service-index-number">{service.number}</span>
              </div>
              <div className="service-index-copy">
                <span className="micro">{service.name}</span>
                <h2>{service.short}</h2>
                <p>{service.description}</p>
                <span className="service-index-link">
                  Conhecer o serviço
                  <ArrowUpRight size={18} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <ProcessSection eyebrow="COMO COMEÇA UM PROJETO" />
      <ContactSection eyebrow="O SEU PRÓXIMO PROJETO" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </main>
  );
}
