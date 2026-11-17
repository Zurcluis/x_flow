const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const fallbackUrl = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";

export const siteConfig = {
  name: "X-Motion",
  title: "X-Motion | PPF, Car Wrap e Color PPF em Barcelos e Braga",
  description:
    "Oficina especializada em PPF (película de proteção de pintura), Car Wrap, Color PPF e Chrome Delete em Barcelos, Braga e Norte de Portugal. Peça avaliação para o seu carro.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/$/, ""),
  instagram: "https://www.instagram.com/x_motion.wrap/",
  facebook: "https://www.facebook.com/people/X_Motion/100095184768697/",
  maps: "https://maps.app.goo.gl/cZEHfTZ9kZrhxm5Q8",
  email: "xmotionwrap@gmail.com",
  emailHref: "mailto:xmotionwrap@gmail.com",
  phone: "+351 934 644 142",
  phoneHref: "tel:+351934644142",
  whatsapp:
    "https://wa.me/351934644142?text=Ol%C3%A1%20X-Motion%2C%20gostava%20de%20saber%20mais%20sobre%20os%20vossos%20servi%C3%A7os.",
  address: {
    street: "R. Odete Hermenegildo 1286, Pavilhão 4 D",
    postalCode: "4750-841",
    locality: "Vila Frescainha (São Pedro)",
    city: "Barcelos",
    region: "Braga",
    country: "PT",
  },
  geo: {
    latitude: 41.5232525,
    longitude: -8.6461582,
  },
  hours: [
    { days: "Segunda a sexta", time: "08:00 – 17:00" },
    { days: "Sábado", time: "09:00 – 13:00" },
  ],
  location: "Barcelos, Portugal",
  locality: "Barcelos",
  region: "Braga",
  country: "PT",
  serviceAreas: [
    "Barcelos",
    "Braga",
    "Vila Nova de Famalicão",
    "Guimarães",
    "Viana do Castelo",
    "Porto",
  ],
} as const;

export const navItems = [
  { href: "/servicos", label: "Serviços" },
  { href: "/projetos", label: "Projetos" },
  { href: "/estudio", label: "Estúdio de cor" },
  { href: "/sobre", label: "Sobre nós" },
  { href: "/contactos", label: "Contactos" },
] as const;

export const proposalHref = "/orcamento";
