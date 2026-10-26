import { Plus } from "lucide-react";

const questions = [
  {
    question: "Qual é a diferença entre PPF e vinil?",
    answer:
      "O PPF é uma película orientada para a proteção da pintura. O vinil é sobretudo uma solução de personalização de cor e textura. O Color PPF combina mudança de cor e proteção. A escolha depende do uso, do acabamento e do investimento pretendido.",
  },
  {
    question: "Quanto custa um projeto?",
    answer:
      "O valor depende da viatura, material, zonas abrangidas, preparação e desmontagem necessárias. Envie-nos o modelo e o que pretende fazer: preparamos uma proposta com as inclusões e condições explicadas.",
  },
  {
    question: "Quanto tempo fica o carro no atelier?",
    answer:
      "Depende do serviço e da complexidade. A preparação, a aplicação e o controlo final fazem parte do planeamento. O prazo é acordado na proposta antes da marcação.",
  },
  {
    question: "A cor do simulador é igual à película?",
    answer:
      "O simulador é uma aproximação visual. O ecrã, a iluminação e o acabamento alteram a perceção da cor. A escolha final deve ser confirmada numa amostra física no atelier.",
  },
  {
    question: "É possível personalizar apenas alguns detalhes?",
    answer:
      "Sim. Podemos avaliar soluções para tejadilho, espelhos, frisos, interiores e proteção de óticas, entre outras zonas. Indique os detalhes pretendidos no pedido.",
  },
  {
    question: "Como funciona a manutenção e a garantia?",
    answer:
      "Os cuidados e as condições dependem do material e do serviço escolhido. A proposta deve identificar a cobertura aplicável, as exclusões e as recomendações de manutenção. Depois da entrega, contacte-nos se surgir alguma dúvida.",
  },
];

export function FAQSection() {
  return (
    <section className="faq-section light-section section-pad">
      <div>
        <span className="eyebrow">06 / ANTES DE DECIDIR</span>
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
        {questions.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus size={19} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
