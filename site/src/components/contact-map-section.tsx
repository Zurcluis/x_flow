import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const mapSrc = `https://www.google.com/maps?q=${siteConfig.geo.latitude},${siteConfig.geo.longitude}&z=16&hl=pt-PT&output=embed`;

export function ContactMapSection() {
  return (
    <section
      id="mapa"
      className="contact-map-section light-section section-pad"
      aria-labelledby="contact-map-title"
    >
      <div className="contact-map-copy">
        <span className="eyebrow">ONDE ESTAMOS</span>
        <h2 id="contact-map-title">
          O nosso espaço em
          <br />
          <em>Barcelos.</em>
        </h2>
        <p>Se preferir, abra a localização diretamente no Google Maps.</p>
        <a
          className="button gold"
          href={siteConfig.maps}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir no Google Maps
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <div className="contact-map-frame">
        <iframe
          className="map-iframe"
          src={mapSrc}
          title="Mapa do espaço X-Motion em Barcelos"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
