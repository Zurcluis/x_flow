import type { Metadata } from "next";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "Contactos",
  description:
    "Fale com a X-Motion sobre o seu projeto de PPF, Car Wrap, Color PPF ou personalização. Atelier em Barcelos.",
  alternates: {
    canonical: "/contactos",
  },
  openGraph: {
    url: "/contactos",
    title: "Contactos | X-Motion",
    description:
      "Fale com a X-Motion sobre o seu projeto. Atelier em Barcelos.",
  },
};

export default function ContactosPage() {
  return (
    <main id="conteudo">
      <ContactSection standalone />
    </main>
  );
}
