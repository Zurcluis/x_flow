import type { Metadata } from "next";
import { AtelierSection } from "@/components/atelier-section";
import { FAQSection } from "@/components/faq-section";
import { FeaturedProjects } from "@/components/featured-projects";
import { Hero } from "@/components/hero";
import { HomeContactCta } from "@/components/home-contact-cta";
import { HomeServices } from "@/components/home-services";
import { ProcessSection } from "@/components/process-section";
import { StudioTeaser } from "@/components/studio-teaser";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main id="conteudo">
      <Hero />
      <HomeServices />
      <FeaturedProjects />
      <StudioTeaser />
      <AtelierSection teaser ctaHref="/sobre" ctaLabel="Sobre nós e o nosso espaço" />
      <ProcessSection />
      <FAQSection limit={4} />
      <HomeContactCta />
    </main>
  );
}
