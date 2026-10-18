import React from "react";
import Link from "next/link";
import {
  Building,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";

interface OrganizationInfo {
  name: string;
  timezone: string | null;
  locale: string | null;
  currency: string | null;
}

interface LocationInfo {
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  email: string | null;
  phone: string | null;
}

function locationLine(location: LocationInfo | null): string {
  if (!location) return "Sem localização registada";
  const parts = [
    location.address,
    [location.postal_code, location.city].filter(Boolean).join(" "),
  ].filter((part) => part && part.trim() !== "");
  return parts.length > 0 ? parts.join(", ") : "Sem morada registada";
}

export function SettingsView({
  organization,
  location,
}: {
  organization: OrganizationInfo | null;
  location: LocationInfo | null;
}) {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Configurações da Oficina
          </h1>
          <p className="text-xs text-[#a9adae]">
            Dados institucionais da organização. Nesta versão a página é apenas de leitura.
          </p>
        </div>
        <span className="self-start rounded-md border border-white/10 bg-[#101314] px-3 py-1.5 text-[11px] font-semibold text-[#a9adae]">
          Somente leitura
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
          Atalhos
        </span>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/settings/pricing" className="group block">
            <Card className="p-5 flex items-center gap-4 bg-[#101314] border border-white/[0.06] group-hover:border-[#d3a548]/40 transition-colors cursor-pointer h-full">
              <div className="p-2.5 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30 shrink-0">
                <Wallet className="h-5 w-5 text-[#d3a548]" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold text-[#f1ede5] group-hover:text-[#f7d46d] transition-colors">
                  Orçamentos e preços
                </span>
                <span className="text-xs text-[#a9adae]">
                  Rubricas mensais, base financeira, fórmulas e kits
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#8a9092] ml-auto shrink-0 group-hover:text-[#d3a548] transition-colors" />
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <Building className="h-5 w-5 text-[#d3a548]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Identidade Institucional
            </h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Designação Social</dt>
              <dd className="text-[#f1ede5]">{organization?.name ?? "Não registada"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Localização</dt>
              <dd className="text-[#f1ede5]">{location?.name ?? "Não registada"}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-[#a9adae] font-semibold">Morada</dt>
              <dd className="text-[#f1ede5]">{locationLine(location)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Email</dt>
              <dd className="text-[#f1ede5]">{location?.email ?? "Não registado"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Telefone</dt>
              <dd className="text-[#f1ede5]">{location?.phone ?? "Não registado"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Fuso horário</dt>
              <dd className="text-[#f1ede5] font-mono">{organization?.timezone ?? "Não definido"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[#a9adae] font-semibold">Moeda / Idioma</dt>
              <dd className="text-[#f1ede5] font-mono">
                {organization?.currency ?? "Não definida"} · {organization?.locale ?? "Não definido"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <ShieldCheck className="h-5 w-5 text-[#68a46b]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Parâmetros financeiros e regras
            </h2>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-[#0c0f10] border border-white/[0.06] px-3 py-3 text-xs text-[#a9adae]">
            <Info className="h-4 w-4 text-[#d3a548] shrink-0 mt-0.5" />
            <span>
              Os parâmetros que afetam preços e margens são geridos em Orçamentos e preços, com
              histórico de versões. As regras de check-in e de controlo de qualidade são aplicadas
              pelo fluxo operacional; não são editáveis nesta página.
            </span>
          </div>

          <Link
            href="/settings/pricing"
            className={buttonStyles({ variant: "outline", size: "sm", className: "self-start" })}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Abrir Orçamentos e preços</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
