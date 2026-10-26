import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export function AtelierSection() {
  return (
    <section id="atelier" className="atelier light-section section-pad">
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
        <span className="eyebrow">04 / O ATELIER</span>
        <h2>
          A diferença
          <br />
          está no
          <br />
          <em>cuidado.</em>
        </h2>
        <p>
          Um bom resultado começa antes da aplicação. Na escolha do material, na preparação da
          viatura e na atenção que damos a cada pormenor.
        </p>
        <p>
          Na X-Motion, o projeto começa por uma conversa: perceber o que pretende, avaliar o carro
          e definir uma solução consigo.
        </p>
        <a href="#proposta" className="text-link">
          Vamos conhecer o seu carro
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
