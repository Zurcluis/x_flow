import { Camera } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" href="/" aria-label="X-Motion, início">
          <span>x</span>-motion
          <span className="brand-sub">PPF &amp; CAR WRAP</span>
        </Link>
        <span>Proteção. Personalização. Precisão.</span>
        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram da X-Motion"
        >
          <Camera size={22} aria-hidden="true" />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} X-Motion · Barcelos</span>
        <div>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/contactos">Contactos</Link>
          <Link href="/#inicio">Voltar ao início ↑</Link>
        </div>
      </div>
    </footer>
  );
}
