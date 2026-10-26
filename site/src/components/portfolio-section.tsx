"use client";

import { ArrowUpRight, Camera, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  projectFilters,
  projects,
  type ProjectCategory,
  type ProjectFilter,
} from "@/lib/projects";
import { siteConfig } from "@/lib/site-config";

type PortfolioSectionProps = {
  showHeading?: boolean;
  showAllLink?: boolean;
  eagerFirst?: boolean;
};

export function PortfolioSection({
  showHeading = true,
  showAllLink = true,
  eagerFirst = false,
}: PortfolioSectionProps) {
  const [filter, setFilter] = useState<ProjectFilter>("Todos");
  const visibleProjects =
    filter === "Todos"
      ? projects
      : projects.filter((project) => project.categories.includes(filter as ProjectCategory));

  return (
    <section id="projetos" className="portfolio section-pad">
      {showHeading ? (
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
      ) : null}
      <div className="filter-bar" role="group" aria-label="Filtrar projetos">
        {projectFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? "active" : undefined}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
        <span>{String(visibleProjects.length).padStart(2, "0")} PROJETOS</span>
      </div>
      <div className="project-grid">
        {visibleProjects.map((project, projectIndex) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className={`project-card${project.wide ? " wide" : ""}`}
          >
            <div className="project-image">
              <Image
                src={project.image}
                alt={project.alt}
                width={project.width}
                height={project.height}
                sizes={
                  project.wide
                    ? "(max-width: 800px) 100vw, 90vw"
                    : "(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw"
                }
                loading={eagerFirst && projectIndex === 0 ? "eager" : undefined}
                fetchPriority={eagerFirst && projectIndex === 0 ? "high" : "auto"}
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
      {showAllLink ? (
        <Link href="/portfolio" className="button outline load-more">
          Ver todos os projetos
          <Plus size={17} aria-hidden="true" />
        </Link>
      ) : null}
      <div className="portfolio-footer">
        <span>Fotografias de trabalhos realizados no atelier.</span>
        <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
          Mais no Instagram <Camera size={17} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
