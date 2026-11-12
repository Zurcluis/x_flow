import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSection } from "@/components/contact-section";
import { FAQSection } from "@/components/faq-section";
import { PageIntro } from "@/components/page-intro";
import { ProcessSection } from "@/components/process-section";
import { projects } from "@/lib/projects";
import { getService, services } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.id }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    return { title: "Serviço não encontrado" };
  }

  return {
    title: `${service.name} em Barcelos`,
    description: service.seoDescription,
    alternates: {
      canonical: `/servicos/${service.id}`,
    },
    openGraph: {
      url: `/servicos/${service.id}`,
      title: `${service.name} | X-Motion`,
      description: service.seoDescription,
      images: [
        {
          url: service.image.src,
          width: service.image.width,
          height: service.image.height,
          alt: service.image.alt,
        },
      ],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const relatedProjects = projects.filter((project) =>
    project.categories.some((category) => service.relatedCategories.includes(category)),
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `${service.name} em Barcelos`,
        serviceType: service.name,
        description: service.description,
        url: `${siteConfig.url}/servicos/${service.id}`,
        provider: {
          "@type": "AutoBodyShop",
          name: siteConfig.name,
          url: siteConfig.url,
          email: siteConfig.email,
          telephone: siteConfig.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.address.street,
            postalCode: siteConfig.address.postalCode,
            addressLocality: siteConfig.address.city,
            addressRegion: siteConfig.address.region,
            addressCountry: siteConfig.address.country,
          },
        },
        areaServed: {
          "@type": "City",
          name: siteConfig.locality,
        },
      },
      {
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
          {
            "@type": "ListItem",
            position: 3,
            name: service.name,
            item: `${siteConfig.url}/servicos/${service.id}`,
          },
        ],
      },
    ],
  };

  return (
    <main id="conteudo">
      <PageIntro
        eyebrow={`SERVIÇO ${service.number}`}
        title={
          <>
            {service.name}
            <br />
            <em>{service.short}</em>
          </>
        }
        description={service.description}
      >
        <div className="page-intro-actions">
          <a href="#proposta" className="button gold">
            Pedir orçamento
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <Link href="/projetos" className="text-link">
            Ver projetos
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageIntro>

      <section className="service-page light-section section-pad">
        <div className="service-page-grid">
          <div className="service-page-media">
            <Image
              src={service.image.src}
              alt={service.image.alt}
              width={service.image.width}
              height={service.image.height}
              sizes="(max-width: 800px) 100vw, 48vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="service-page-copy">
            <span className="eyebrow">{service.number} / O QUE ESTÁ INCLUÍDO</span>
            <h2>{service.short}</h2>
            <p>{service.description}</p>
            <ul className="service-checklist">
              {service.bullets.map((bullet) => (
                <li key={bullet}>
                  <Check size={17} aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
            <p className="service-note">
              Cada projeto é avaliado antes de confirmar a solução, o âmbito e as condições. O
              orçamento identifica o que está incluído.
            </p>
          </div>
        </div>
      </section>

      <section className="service-projects light-section section-pad">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TRABALHOS RELACIONADOS</span>
            <h2>
              Projetos em
              <br />
              <em>{service.name}.</em>
            </h2>
          </div>
          <Link href="/projetos" className="text-link">
            Ver todos os projetos
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        {relatedProjects.length > 0 ? (
          <div className="service-projects-grid">
            {relatedProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/projetos/${project.slug}`}
                className="service-project-card"
              >
                <div className="service-project-image">
                  <Image
                    src={project.image}
                    alt={project.alt}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="service-project-text">
                  <h3>{project.title}</h3>
                  <p>{project.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="service-empty">
            Ainda não publicámos um projeto classificado especificamente como {service.name}. Isso
            não impede uma avaliação ao seu carro: envie o modelo e o objetivo no pedido de
            orçamento.
          </p>
        )}
      </section>

      <ProcessSection eyebrow="COMO TRABALHAMOS" />
      <FAQSection eyebrow="ANTES DE DECIDIR" />
      <ContactSection
        eyebrow="O SEU PRÓXIMO PROJETO"
        defaultService={service.proposalService}
        defaultMessage={`Tenho interesse em ${service.name}. Gostaria de avaliar o meu carro.`}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
