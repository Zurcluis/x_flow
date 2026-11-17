import { ArrowUpRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { projects, type Project } from "@/lib/projects";

const featuredSlugs = [
  "lamborghini-huracan",
  "ferrari-458-speciale",
  "porsche-911-gt3",
  "aston-martin-vantage-f1",
  "bmw-m3",
  "barco-ppf",
];

const featuredProjects = featuredSlugs
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project): project is Project => project !== undefined);

export function FeaturedProjects() {
  return (
    <section id="projetos" className="portfolio section-pad">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / SELEÇÃO X-MOTION</span>
          <h2>
            O trabalho
            <br />
            <em>fala por si.</em>
          </h2>
        </div>
        <p>
          Cada projeto tem a sua expressão.
          <br />
          Estas são algumas das nossas.
        </p>
      </div>
      <div className="project-grid">
        {featuredProjects.map((project) => (
          <Link
            key={project.slug}
            href={`/projetos/${project.slug}`}
            className="project-card"
          >
            <div className="project-image">
              <Image
                src={project.image}
                alt={project.alt}
                width={project.width}
                height={project.height}
                sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              <span className="project-open">
                <ArrowUpRight size={22} aria-hidden="true" />
              </span>
              <span className="project-tag">{project.tag}</span>
            </div>
            <div className="project-text">
              <h3>{project.title}</h3>
              <p>{project.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/projetos" className="button outline load-more">
        Ver todos os projetos
        <Plus size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
