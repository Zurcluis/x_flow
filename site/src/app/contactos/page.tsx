import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { ContactMapSection } from "@/components/contact-map-section";
import { ContactSection } from "@/components/contact-section";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Contactos",
  description:
    "Fale com a X-Motion sobre o seu projeto de PPF, Car Wrap, Color PPF ou personalização. Atelier em Barcelos, com mapa, horário e contacto direto.",
  alternates: {
    canonical: "/contactos",
  },
  openGraph: {
    url: "/contactos",
    title: "Contactos | X-Motion",
    description:
      "Fale com a X-Motion sobre o seu projeto. Atelier em Barcelos, com mapa, horário e contacto direto.",
  },
};

export default function ContactosPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="CONTACTOS"
        title={
          <>
            Fale connosco.
            <br />
            <em>Estamos por aqui.</em>
          </>
        }
        description="Diga-nos o que tem em mente. Respondemos com os próximos passos."
      >
        <div className="page-intro-actions">
          <a href="#proposta" className="button gold">
            Pedir proposta
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a href="#mapa" className="text-link">
            <MapPin size={17} aria-hidden="true" /> Ver no mapa
          </a>
        </div>
      </PageIntro>
      <ContactSection showHeading={false} />
      <ContactMapSection />
    </main>
  );
}
