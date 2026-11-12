"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { InstagramIcon } from "@/components/brand-icons";
import {
  projectFilters,
  projects,
  type ProjectCategory,
  type ProjectFilter,
} from "@/lib/projects";
import { siteConfig } from "@/lib/site-config";

const URL_CHANGE_EVENT = "xmotion:urlchange";

function subscribeToSearch(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_CHANGE_EVENT, callback);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSearchSnapshot() {
  return "";
}

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
  const search = useSyncExternalStore(
    subscribeToSearch,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );
  const rawFilter = new URLSearchParams(search).get("filtro");
  const filter: ProjectFilter =
    (rawFilter &&
      projectFilters.find((item) => item.toLowerCase() === rawFilter.trim().toLowerCase())) ||
    "Todos";

  function selectFilter(next: ProjectFilter) {
    const url = new URL(window.location.href);
    if (next === "Todos") {
      url.searchParams.delete("filtro");
    } else {
      url.searchParams.set("filtro", next);
    }
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  }

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
            onClick={() => selectFilter(item)}
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
            href={`/projetos/${project.slug}`}
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
              <span className="project-open" aria-hidden="true">
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
        <Link href="/projetos" className="button outline load-more">
          Ver todos os projetos
          <Plus size={17} aria-hidden="true" />
        </Link>
      ) : null}
      <div className="portfolio-footer">
        <span>Fotografias de trabalhos realizados no nosso espaço em Barcelos.</span>
        <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
          Mais no Instagram <InstagramIcon size={17} />
        </a>
      </div>
    </section>
  );
}
