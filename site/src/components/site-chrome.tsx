"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFocusedInstagramRoute = pathname === "/ig" || pathname.startsWith("/ig/");

  if (isFocusedInstagramRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
