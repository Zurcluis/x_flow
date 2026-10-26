import { ArrowUpRight, LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

type PassportPageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Passaporte digital",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function PassportPage({ params }: PassportPageProps) {
  const { token } = await params;
  const looksValid = /^[A-Za-z0-9_-]{16,200}$/.test(token);

  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="PASSAPORTE DIGITAL"
        title={
          <>
            O seu projeto.
            <br />
            <em>Sempre à mão.</em>
          </>
        }
        description="O acesso é enviado pela X-Motion depois da entrega do carro."
      />
      <section className="passport-page light-section section-pad">
        <div className="passport-card">
          <LockKeyhole size={34} aria-hidden="true" />
          <span className="eyebrow">ACESSO PRIVADO</span>
          <h2>{looksValid ? "Passaporte em preparação." : "Link inválido."}</h2>
          <p>
            {looksValid
              ? "Este passaporte ainda não está disponível. Se recebeu o link recentemente, tente novamente mais tarde ou fale connosco."
              : "Confirme se copiou o link completo. Se o problema continuar, fale connosco."}
          </p>
          <Link href="/contactos" className="button gold">
            Falar connosco
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
