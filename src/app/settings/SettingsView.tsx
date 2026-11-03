"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Building,
  ArrowRight,
  Wallet,
  Globe,
  Sliders,
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { updateOrganizationSettingsAction } from "@/app/actions/settings";
import type { OrganizationSettings } from "@/server/settings";

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

const ALL_SIDEBAR_ITEMS: Array<{ href: string; label: string; section: string }> = [
  { href: "/calendar", label: "Agenda", section: "Operação" },
  { href: "/production", label: "Produção", section: "Operação" },
  { href: "/time-book", label: "Time Book", section: "Operação" },
  { href: "/checkins", label: "Check-in", section: "Operação" },
  { href: "/vision", label: "X-Flow Vision", section: "Operação" },
  { href: "/simulator", label: "Simulador 3D", section: "Operação" },
  { href: "/stock", label: "Stock e Materiais", section: "Operação" },
  { href: "/tools", label: "Ferramentas", section: "Operação" },
  { href: "/customers", label: "Clientes", section: "Negócio" },
  { href: "/vehicles", label: "Viaturas / Itens", section: "Negócio" },
  { href: "/quotes", label: "Orçamentos", section: "Negócio" },
  { href: "/b2b", label: "Portal B2B", section: "Negócio" },
  { href: "/deliveries", label: "Entregas", section: "Negócio" },
  { href: "/team", label: "Equipa", section: "Gestão" },
  { href: "/finance", label: "Finanças", section: "Gestão" },
  { href: "/warranties", label: "Garantias", section: "Gestão" },
  { href: "/reports", label: "Relatórios", section: "Gestão" },
  { href: "/shop-floor", label: "Painel Oficina", section: "Sistema" },
  { href: "/design-system", label: "Design System", section: "Sistema" },
];

export function SettingsView({
  organization,
  location,
  initialSettings,
}: {
  organization: OrganizationInfo | null;
  location: LocationInfo | null;
  initialSettings: OrganizationSettings | null;
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "sidebar" ? "sidebar" : "general";
  const [activeTab, setActiveTab] = useState<"general" | "sidebar" | "pricing_jump">(initialTab);
  const [prevUrlTab, setPrevUrlTab] = useState(initialTab);
  if (prevUrlTab !== initialTab) {
    setPrevUrlTab(initialTab);
    setActiveTab(initialTab);
  }
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initialSettings?.googleReviewUrl ?? "https://maps.app.goo.gl/W3RiGThiUjNGyNwX6"
  );
  const [depositRequired, setDepositRequired] = useState(
    initialSettings?.depositRequired ?? false
  );
  const [depositPercentage, setDepositPercentage] = useState(
    initialSettings?.depositPercentage ?? 30
  );
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(() => {
    // If empty array, default all visible. Any item in hiddenItems is hidden.
    return new Set(initialSettings?.sidebarVisibleItems ?? []);
  });

  const handleToggleItem = (href: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const handleSaveSettings = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await updateOrganizationSettingsAction({
        googleReviewUrl,
        depositRequired,
        depositPercentage: Number(depositPercentage),
        sidebarVisibleItems: Array.from(hiddenItems),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "Configurações guardadas com sucesso!" });
      } else {
        setStatusMessage({ type: "error", text: res.error || "Erro ao guardar definições." });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Configurações do Sistema
          </h1>
          <p className="text-xs text-[#a9adae]">
            Gere parâmetros da oficina, regras de sinal, integração de Google Review e personalização da barra lateral.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isPending}
          className={buttonStyles({
            variant: "primary",
            size: "sm",
            className: "flex items-center gap-2 bg-[#d3a548] text-black hover:bg-[#e0b459] font-bold shadow-md cursor-pointer",
          })}
        >
          <Save className="h-4 w-4" />
          <span>{isPending ? "A guardar..." : "Guardar Alterações"}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-[#68a46b]/15 text-[#68a46b] border border-[#68a46b]/30"
              : "bg-red-500/15 text-red-400 border border-red-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "general"
              ? "border-[#d3a548] text-[#f7d46d] bg-white/[0.02]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Geral e Pós-Venda</span>
        </button>
        <button
          onClick={() => setActiveTab("sidebar")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "sidebar"
              ? "border-[#d3a548] text-[#f7d46d] bg-white/[0.02]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Barra Lateral (Módulos Visíveis)</span>
        </button>
      </div>

      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regras Comerciais e Sinal */}
          <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
              <DollarSign className="h-5 w-5 text-[#d3a548]" />
              <h2 className="font-bold text-sm text-[#f1ede5]">
                Sinal e Condições de Adjudicação
              </h2>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={depositRequired}
                  onChange={(e) => setDepositRequired(e.target.checked)}
                  className="rounded border-white/20 bg-[#0c0f10] text-[#d3a548] focus:ring-[#d3a548] h-4 w-4"
                />
                <span className="text-[#f1ede5] font-semibold">
                  Exigir pagamento de sinal na aprovação do orçamento
                </span>
              </label>

              {depositRequired && (
                <div className="flex flex-col gap-2 pl-7 pt-2 border-l border-white/[0.06]">
                  <label className="text-[#a9adae] font-semibold">
                    Percentagem de sinal sugerida / obrigatória (%):
                  </label>
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(Number(e.target.value))}
                      className="w-full bg-[#0c0f10] border border-white/10 rounded px-3 py-1.5 text-[#f1ede5] focus:outline-none focus:border-[#d3a548]"
                    />
                    <span className="text-[#8a9092] font-bold">%</span>
                  </div>
                  <span className="text-[11px] text-[#8a9092]">
                    Exemplo: 30% ou 50% para reserva de material e vaga na agenda.
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Google Review e Reputação */}
          <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
              <Globe className="h-5 w-5 text-[#d3a548]" />
              <h2 className="font-bold text-sm text-[#f1ede5]">
                Avaliações Google Business
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <label className="text-[#a9adae] font-semibold">
                Link direto do Google Business para recolha de reviews:
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full bg-[#0c0f10] border border-white/10 rounded px-3 py-2 text-[#f1ede5] focus:outline-none focus:border-[#d3a548]"
              />
              <span className="text-[11px] text-[#8a9092]">
                Quando o cliente concluir o inquérito de satisfação com nota 4 ou 5 estrelas, é convidado a deixar a crítica neste link.
              </span>
            </div>
          </Card>

          {/* Identidade Institucional da Empresa */}
          <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06] lg:col-span-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
              <Building className="h-5 w-5 text-[#d3a548]" />
              <h2 className="font-bold text-sm text-[#f1ede5]">
                Identidade Institucional da Oficina
              </h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="text-[#a9adae] font-semibold">Designação Social</dt>
                <dd className="text-[#f1ede5] font-medium">{organization?.name ?? "X-Motion"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[#a9adae] font-semibold">Localização / Oficina</dt>
                <dd className="text-[#f1ede5] font-medium">{location?.name ?? "Barcelos"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[#a9adae] font-semibold">Contacto</dt>
                <dd className="text-[#f1ede5] font-medium">{location?.phone ?? location?.email ?? "Não definido"}</dd>
              </div>
            </dl>
          </Card>

          {/* Atalho Preços */}
          <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06] lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-5 w-5 text-[#d3a548]" />
                <div>
                  <h2 className="font-bold text-sm text-[#f1ede5]">Preços, Fórmulas e Custos da Oficina</h2>
                  <p className="text-xs text-[#a9adae]">Edição de mão de obra por hora, despesas mensais, margens e kits de consumíveis.</p>
                </div>
              </div>
              <Link
                href="/settings/pricing"
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                <span>Configurar Preços</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "sidebar" && (
        <Card className="p-6 flex flex-col gap-6 bg-[#101314] border border-white/[0.06]">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-sm text-[#f1ede5]">Personalizar Barra Lateral</h2>
            <p className="text-xs text-[#a9adae]">
              Escolhe que itens queres ver na barra de navegação. Os itens desmarcados não são apagados; apenas ficam ocultos do menu diário para manter a interface mais limpa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_SIDEBAR_ITEMS.map((item) => {
              const isHidden = hiddenItems.has(item.href);
              return (
                <div
                  key={item.href}
                  onClick={() => handleToggleItem(item.href)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    !isHidden
                      ? "bg-[#1f1b14] border-[#d3a548]/40 text-[#f7d46d]"
                      : "bg-[#0c0f10] border-white/[0.04] text-[#8a9092] hover:border-white/10"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{item.label}</span>
                    <span className="text-[10px] text-[#8a9092]">{item.section}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      !isHidden
                        ? "bg-[#d3a548]/20 text-[#d3a548]"
                        : "bg-white/[0.05] text-[#8a9092]"
                    }`}
                  >
                    {!isHidden ? "Visível" : "Oculto"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
