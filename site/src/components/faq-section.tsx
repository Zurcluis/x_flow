import { Plus } from "lucide-react";

const questions = [
  {
    question: "Qual é a diferença entre PPF, Car Wrap e Color PPF?",
    answer:
      "O PPF (Paint Protection Film) é uma película transparente e autorreparável orientada para proteger a pintura original contra gravilha e pequenos riscos. O Car Wrap é uma película em vinil pensada para mudar a cor ou textura do carro. O Color PPF combina mudança estética de cor com proteção física mais espessa numa única aplicação.",
  },
  {
    question: "O PPF ou o Car Wrap danificam a pintura original ao remover?",
    answer:
      "Não, desde que a pintura original esteja em bom estado e a remoção seja feita com técnica adequada. Tanto o PPF como o vinil de Car Wrap são soluções reversíveis que ajudam a preservar o verniz de origem durante o uso diário.",
  },
  {
    question: "Quanto custa e quanto tempo demora um projeto na X-Motion?",
    answer:
      "O valor e o prazo dependem do modelo da viatura, material, zonas a cobrir (como Pack Frontal vs. Cobertura Integral) e preparação necessária. Trabalhos parciais ou Chrome Delete são concluídos em 1 a 2 dias; aplicações integrais são planeadas em vários dias úteis, com prazo e orçamento fechados antes da marcação.",
  },
  {
    question: "Posso aplicar PPF apenas na frente do carro ou em partes interiores?",
    answer:
      "Sim. Pode optar por um Pack Frontal (para-choques, capô, guarda-lamas, espelhos e óticas), Cobertura Integral ou aplicação específica em consolas e molduras interiores sensíveis, além de Chrome Delete e escurecimento de óticas.",
  },
  {
    question: "Como lavar e manter um carro com PPF ou Car Wrap?",
    answer:
      "Recomenda-se lavagem manual com champô neutro e panos de microfibra macios, evitando rolos automáticos abrasivos e jatos de alta pressão encostados diretamente às bordas da película. Na entrega explicamos todos os cuidados específicos do material escolhido.",
  },
  {
    question: "Onde fica a X-Motion e atendem viaturas fora de Barcelos?",
    answer:
      "O nosso espaço fica em Barcelos (R. Odete Hermenegildo 1286, Pavilhão 4 D, 4750-841). Recebemos regularmente viaturas de Braga, Vila Nova de Famalicão, Guimarães, Viana do Castelo, Porto e de todo o Norte de Portugal mediante marcação.",
  },
];

type FAQSectionProps = {
  eyebrow?: string;
  limit?: number;
};

export function FAQSection({
  eyebrow = "06 / ANTES DE DECIDIR",
  limit,
}: FAQSectionProps = {}) {
  const visibleQuestions =
    typeof limit === "number" ? questions.slice(0, limit) : questions;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visibleQuestions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="faq-section light-section section-pad">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>
          Boas perguntas.
          <br />
          <span>Respostas claras.</span>
        </h2>
        <p>
          Se ainda tem dúvidas, fale connosco.
          <br />
          Ajudamos a escolher com confiança.
        </p>
      </div>
      <div className="faq-list">
        {visibleQuestions.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus size={19} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </section>
  );
}
