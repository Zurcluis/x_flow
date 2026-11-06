import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/services";

export function HomeServices() {
  return (
    <section id="servicos" className="home-services light-section section-pad">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / O QUE PRETENDE FAZER?</span>
          <h2>
            Preservar a pintura.
            <br />
            <span>Mudar a presença.</span>
          </h2>
        </div>
        <p>
          Começamos pelo que procura.
          <br />
          Encontramos a solução para o seu carro.
        </p>
      </div>
      <div className="home-services-grid">
        {services.map((service) => (
          <Link key={service.id} href={`/servicos/${service.id}`} className="home-service-card">
            <div className="home-service-image">
              <Image
                src={service.image.src}
                alt={service.image.alt}
                fill
                sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="home-service-copy">
              <span className="micro">
                {service.number} — {service.name}
              </span>
              <h3>{service.short}</h3>
              <p>{service.description}</p>
              <span className="home-service-link">
                Ver serviço
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/servicos" className="button outline load-more">
        Ver todos os serviços
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
