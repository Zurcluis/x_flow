import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand-icons";
import { siteConfig } from "@/lib/site-config";

export function HomeContactCta() {
  return (
    <section id="contacto" className="home-contact section-pad">
      <div className="home-contact-copy">
        <span className="eyebrow">O SEU PRÓXIMO PROJETO</span>
        <h2>
          Começa
          <br />
          com o
          <br />
          <em>seu carro.</em>
        </h2>
        <p>
          Diga-nos o que tem em mente.
          <br />
          Nós ajudamos a dar-lhe forma.
        </p>
        <div className="home-contact-actions">
          <Link href="/orcamento" className="button gold">
            Pedir orçamento
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="button outline whatsapp-button"
          >
            <WhatsAppIcon size={18} />
            Falar no WhatsApp
          </a>
        </div>
      </div>
      <div className="home-contact-details">
        <span className="eyebrow">CONTACTOS</span>
        <a className="text-link" href={siteConfig.phoneHref}>
          <Phone size={16} aria-hidden="true" />
          {siteConfig.phone}
        </a>
        <a
          className="text-link"
          href={siteConfig.maps}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={16} aria-hidden="true" />
          {siteConfig.address.street}, {siteConfig.address.postalCode} {siteConfig.address.city}
        </a>
        <div className="home-contact-hours">
          <Clock size={16} aria-hidden="true" />
          <span>
            {siteConfig.hours.map((item) => `${item.days}, ${item.time}`).join(" · ")}
          </span>
        </div>
        <div className="contact-direct" style={{ marginTop: 12 }}>
          <a
            className="text-link"
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={16} /> WhatsApp
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <a
            className="text-link"
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon size={16} /> Instagram
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <a
            className="text-link"
            href={siteConfig.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon size={16} /> Facebook
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <Link className="text-link" href="/contactos" style={{ marginTop: 14 }}>
          Todos os contactos
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
