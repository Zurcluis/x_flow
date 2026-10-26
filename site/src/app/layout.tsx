import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";
import "./site.css";

function getMetadataBase() {
  try {
    return new URL(siteConfig.url);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "automotive",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/images/og-xmotion.webp",
        width: 1200,
        height: 630,
        alt: "BMW M3 em tom azul-violeta, trabalho X-Motion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/images/og-xmotion.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#101211",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AutoBodyShop",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  image: `${siteConfig.url}/images/og-xmotion.webp`,
  areaServed: {
    "@type": "City",
    name: siteConfig.locality,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: siteConfig.locality,
    addressRegion: siteConfig.region,
    addressCountry: siteConfig.country,
  },
  sameAs: [siteConfig.instagram],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        <a className="skip-link" href="#conteudo">
          Saltar para o conteúdo
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}

