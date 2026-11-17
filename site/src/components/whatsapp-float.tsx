import { WhatsAppIcon } from "@/components/brand-icons";
import { siteConfig } from "@/lib/site-config";

export function WhatsAppFloat() {
  return (
    <a
      href={siteConfig.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Falar connosco no WhatsApp"
      title="Falar connosco no WhatsApp"
    >
      <WhatsAppIcon size={24} className="whatsapp-float-icon" />
      <span className="whatsapp-float-label">WhatsApp</span>
    </a>
  );
}
