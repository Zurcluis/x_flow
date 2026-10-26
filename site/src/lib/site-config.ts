const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const fallbackUrl = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";

export const siteConfig = {
  name: "X-Motion",
  title: "X-Motion | PPF & Car Wrap em Barcelos",
  description:
    "Proteção e personalização automóvel em Barcelos. PPF, Car Wrap, Color PPF e detalhes, com cuidado em cada etapa.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/$/, ""),
  instagram: "https://www.instagram.com/x_motion.wrap/",
  location: "Barcelos, Portugal",
  locality: "Barcelos",
  region: "Braga",
  country: "PT",
} as const;

export const navItems = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#projetos", label: "Projetos" },
  { href: "/#estudio", label: "Estúdio de cor" },
  { href: "/#atelier", label: "O atelier" },
] as const;
