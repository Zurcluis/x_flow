import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function StudioTeaser() {
  return (
    <section id="estudio" className="studio-teaser section-pad">
      <div className="studio-teaser-media">
        <Image
          src="/images/studio-0.webp"
          alt="Porsche demonstrativo no estúdio de cor X-Motion"
          fill
          sizes="(max-width: 800px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
        <span className="photo-label">ESTÚDIO DE COR · X-MOTION</span>
      </div>
      <div className="studio-teaser-copy">
        <span className="eyebrow">03 / ESTÚDIO DE COR</span>
        <h2>
          Imagine a mudança.
          <br />
          <em>Em todos os ângulos.</em>
        </h2>
        <p>
          Explore cores e acabamentos numa simulação aproximada. A escolha final confirma-se numa
          amostra física no atelier.
        </p>
        <Link href="/estudio" className="button gold">
          Abrir o estúdio de cor
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
