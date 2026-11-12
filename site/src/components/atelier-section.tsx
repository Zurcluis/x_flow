import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type AtelierSectionProps = {
  showHeading?: boolean;
  teaser?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function AtelierSection({
  showHeading = true,
  teaser = false,
  ctaHref = "#proposta",
  ctaLabel = "Vamos conhecer o seu carro",
}: AtelierSectionProps = {}) {
  return (
    <section id="sobre" className="atelier light-section section-pad">
      <div className="atelier-visual">
        <Image
          src="/images/atelier.webp"
          alt="Mercedes CLE 300 no espaço da X-Motion, em Barcelos"
          width={1000}
          height={1250}
          sizes="(max-width: 800px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
        <span className="photo-label">O NOSSO ESPAÇO · BARCELOS</span>
      </div>
      <div className="atelier-copy">
        {showHeading ? (
          <>
            <span className="eyebrow">04 / SOBRE NÓS</span>
            <h2>
              A diferença
              <br />
              está no
              <br />
              <em>cuidado.</em>
            </h2>
          </>
        ) : (
          <span className="eyebrow">O NOSSO ESPAÇO</span>
        )}
        <p>
          Um bom resultado começa antes da aplicação: na escolha do material, na preparação limpa da
          pintura e na atenção que damos a cada contorno.
        </p>
        {teaser ? null : (
          <p>
            No nosso espaço em Barcelos, cada projeto começa por avaliar a viatura consigo e definir
            a cobertura, o acabamento e o prazo adequados ao uso real do carro.
          </p>
        )}
        {ctaHref.startsWith("/") ? (
          <Link href={ctaHref} className="text-link">
            {ctaLabel}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <a href={ctaHref} className="text-link">
            {ctaLabel}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
