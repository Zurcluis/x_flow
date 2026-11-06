import type { ProjectCategory } from "@/lib/projects";
import type { ProposalService } from "@/lib/proposal";

export type ServiceId = "ppf" | "car-wrap" | "color-ppf" | "detalhes";

export type ServiceDetail = {
  id: ServiceId;
  number: string;
  name: string;
  short: string;
  description: string;
  bullets: string[];
  image: {
    src: string;
    width: number;
    height: number;
    alt: string;
  };
  proposalService: ProposalService;
  relatedCategories: ProjectCategory[];
  seoDescription: string;
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
    image: {
      src: "/images/services/ppf-process.webp",
      width: 1200,
      height: 800,
      alt: "Aplicação de película PPF numa Ferrari 458 Speciale",
    },
    proposalService: "PPF",
    relatedCategories: ["PPF"],
    seoDescription:
      "PPF em Barcelos: película de proteção para a pintura, adaptada às zonas expostas e ao uso de cada viatura. Peça uma avaliação na X-Motion.",
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
    image: {
      src: "/images/hero/m3.webp",
      width: 1600,
      height: 1067,
      alt: "BMW M3 em tom azul-violeta, trabalho X-Motion",
    },
    proposalService: "Car Wrap",
    relatedCategories: ["Car Wrap"],
    seoDescription:
      "Car Wrap em Barcelos: mudança de cor ou textura com preparação da superfície e atenção aos contornos. Conheça trabalhos e peça proposta.",
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
    image: {
      src: "/images/hero/lambo.webp",
      width: 1600,
      height: 1067,
      alt: "Lamborghini Huracán em preto profundo, trabalho X-Motion",
    },
    proposalService: "Color PPF",
    relatedCategories: [],
    seoDescription:
      "Color PPF em Barcelos: mudança de cor com película de proteção, avaliada para cada viatura. Fale connosco sobre o seu projeto.",
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
    image: {
      src: "/images/projects/bmw-s1000rr/cover.webp",
      width: 1000,
      height: 1250,
      alt: "BMW S1000RR com aplicações em carbono e azul, trabalho X-Motion",
    },
    proposalService: "Detalhes e óticas",
    relatedCategories: ["Personalização", "Mota"],
    seoDescription:
      "Detalhes e aplicações em Barcelos: Chrome Delete, óticas, aplicações parciais e projetos em duas rodas, sujeitos a avaliação.",
  },
];

export function getService(id: string) {
  return services.find((service) => service.id === id);
}
