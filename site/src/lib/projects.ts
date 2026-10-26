export const projectFilters = ["Todos", "PPF", "Car Wrap", "Personalização", "Mota"] as const;

export type ProjectFilter = (typeof projectFilters)[number];
export type ProjectCategory = Exclude<ProjectFilter, "Todos">;

export type ProjectImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  categories: ProjectCategory[];
  description: string;
  gallery: ProjectImage[];
  wide?: boolean;
};

export const projects: Project[] = [
  {
    slug: "bmw-m3",
    title: "BMW M3",
    subtitle: "Azul-violeta",
    tag: "CAR WRAP",
    image: "/images/projects/bmw-m3/cover.webp",
    width: 1000,
    height: 1250,
    alt: "BMW M3 em tom azul-violeta, trabalho X-Motion",
    categories: ["Car Wrap"],
    description:
      "Uma mudança de cor profunda, com brilho e reflexos que valorizam as linhas do M3. O resultado foi pensado para o carro e para o uso real.",
    gallery: [
      {
        src: "/images/projects/bmw-m3/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente do BMW M3 em tom azul-violeta",
      },
      {
        src: "/images/projects/bmw-m3/03.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira do BMW M3 ao pôr do sol",
      },
      {
        src: "/images/projects/bmw-m3/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da carroçaria do BMW M3",
      },
    ],
  },
  {
    slug: "ferrari-458-speciale",
    title: "Ferrari 458 Speciale",
    subtitle: "Proteção PPF",
    tag: "PPF",
    image: "/images/projects/ferrari-458-speciale/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Ferrari 458 Speciale com proteção PPF, no atelier X-Motion",
    categories: ["PPF"],
    description:
      "Proteção PPF aplicada com atenção às zonas expostas e aos contornos da carroçaria. O brilho original mantém-se, com uma camada de cuidado adicional.",
    gallery: [
      {
        src: "/images/projects/ferrari-458-speciale/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente da Ferrari 458 Speciale no atelier",
      },
      {
        src: "/images/projects/ferrari-458-speciale/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da roda e dos travões da Ferrari 458 Speciale",
      },
      {
        src: "/images/projects/ferrari-458-speciale/04-process.webp",
        width: 1000,
        height: 1250,
        alt: "Aplicação de película PPF numa entrada de ar da Ferrari 458 Speciale",
      },
      {
        src: "/images/projects/ferrari-458-speciale/05-finish.webp",
        width: 1000,
        height: 1250,
        alt: "Acabamento de película PPF à mão na Ferrari 458 Speciale",
      },
    ],
  },
  {
    slug: "bmw-m4",
    title: "BMW M4",
    subtitle: "Areia clara",
    tag: "CAR WRAP",
    image: "/images/projects/bmw-m4/cover.webp",
    width: 1000,
    height: 1250,
    alt: "BMW M4 em tom areia clara, trabalho X-Motion",
    categories: ["Car Wrap"],
    description:
      "Um tom quente e um acabamento uniforme, com atenção aos contornos, às grelhas e aos detalhes da carroçaria.",
    gallery: [
      {
        src: "/images/projects/bmw-m4/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira do BMW M4 em tom areia clara",
      },
      {
        src: "/images/projects/bmw-m4/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da jante e da lateral do BMW M4",
      },
      {
        src: "/images/projects/bmw-m4/04.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira do BMW M4 no atelier X-Motion",
      },
    ],
  },
  {
    slug: "lamborghini-huracan",
    title: "Lamborghini Huracán",
    subtitle: "Preto profundo",
    tag: "X-MOTION",
    image: "/images/projects/lamborghini-huracan/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Lamborghini Huracán em preto profundo, trabalho X-Motion",
    categories: ["Personalização"],
    description:
      "Um trabalho de presença, com acabamento escuro e contraste nos detalhes. Cada superfície foi tratada para valorizar a forma do Huracán.",
    gallery: [
      {
        src: "/images/projects/lamborghini-huracan/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente do Lamborghini Huracán no atelier",
      },
      {
        src: "/images/projects/lamborghini-huracan/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da frente e da roda do Lamborghini Huracán",
      },
      {
        src: "/images/projects/lamborghini-huracan/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do spoiler traseiro do Lamborghini Huracán",
      },
      {
        src: "/images/projects/lamborghini-huracan/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do emblema Lamborghini",
      },
    ],
  },
  {
    slug: "mercedes-maybach",
    title: "Mercedes-Maybach",
    subtitle: "Dois tons",
    tag: "CAR WRAP",
    image: "/images/projects/mercedes-maybach/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Mercedes-Maybach de dois tons, trabalho X-Motion",
    categories: ["Car Wrap"],
    description:
      "Dois tons, uma leitura de contraste. O projeto foi executado com atenção às linhas, às molduras e aos acabamentos.",
    gallery: [
      {
        src: "/images/projects/mercedes-maybach/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista lateral da Mercedes-Maybach de dois tons",
      },
      {
        src: "/images/projects/mercedes-maybach/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da grelha frontal da Mercedes-Maybach",
      },
      {
        src: "/images/projects/mercedes-maybach/04.webp",
        width: 1000,
        height: 1250,
        alt: "Mercedes-Maybach no espaço do atelier",
      },
    ],
  },
  {
    slug: "bmw-s1000rr",
    title: "BMW S1000RR",
    subtitle: "Carbono e azul",
    tag: "MOTA",
    image: "/images/projects/bmw-s1000rr/cover.webp",
    width: 1000,
    height: 1250,
    alt: "BMW S1000RR com aplicações em carbono e azul, trabalho X-Motion",
    categories: ["Personalização", "Mota"],
    description:
      "Aplicações e detalhes pensados para uma moto desportiva, com acabamento cuidado e uma leitura própria.",
    gallery: [
      {
        src: "/images/projects/bmw-s1000rr/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista lateral da BMW S1000RR",
      },
      {
        src: "/images/projects/bmw-s1000rr/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da frente da BMW S1000RR",
      },
      {
        src: "/images/projects/bmw-s1000rr/04.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira da BMW S1000RR no atelier",
      },
    ],
  },
  {
    slug: "mercedes-cle300",
    title: "Mercedes CLE 300",
    subtitle: "Branco",
    tag: "X-MOTION",
    image: "/images/projects/mercedes-cle300/cover-wide.webp",
    width: 2400,
    height: 800,
    alt: "Mercedes CLE 300 branco no atelier X-Motion",
    categories: ["Personalização"],
    description:
      "Um coupé preparado no atelier, com acabamento limpo e atenção aos detalhes que definem o conjunto.",
    gallery: [
      {
        src: "/images/projects/mercedes-cle300/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente do Mercedes CLE 300 no atelier X-Motion",
      },
      {
        src: "/images/projects/mercedes-cle300/03.webp",
        width: 1000,
        height: 1250,
        alt: "Vista lateral do Mercedes CLE 300",
      },
      {
        src: "/images/projects/mercedes-cle300/04.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira do Mercedes CLE 300",
      },
      {
        src: "/images/projects/mercedes-cle300/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da lateral do Mercedes CLE 300",
      },
    ],
    wide: true,
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
