import type { Metadata } from "next";
import { AtelierSection } from "@/components/atelier-section";
import { ColorStudio } from "@/components/color-studio";
import { ContactSection } from "@/components/contact-section";
import { FAQSection } from "@/components/faq-section";
import { Hero } from "@/components/hero";
import { PortfolioSection } from "@/components/portfolio-section";
import { ProcessSection } from "@/components/process-section";
import { ServicesSection } from "@/components/services-section";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main id="conteudo">
      <Hero />
      <ServicesSection />
      <PortfolioSection />
      <ColorStudio />
      <AtelierSection />
      <ProcessSection />
      <FAQSection />
      <ContactSection />
    </main>
  );
}
