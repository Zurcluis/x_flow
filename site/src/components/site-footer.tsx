import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand-icons";
import { navItems, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" href="/" aria-label="X-Motion, início">
          <Image
            src="/logo/logo.webp"
            alt="X-Motion"
            width={2044}
            height={362}
            className="brand-logo"
          />
          <span className="brand-sub">PPF &amp; car wrap</span>
        </Link>
        <span>Proteção. Personalização. Precisão.</span>
        <div className="footer-social">
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp da X-Motion"
          >
            <WhatsAppIcon size={20} />
          </a>
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da X-Motion"
          >
            <InstagramIcon size={20} />
          </a>
          <a
            href={siteConfig.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook da X-Motion"
          >
            <FacebookIcon size={20} />
          </a>
        </div>
      </div>
      <div className="footer-contact">
        <a href={siteConfig.maps} target="_blank" rel="noopener noreferrer">
          <MapPin size={16} aria-hidden="true" />
          {siteConfig.address.street}, {siteConfig.address.postalCode} {siteConfig.address.city}
        </a>
        <a href={siteConfig.phoneHref}>
          <Phone size={16} aria-hidden="true" />
          {siteConfig.phone}
        </a>
      </div>
      <nav className="footer-nav" aria-label="Navegação do rodapé">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/privacidade">Privacidade</Link>
      </nav>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} X-Motion · Barcelos</span>
        <div>
          <Link href="/">Voltar ao início ↑</Link>
        </div>
      </div>
    </footer>
  );
}
