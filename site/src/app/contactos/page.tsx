import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { ContactMapSection } from "@/components/contact-map-section";
import { ContactSection } from "@/components/contact-section";
import { PageIntro } from "@/components/page-intro";
import { studioColors, studioFinishes } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Contactos",
  description:
    "Fale com a X-Motion sobre o seu projeto de PPF, Car Wrap, Color PPF ou personalização em Barcelos, com mapa, horário e contacto direto.",
  alternates: {
    canonical: "/contactos",
  },
  openGraph: {
    url: "/contactos",
    title: "Contactos | X-Motion",
    description:
      "Fale com a X-Motion sobre o seu projeto em Barcelos, com mapa, horário e contacto direto.",
  },
};

type ContactosPageProps = {
  searchParams: Promise<{
    cor?: string | string[];
    acabamento?: string | string[];
  }>;
};

export default async function ContactosPage({ searchParams }: ContactosPageProps) {
  const params = await searchParams;
  const colorName = typeof params.cor === "string" ? params.cor : undefined;
  const finishName = typeof params.acabamento === "string" ? params.acabamento : undefined;
  const color = studioColors.find((item) => item.name === colorName);
  const finish = studioFinishes.find((item) => item.name === finishName);

  const defaultMessage =
    color || finish
      ? `Interesse no estúdio de cor: ${color ? color.name : "cor a definir"}${
          finish ? `, acabamento ${finish.name}` : ""
        }. Gostaria de avaliar o meu carro.`
      : undefined;

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
            Pedir orçamento
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a href="#mapa" className="text-link">
            <MapPin size={17} aria-hidden="true" /> Ver no mapa
          </a>
        </div>
      </PageIntro>
      <ContactSection showHeading={false} defaultMessage={defaultMessage} />
      <ContactMapSection />
    </main>
  );
}
