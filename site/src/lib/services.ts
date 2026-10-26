export type ServiceId = "ppf" | "car-wrap" | "color-ppf" | "detalhes";

export type ServiceDetail = {
  id: ServiceId;
  number: string;
  name: string;
  short: string;
  description: string;
  bullets: string[];
};

export const services: ServiceDetail[] = [
  {
    id: "ppf",
    number: "01",
    name: "PPF",
    short: "Preservar o que importa.",
    description:
      "Película de proteção para a pintura, aplicada nas zonas mais expostas ou numa cobertura mais abrangente. A solução é definida depois de avaliar o carro e o uso que lhe dá.",
    bullets: [
      "Proteção de zonas expostas",
      "Pack frontal ou cobertura total, após avaliação",
      "Acabamento e cuidados explicados na proposta",
    ],
  },
  {
    id: "car-wrap",
    number: "02",
    name: "Car Wrap",
    short: "Mudar a cor. Manter a essência.",
    description:
      "Uma nova cor ou textura para o carro, com preparação da superfície e atenção aos contornos. O resultado é planeado consigo antes da aplicação.",
    bullets: [
      "Mudança de cor ou textura",
      "Preparação da superfície",
      "Acabamento de contornos e detalhes",
    ],
  },
  {
    id: "color-ppf",
    number: "03",
    name: "Color PPF",
    short: "Uma cor com outra função.",
    description:
      "Combina a mudança de cor com a proteção da pintura. Indicado para quem procura uma nova presença sem separar cor e proteção em duas soluções.",
    bullets: [
      "Cor e proteção na mesma aplicação",
      "Opções de acabamento",
      "Avaliação da viatura e das zonas a cobrir",
    ],
  },
  {
    id: "detalhes",
    number: "04",
    name: "Detalhes",
    short: "Chrome Delete, óticas e aplicações.",
    description:
      "Intervenções pontuais para mudar ou proteger detalhes específicos. Cada pedido é avaliado antes de confirmar a solução e o âmbito.",
    bullets: [
      "Chrome Delete",
      "Óticas e aplicações parciais",
      "Projetos em duas rodas",
      "Sujeito a avaliação",
    ],
  },
];
