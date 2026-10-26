import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="ERRO 404"
        title={
          <>
            Esta página
            <br />
            <em>não existe.</em>
          </>
        }
        description="O endereço pode ter mudado ou o link pode estar incompleto."
      >
        <div className="page-intro-actions">
          <Link href="/" className="button gold">
            Voltar ao início
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/portfolio" className="text-link">
            <ArrowLeft size={17} aria-hidden="true" /> Ver projetos
          </Link>
        </div>
      </PageIntro>
    </main>
  );
}
