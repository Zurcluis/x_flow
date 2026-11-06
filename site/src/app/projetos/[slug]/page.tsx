import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSection } from "@/components/contact-section";
import { getNextProject, getProject, projects } from "@/lib/projects";
import type { ProposalService } from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

function proposalServiceFor(project: (typeof projects)[number]): ProposalService {
  if (project.categories.includes("PPF")) return "PPF";
  if (project.categories.includes("Car Wrap")) return "Car Wrap";
  if (project.categories.includes("Mota")) return "Mota";
  return "Preciso de aconselhamento";
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Projeto não encontrado" };
  }

  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: `/projetos/${project.slug}`,
    },
    openGraph: {
      url: `/projetos/${project.slug}`,
      title: `${project.title} | X-Motion`,
      description: project.description,
      images: [
        {
          url: project.image,
          width: project.width,
          height: project.height,
          alt: project.alt,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) notFound();

  const nextProject = getNextProject(project.slug);

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
        name: "Projetos",
        item: `${siteConfig.url}/projetos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.title,
        item: `${siteConfig.url}/projetos/${project.slug}`,
      },
    ],
  };

  return (
    <main id="conteudo">
      <section className="project-detail">
        <div className="project-detail-media">
          <Image
            src={project.image}
            alt={project.alt}
            fill
            sizes="(max-width: 800px) 100vw, 46vw"
            style={{ objectFit: "cover" }}
            preload
          />
        </div>
        <div className="project-detail-copy">
          <Link href="/projetos" className="text-link project-back">
            <ArrowLeft size={17} aria-hidden="true" /> Voltar aos projetos
          </Link>
          <span className="eyebrow">{project.tag}</span>
          <h1>{project.title}</h1>
          <p className="project-subtitle">{project.subtitle}</p>
          <p>{project.description}</p>
          <dl className="project-meta">
            <div>
              <dt>Serviço</dt>
              <dd>{project.categories.join(" · ")}</dd>
            </div>
            <div>
              <dt>Acabamento</dt>
              <dd>{project.subtitle}</dd>
            </div>
            <div>
              <dt>Atelier</dt>
              <dd>Barcelos, Portugal</dd>
            </div>
          </dl>
          <a href="#proposta" className="button gold">
            Pedir projeto semelhante
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
      <section className="project-gallery-wrap" aria-label={`Galeria de ${project.title}`}>
        <div className="project-gallery-heading">
          <span>GALERIA / {project.title}</span>
          <span>{String(project.gallery.length).padStart(2, "0")} FOTOGRAFIAS</span>
        </div>
        <div className="project-gallery">
          {project.gallery.map((image) => (
            <figure key={image.src} className="project-gallery-item">
              <div className="project-gallery-image">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 560px) 50vw, 42vw"
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            </figure>
          ))}
        </div>
      </section>
      <ContactSection
        eyebrow="O SEU PRÓXIMO PROJETO"
        defaultService={proposalServiceFor(project)}
        defaultMessage={`Inspiração: ${project.title} — ${project.subtitle}.`}
      />
      <section className="project-next light-section section-pad">
        <div>
          <span className="eyebrow">PRÓXIMO PROJETO</span>
          <h2>{nextProject.title}</h2>
        </div>
        <Link href={`/projetos/${nextProject.slug}`} className="text-link">
          Ver projeto
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
