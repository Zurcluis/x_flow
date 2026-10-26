import type { Metadata } from "next";
import { ColorStudio } from "@/components/color-studio";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Estúdio de cor",
  description:
    "Explore cores e acabamentos no estúdio de cor X-Motion. Uma simulação 2D aproximada, com confirmação em amostra física.",
  alternates: {
    canonical: "/estudio",
  },
  openGraph: {
    url: "/estudio",
    title: "Estúdio de cor | X-Motion",
    description: "Explore cores e acabamentos no estúdio de cor X-Motion.",
  },
};

export default function EstudioPage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="03 / ESTÚDIO DE COR"
        title={
          <>
            Imagine a mudança.
            <br />
            <em>Em todos os ângulos.</em>
          </>
        }
        description="Explore cores e acabamentos. A sua escolha começa aqui."
      />
      <ColorStudio showHeading={false} />
    </main>
  );
}
