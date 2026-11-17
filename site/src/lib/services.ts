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
    short: "Película de proteção para a pintura.",
    description:
      "Película de proteção transparente e autorreparável (Paint Protection Film) contra gravilha, insetos, pequenos riscos e desgaste diário. Disponível em Pack Frontal ou Cobertura Integral, em acabamento brilho ou mate, após avaliação da viatura.",
    bullets: [
      "Pack frontal (para-choques, capô, guarda-lamas, óticas e espelhos) ou cobertura integral",
      "Acabamento transparente brilho ou mate/acetinado, 100% reversível",
      "Proteção de consolas e superfícies interiores sensíveis",
    ],
    image: {
      src: "/images/services/ppf-process.webp",
      width: 1200,
      height: 800,
      alt: "Aplicação de película PPF numa Ferrari 458 Speciale no espaço X-Motion em Barcelos",
    },
    proposalService: "PPF",
    relatedCategories: ["PPF"],
    seoDescription:
      "Aplicação de PPF (Paint Protection Film) em Barcelos e Braga: proteção de pintura em Pack Frontal ou Cobertura Integral, brilho ou mate. Peça avaliação na X-Motion.",
  },
  {
    id: "car-wrap",
    number: "02",
    name: "Car Wrap",
    short: "Mudança de cor em vinil automóvel.",
    description:
      "Mudança integral ou parcial de cor e textura em vinil automóvel — brilho, mate, acetinado ou carbono — com preparação da pintura, desmontagem controlada quando necessário e acabamento limpo nos contornos. Solução reversível para renovar o visual preservando a pintura de origem.",
    bullets: [
      "Mudança integral de cor ou personalização parcial (tejadilho, espelhos, faixas)",
      "Preparação técnica da superfície antes da aplicação",
      "Acabamento de contornos e encaixes com amostra física no nosso espaço",
    ],
    image: {
      src: "/images/hero/m3.webp",
      width: 1600,
      height: 1067,
      alt: "BMW M3 com Car Wrap em tom azul-violeta aplicado pela X-Motion em Barcelos",
    },
    proposalService: "Car Wrap",
    relatedCategories: ["Car Wrap"],
    seoDescription:
      "Car Wrap em Barcelos e Norte de Portugal: mudança de cor automóvel em vinil brilho, mate ou acetinado, com preparação e acabamento nos contornos. Peça orçamento na X-Motion.",
  },
  {
    id: "color-ppf",
    number: "03",
    name: "Color PPF",
    short: "Cor e proteção numa só película.",
    description:
      "Película de proteção pigmentada que combina mudança estética de cor com maior resistência mecânica a gravilha e pequenos impactos do que o vinil tradicional. Indicada para quem procura uma presença exclusiva sem separar cor e proteção.",
    bullets: [
      "Cor exclusiva e proteção física na mesma aplicação",
      "Opções de acabamento brilho ou acetinado confirmadas em amostra",
      "Avaliação prévia da viatura e das zonas a cobrir em Barcelos",
    ],
    image: {
      src: "/images/hero/lambo.webp",
      width: 1600,
      height: 1067,
      alt: "Lamborghini Huracán com acabamento escuro no espaço X-Motion em Barcelos",
    },
    proposalService: "Color PPF",
    relatedCategories: [],
    seoDescription:
      "Color PPF em Barcelos e Braga: película pigmentada que junta mudança de cor e proteção de pintura para o seu automóvel. Fale com a X-Motion.",
  },
  {
    id: "detalhes",
    number: "04",
    name: "Detalhes",
    short: "Chrome Delete, óticas e aplicações.",
    description:
      "Personalização e proteção de pormenor: Chrome Delete (eliminação de cromados em preto brilho ou mate), proteção e escurecimento de óticas, tejadilhos, espelhos, pintura de pinças, interiores e projetos em duas rodas.",
    bullets: [
      "Chrome Delete em frisos, grelhas, barras de tejadilho e emblemas",
      "Proteção e escurecimento de óticas, espelhos e aplicações parciais",
      "Proteção PPF e wrap em motas e acabamentos interiores",
      "Âmbito e orçamento definidos após avaliação da viatura",
    ],
    image: {
      src: "/images/projects/bmw-s1000rr/cover.webp",
      width: 1000,
      height: 1250,
      alt: "BMW S1000RR com aplicações em carbono e azul realizadas pela X-Motion em Barcelos",
    },
    proposalService: "Detalhes e óticas",
    relatedCategories: ["Personalização", "Mota"],
    seoDescription:
      "Chrome Delete, escurecimento de óticas, wrap de motas e detalhes automóveis em Barcelos e Braga. Soluções à medida na X-Motion.",
  },
];

export function getService(id: string) {
  return services.find((service) => service.id === id);
}
