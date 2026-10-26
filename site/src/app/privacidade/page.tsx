import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Informação sobre o tratamento de dados pessoais no site da X-Motion.",
  alternates: {
    canonical: "/privacidade",
  },
  openGraph: {
    url: "/privacidade",
    title: "Privacidade | X-Motion",
    description: "Informação sobre o tratamento de dados pessoais no site da X-Motion.",
  },
};

export default function PrivacidadePage() {
  return (
    <main id="conteudo">
      <PageIntro
        eyebrow="INFORMAÇÃO LEGAL"
        title={
          <>
            Privacidade.
            <br />
            <em>Com clareza.</em>
          </>
        }
        description="Como tratamos os dados enviados através deste site."
      />
      <section className="privacy-copy light-section section-pad">
        <div className="privacy-note">
          Versão preliminar. Este texto será substituído pela versão final, com os dados legais
          completos da X-Motion, antes da publicação.
        </div>
        <h2>Quem trata os dados</h2>
        <p>
          A X-Motion, atelier em Barcelos, Portugal, é responsável pelo tratamento dos dados
          enviados através deste site. Enquanto o contacto dedicado de privacidade não estiver
          publicado, pode falar connosco através do{" "}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            Instagram oficial
          </a>{" "}
          ou da <Link href="/contactos">página de contactos</Link>.
        </p>
        <h2>Dados que recolhemos</h2>
        <p>
          No formulário de pedido de proposta, recolhemos o nome, o e-mail, o telefone (opcional),
          o modelo da viatura, a descrição do projeto e o registo do consentimento. O site pode
          ainda gerar dados técnicos necessários ao funcionamento e à segurança do serviço, como
          registos de acesso.
        </p>
        <h2>Para que usamos os dados</h2>
        <p>
          Usamos os dados para responder ao pedido, perceber o projeto e preparar uma proposta.
          Não vendemos dados pessoais nem tomamos decisões automatizadas com base no formulário.
        </p>
        <h2>Fundamento e conservação</h2>
        <p>
          O tratamento baseia-se no consentimento que dá ao enviar o formulário. Conservamos os
          dados enquanto o pedido estiver ativo e pelo período necessário à resposta e ao
          cumprimento de obrigações legais aplicáveis. Depois disso, são eliminados ou
          anonimizados.
        </p>
        <h2>Partilha</h2>
        <p>
          Os dados podem ser tratados por prestadores técnicos que suportam o site, a base de dados
          e as comunicações, sujeitos a obrigações de confidencialidade. Não são partilhados para
          publicidade nem vendidos a terceiros.
        </p>
        <h2>Os seus direitos</h2>
        <p>
          Pode pedir acesso, correção, eliminação, limitação, portabilidade ou oposição ao
          tratamento, e pode retirar o consentimento a qualquer momento. Para exercer estes
          direitos, contacte-nos pelos canais acima. Tem também o direito de apresentar reclamação
          à Comissão Nacional de Proteção de Dados (CNPD).
        </p>
        <h2>Cookies</h2>
        <p>
          Este site não usa cookies de análise, publicidade ou redes sociais. Apenas podem existir
          cookies ou armazenamento estritamente necessários ao funcionamento e à segurança do
          serviço.
        </p>
        <h2>Alterações</h2>
        <p>
          Esta informação pode ser atualizada quando o site ou os serviços mudarem. A versão
          publicada é a que se aplica no momento da utilização.
        </p>
      </section>
    </main>
  );
}
