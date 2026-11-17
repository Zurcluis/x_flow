export const projectFilters = ["Todos", "PPF", "Car Wrap", "Personalização", "Mota", "Especiais"] as const;

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
    alt: "Ferrari 458 Speciale com proteção PPF, no espaço X-Motion",
    categories: ["PPF"],
    description:
      "Proteção PPF aplicada com atenção às zonas expostas e aos contornos da carroçaria. O brilho original mantém-se, com uma camada de cuidado adicional.",
    gallery: [
      {
        src: "/images/projects/ferrari-458-speciale/02.webp",
        width: 1000,
        height: 1250,
        alt: "Jante forjada e escudo Scuderia da Ferrari 458 Speciale no espaço X-Motion",
      },
      {
        src: "/images/projects/ferrari-458-speciale/03.webp",
        width: 1000,
        height: 1250,
        alt: "Frente da Ferrari 458 Speciale em preparação PPF no espaço X-Motion",
      },
      {
        src: "/images/projects/ferrari-458-speciale/04-process.webp",
        width: 1000,
        height: 1250,
        alt: "Aplicação de película PPF na ótica e entrada de ar da Ferrari 458 Speciale",
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
        alt: "Traseira do BMW M4 no espaço X-Motion",
      },
    ],
  },
  {
    slug: "lamborghini-huracan",
    title: "Lamborghini Huracán LP610",
    subtitle: "Preto acetinado · Wrap, pinças e óticas",
    tag: "CAR WRAP",
    image: "/images/projects/lamborghini-huracan/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Lamborghini Huracán LP610 em preto acetinado no espaço X-Motion",
    categories: ["Car Wrap", "Personalização"],
    description:
      "Transformação integral em preto acetinado executada no nosso espaço, complementada por pintura de pinças, aplicação de lettering e escurecimento de óticas.",
    gallery: [
      {
        src: "/images/projects/lamborghini-huracan/02.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira 3/4 do Lamborghini Huracán LP610 no espaço X-Motion",
      },
      {
        src: "/images/projects/lamborghini-huracan/03.webp",
        width: 1000,
        height: 1250,
        alt: "Perfil frontal e pinça dourada do Lamborghini Huracán LP610",
      },
      {
        src: "/images/projects/lamborghini-huracan/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da jante preta e pinça de travão do Lamborghini Huracán LP610",
      },
      {
        src: "/images/projects/lamborghini-huracan/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do lettering Lamborghini sobre o acabamento preto acetinado",
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
        alt: "Mercedes-Maybach no espaço X-Motion",
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
        alt: "Vista traseira da BMW S1000RR no espaço X-Motion",
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
    alt: "Mercedes CLE 300 branco no espaço X-Motion",
    categories: ["Personalização"],
    description:
      "Um coupé preparado no nosso espaço, com acabamento limpo e atenção aos detalhes que definem o conjunto.",
    gallery: [
      {
        src: "/images/projects/mercedes-cle300/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente do Mercedes CLE 300 no espaço X-Motion",
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
  {
    slug: "corvette-z06",
    title: "Chevrolet Corvette Z06",
    subtitle: "Azul vibrante",
    tag: "CAR WRAP",
    image: "/images/projects/corvette-z06/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Chevrolet Corvette Z06 em azul vibrante no espaço X-Motion",
    categories: ["Car Wrap", "Personalização"],
    description:
      "Do acabamento original a um azul vibrante aplicado no nosso espaço, respeitando as entradas de ar e cada vinco aerodinâmico do Corvette Z06.",
    gallery: [
      {
        src: "/images/projects/corvette-z06/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira 3/4 do Chevrolet Corvette Z06 no espaço X-Motion",
      },
      {
        src: "/images/projects/corvette-z06/03.webp",
        width: 1000,
        height: 1250,
        alt: "Motor V8 do Chevrolet Corvette Z06 sob reflexo X-Motion",
      },
      {
        src: "/images/projects/corvette-z06/04.webp",
        width: 1000,
        height: 1250,
        alt: "Frente simétrica do Chevrolet Corvette Z06 no espaço X-Motion",
      },
      {
        src: "/images/projects/corvette-z06/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da entrada de ar lateral do Chevrolet Corvette Z06",
      },
    ],
  },
  {
    slug: "porsche-911-gt3",
    title: "Porsche 911 GT3",
    subtitle: "Midnight Navy Blue · Color PPF",
    tag: "COLOR PPF",
    image: "/images/projects/porsche-911-gt3/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Porsche 911 GT3 em Midnight Navy Blue Color PPF no espaço X-Motion",
    categories: ["PPF", "Car Wrap"],
    description:
      "Mudança do branco original para Midnight Navy Blue com Color PPF, juntando presença estética e proteção da pintura original numa só aplicação.",
    gallery: [
      {
        src: "/images/projects/porsche-911-gt3/02.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira do Porsche 911 GT3 no espaço X-Motion",
      },
      {
        src: "/images/projects/porsche-911-gt3/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da jante e pinça amarela do Porsche 911 GT3",
      },
      {
        src: "/images/projects/porsche-911-gt3/04.webp",
        width: 1000,
        height: 1250,
        alt: "Soleira em carbono e acabamento interior do Porsche 911 GT3",
      },
      {
        src: "/images/projects/porsche-911-gt3/05.webp",
        width: 1000,
        height: 1250,
        alt: "Asa traseira e ótica do Porsche 911 GT3 no espaço X-Motion",
      },
    ],
  },
  {
    slug: "mercedes-amg-gts",
    title: "Mercedes-AMG GT S",
    subtitle: "Azul metálico",
    tag: "CAR WRAP",
    image: "/images/projects/mercedes-amg-gts/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Mercedes-AMG GT S em azul metálico no espaço X-Motion",
    categories: ["Car Wrap"],
    description:
      "Recebido em branco e entregue no nosso espaço em azul metálico profundo, com atenção contínua às grelhas, entradas de ar e contornos da carroçaria.",
    gallery: [
      {
        src: "/images/projects/mercedes-amg-gts/02.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira do Mercedes-AMG GT S com asa fixa no espaço X-Motion",
      },
      {
        src: "/images/projects/mercedes-amg-gts/03.webp",
        width: 1000,
        height: 1250,
        alt: "Interior da porta e habitáculo do Mercedes-AMG GT S em estúdio",
      },
      {
        src: "/images/projects/mercedes-amg-gts/04.webp",
        width: 1000,
        height: 1250,
        alt: "Perfil lateral completo do Mercedes-AMG GT S no espaço X-Motion",
      },
      {
        src: "/images/projects/mercedes-amg-gts/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da entrada lateral V8 Biturbo do Mercedes-AMG GT S",
      },
    ],
  },
  {
    slug: "audi-rs-q8",
    title: "Audi RS Q8",
    subtitle: "Preto mate · Full PPF e interior",
    tag: "FULL PPF",
    image: "/images/projects/audi-rs-q8/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Audi RS Q8 com Full PPF preto mate no espaço X-Motion",
    categories: ["PPF"],
    description:
      "Proteção integral em PPF preto mate no exterior e aplicação dedicada nas superfícies sensíveis do habitáculo, preservando cada painel e consola.",
    gallery: [
      {
        src: "/images/projects/audi-rs-q8/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente 3/4 do Audi RS Q8 com acabamento mate no espaço X-Motion",
      },
      {
        src: "/images/projects/audi-rs-q8/03.webp",
        width: 1000,
        height: 1250,
        alt: "Traseira do Audi RS Q8 no espaço X-Motion",
      },
      {
        src: "/images/projects/audi-rs-q8/04.webp",
        width: 1000,
        height: 1250,
        alt: "Consola interior do Audi RS Q8 protegida com PPF",
      },
      {
        src: "/images/projects/audi-rs-q8/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do quarto traseiro mate do Audi RS Q8",
      },
    ],
  },
  {
    slug: "aston-martin-vantage-f1",
    title: "Aston Martin Vantage F1",
    subtitle: "Preto e ácido lima",
    tag: "PERSONALIZAÇÃO",
    image: "/images/projects/aston-martin-vantage-f1/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Aston Martin Vantage F1 com detalhes em carbono e ácido lima no espaço X-Motion",
    categories: ["Personalização", "Car Wrap"],
    description:
      "Personalização sob medida com faixa central em preto mate, apontamentos em ácido lima no splitter, espelhos e difusor, e acabamento em carbono.",
    gallery: [
      {
        src: "/images/projects/aston-martin-vantage-f1/02.webp",
        width: 1000,
        height: 1250,
        alt: "Lateral do Aston Martin Vantage F1 com linha ácido lima no espaço X-Motion",
      },
      {
        src: "/images/projects/aston-martin-vantage-f1/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do splitter frontal em carbono com friso ácido lima",
      },
      {
        src: "/images/projects/aston-martin-vantage-f1/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da entrada lateral em carbono com emblema F1 Edition",
      },
      {
        src: "/images/projects/aston-martin-vantage-f1/05.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira do Aston Martin Vantage F1 no nosso espaço",
      },
    ],
  },
  {
    slug: "mercedes-amg-gt63",
    title: "Mercedes-AMG GT 63 S Coupé",
    subtitle: "Azul ciano · Full PPF",
    tag: "PPF",
    image: "/images/projects/mercedes-amg-gt63/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Mercedes-AMG GT 63 S Coupé azul ciano com Full PPF",
    categories: ["PPF"],
    description:
      "Proteção integral em PPF transparente para preservar o azul metálico original e a profundidade do brilho sem alterar o visual de fábrica.",
    gallery: [
      {
        src: "/images/projects/mercedes-amg-gt63/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira 3/4 do Mercedes-AMG GT 63 S Coupé",
      },
      {
        src: "/images/projects/mercedes-amg-gt63/03.webp",
        width: 1000,
        height: 1250,
        alt: "Vista aérea de drone do Mercedes-AMG GT 63 S Coupé",
      },
      {
        src: "/images/projects/mercedes-amg-gt63/04.webp",
        width: 1000,
        height: 1250,
        alt: "Interior e volante AMG do Mercedes-AMG GT 63 S Coupé",
      },
      {
        src: "/images/projects/mercedes-amg-gt63/05.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da asa em carbono e emblema AMG no Mercedes-AMG GT 63 S Coupé",
      },
    ],
  },
  {
    slug: "mercedes-600-sel-w140",
    title: "Mercedes 600 SEL W140 V12",
    subtitle: "Clássico 1992",
    tag: "CLÁSSICO",
    image: "/images/projects/mercedes-600-sel-w140/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Mercedes 600 SEL W140 V12 de 1992 no espaço X-Motion",
    categories: ["Personalização"],
    description:
      "Preparação e cuidado estético em estúdio de um exemplar icónico de 1992, preservando a sobriedade original do preto brilhante e as jantes Monoblock.",
    gallery: [
      {
        src: "/images/projects/mercedes-600-sel-w140/02.webp",
        width: 1000,
        height: 1250,
        alt: "Estrela frontal do Mercedes 600 SEL W140 no espaço X-Motion",
      },
      {
        src: "/images/projects/mercedes-600-sel-w140/03.webp",
        width: 1000,
        height: 1250,
        alt: "Perfil lateral do Mercedes 600 SEL W140 no espaço X-Motion",
      },
      {
        src: "/images/projects/mercedes-600-sel-w140/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe da jante Monoblock cromada do Mercedes 600 SEL W140",
      },
      {
        src: "/images/projects/mercedes-600-sel-w140/05.webp",
        width: 1000,
        height: 1250,
        alt: "Acabamento de detalhe em estúdio no Mercedes 600 SEL W140",
      },
    ],
  },
  {
    slug: "barco-ppf",
    title: "Embarcação PPF",
    subtitle: "Proteção de casco em PPF",
    tag: "PPF Náutico",
    image: "/images/projects/barco-ppf/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Casco de embarcação preto protegido com película PPF transparente pela X-Motion",
    categories: ["PPF", "Especiais"],
    description:
      "Aplicação de película de proteção de pintura (PPF) ao casco de uma embarcação de recreio preta, protegendo o acabamento contra abrasão, salinidade, UV e riscos de atracagem sem alterar o brilho original.",
    gallery: [
      {
        src: "/images/projects/barco-ppf/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Vista lateral do casco preto da embarcação após aplicação de PPF",
      },
      {
        src: "/images/projects/barco-ppf/02.webp",
        width: 1000,
        height: 1250,
        alt: "Posicionamento da película PPF transparente sobre o casco",
      },
      {
        src: "/images/projects/barco-ppf/03.webp",
        width: 1000,
        height: 1250,
        alt: "Moldagem de PPF na proa da embarcação com espátula técnica",
      },
      {
        src: "/images/projects/barco-ppf/04.webp",
        width: 1000,
        height: 1250,
        alt: "Acabamento contínuo da película protetora ao longo do casco",
      },
    ],
  },
  {
    slug: "honda-shadow",
    title: "Honda Shadow",
    subtitle: "Verde metálico camaleão",
    tag: "Mota Wrap",
    image: "/images/projects/honda-shadow/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Honda Shadow personalizada em vinil verde metálico no espaço X-Motion em Barcelos",
    categories: ["Mota", "Car Wrap"],
    description:
      "Mudança de cor integral numa Honda Shadow com película verde metálica profunda, preservando os cromados originais e a identidade clássica do depósito e guarda-lamas.",
    gallery: [
      {
        src: "/images/projects/honda-shadow/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Honda Shadow em verde metálico no espaço X-Motion",
      },
      {
        src: "/images/projects/honda-shadow/02.webp",
        width: 1000,
        height: 1250,
        alt: "Perfil lateral completo da Honda Shadow com contrastes em cromado",
      },
      {
        src: "/images/projects/honda-shadow/03.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do depósito da Honda Shadow com reflexo verde profundo",
      },
      {
        src: "/images/projects/honda-shadow/04.webp",
        width: 1000,
        height: 1250,
        alt: "Ângulo superior do depósito e guiador da Honda Shadow",
      },
    ],
  },
  {
    slug: "yamaha-mt10",
    title: "Yamaha MT-10",
    subtitle: "Preto acetinado & camaleão",
    tag: "Mota Wrap",
    image: "/images/projects/yamaha-mt10/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Yamaha MT-10 com wrap preto acetinado e apontamentos camaleão no espaço X-Motion",
    categories: ["Mota", "Car Wrap", "Personalização"],
    description:
      "Personalização completa de uma Yamaha MT-10 combinando base preto acetinado com painéis em vinil camaleão azul-violeta e grafismos discretos nas carenagens e depósito.",
    gallery: [
      {
        src: "/images/projects/yamaha-mt10/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Yamaha MT-10 em vista três quartos no espaço X-Motion",
      },
      {
        src: "/images/projects/yamaha-mt10/02.webp",
        width: 1000,
        height: 1250,
        alt: "Frente agressiva da Yamaha MT-10 com óticas LED e carenagem envolvida",
      },
      {
        src: "/images/projects/yamaha-mt10/03.webp",
        width: 1000,
        height: 1250,
        alt: "Transição de cor camaleão azul-violeta no depósito da MT-10",
      },
      {
        src: "/images/projects/yamaha-mt10/04.webp",
        width: 1000,
        height: 1250,
        alt: "Pormenor da entrada de ar e acabamento na carenagem lateral",
      },
    ],
  },
  {
    slug: "yamaha-tracer-900-gt",
    title: "Yamaha Tracer 900 GT",
    subtitle: "Preto acetinado & carbono forjado",
    tag: "Mota Wrap",
    image: "/images/projects/yamaha-tracer-900-gt/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Yamaha Tracer 900 GT em preto acetinado e carbono forjado no espaço X-Motion",
    categories: ["Mota", "Personalização"],
    description:
      "Transformação visual de uma Yamaha Tracer 900 GT com base em preto acetinado e aplicações em textura de carbono forjado nas carenagens, malas laterais e zonas de maior desgaste.",
    gallery: [
      {
        src: "/images/projects/yamaha-tracer-900-gt/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Yamaha Tracer 900 GT em preto acetinado no espaço X-Motion",
      },
      {
        src: "/images/projects/yamaha-tracer-900-gt/02.webp",
        width: 1000,
        height: 1250,
        alt: "Vista frontal da Yamaha Tracer 900 GT sob iluminação de estúdio",
      },
      {
        src: "/images/projects/yamaha-tracer-900-gt/03.webp",
        width: 1000,
        height: 1250,
        alt: "Aplicação em carbono forjado nas carenagens frontais e laterais",
      },
      {
        src: "/images/projects/yamaha-tracer-900-gt/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe macro da textura de carbono forjado e cortes limpos",
      },
    ],
  },
  {
    slug: "triciclo-custom",
    title: "Triciclo Custom",
    subtitle: "Acabamento metalizado & detalhes",
    tag: "Projeto Especial",
    image: "/images/projects/triciclo-custom/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Triciclo motorizado personalizado com acabamento metalizado e detalhes em carbono",
    categories: ["Especiais", "Personalização"],
    description:
      "Trabalho de proteção e personalização em triciclo motorizado de carroçaria aberta, com atenção às curvas pronunciadas dos guarda-lamas traseiros, apontamentos em carbono e superfícies cromadas.",
    gallery: [
      {
        src: "/images/projects/triciclo-custom/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Vista frontal simétrica do triciclo customizado",
      },
      {
        src: "/images/projects/triciclo-custom/02.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe frontal da suspensão, óticas e carroçaria metalizada",
      },
      {
        src: "/images/projects/triciclo-custom/03.webp",
        width: 1000,
        height: 1250,
        alt: "Acabamento lateral junto ao escape e bancos estofados",
      },
      {
        src: "/images/projects/triciclo-custom/04.webp",
        width: 1000,
        height: 1250,
        alt: "Painel de instrumentos cromado e comandos do guiador",
      },
    ],
  },
  {
    slug: "citroen-ami",
    title: "Citroën Ami",
    subtitle: "Cinzento metálico acetinado",
    tag: "Quadriciclo Wrap",
    image: "/images/projects/citroen-ami/cover.webp",
    width: 1000,
    height: 1250,
    alt: "Citroën Ami envolvido em vinil cinzento metálico acetinado pela X-Motion",
    categories: ["Car Wrap", "Especiais"],
    description:
      "Mudança de cor completa num quadriciclo elétrico Citroën Ami para cinzento metálico acetinado, transformando os painéis exteriores originais num acabamento uniforme e resistente ao uso urbano.",
    gallery: [
      {
        src: "/images/projects/citroen-ami/cover.webp",
        width: 1000,
        height: 1250,
        alt: "Vista traseira três quartos do Citroën Ami em cinzento acetinado",
      },
      {
        src: "/images/projects/citroen-ami/02.webp",
        width: 1000,
        height: 1250,
        alt: "Perfil lateral do Citroën Ami com acabamento acetinado uniforme",
      },
      {
        src: "/images/projects/citroen-ami/03.webp",
        width: 1000,
        height: 1250,
        alt: "Recorte junto ao farolim e texturização do painel em vinil acetinado",
      },
      {
        src: "/images/projects/citroen-ami/04.webp",
        width: 1000,
        height: 1250,
        alt: "Detalhe do emblema frontal aplicado sobre o vinil cinzento acetinado",
      },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
