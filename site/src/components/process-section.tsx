const steps = [
  {
    index: "01",
    title: "Conversar",
    description:
      "O carro, o uso e a sua ideia. Percebemos o que procura e avaliamos as opções.",
  },
  {
    index: "02",
    title: "Definir",
    description:
      "Material, cobertura, preparação, valor e prazo. Uma proposta com as condições do projeto.",
  },
  {
    index: "03",
    title: "Aplicar",
    description:
      "Preparação e aplicação com atenção aos contornos, às zonas de acabamento e aos detalhes.",
  },
  {
    index: "04",
    title: "Entregar",
    description: "Inspeção final e explicação dos cuidados para manter o resultado.",
  },
];

export function ProcessSection() {
  return (
    <section className="process section-pad">
      <div className="section-heading">
        <div>
          <span className="eyebrow">05 / DO PRIMEIRO CONTACTO À ENTREGA</span>
          <h2>
            Um projeto.
            <br />
            <em>Cada etapa conta.</em>
          </h2>
        </div>
        <p>
          Saiba o que esperar
          <br />
          ao entregar-nos o seu carro.
        </p>
      </div>
      <div className="process-grid">
        {steps.map((step) => (
          <div className="process-item" key={step.index}>
            <span className="process-index">{step.index}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
