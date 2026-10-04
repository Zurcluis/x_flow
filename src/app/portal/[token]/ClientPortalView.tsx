"use client";

import React, { useState } from "react";
import {
  Award,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/xflow/Logo";
import { formatCurrency } from "@/lib/formatting";
import type { PublicQuote } from "@/domains/quotes/types";
import {
  approvePublicQuoteAction,
  rejectPublicQuoteAction,
} from "@/app/actions/quotes";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  sent: "Proposta enviada",
  viewed: "Vista pelo cliente",
  approved: "Aprovada",
  rejected: "Recusada",
  expired: "Expirada",
};

const TIER_LABEL: Record<string, string> = {
  essential: "Essencial",
  recommended: "Recomendada",
  premium: "Premium",
};

function vatPercentLabel(rate: number): string {
  // quote_options.vat_rate é fração (0.23 = 23%)
  const percent = Math.round(rate * 100);
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

function displayLineLabel(line: {
  kind: "service" | "material";
  name: string;
  quantity?: number | null;
  unitLabel?: string | null;
}): string {
  if (line.kind === "material") {
    const suffix =
      line.quantity && line.quantity > 1 && line.unitLabel
        ? ` — ${line.quantity} ${line.unitLabel}`
        : "";
    return `Fornecimento de ${line.name}${suffix}`;
  }
  return line.name;
}

export function ClientPortalView({
  quote,
  token,
}: {
  quote: PublicQuote;
  token: string;
}) {
  const [status, setStatus] = useState(quote.status);
  const [selectedOptionId, setSelectedOptionId] = useState(
    quote.selectedOptionId ?? ""
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDecide = status === "sent" || status === "viewed" || status === "draft";

  const handleAccept = async (optionId: string) => {
    setBusy(optionId);
    setError(null);
    const result = await approvePublicQuoteAction(token, optionId, quote.customerName);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "Erro ao aceitar a proposta.");
      return;
    }
    setSelectedOptionId(optionId);
    setStatus("approved");
  };

  const handleReject = async () => {
    setBusy("reject");
    setError(null);
    const result = await rejectPublicQuoteAction(token);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "Erro ao recusar a proposta.");
      return;
    }
    setStatus("rejected");
  };

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Header */}
        <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/[0.08]">
          <Logo variant="full" size="md" />
          <Badge
            variant="outline"
            className="bg-[#d3a548]/10 text-[#f7d46d] border-[#d3a548]/30 px-3 py-1 font-mono text-xs"
          >
            Portal do Cliente
          </Badge>
        </header>

        {/* Hero */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.08] shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[#8a9092]">
                Proposta {quote.quoteNumber} · {STATUS_LABEL[status] ?? status}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {quote.vehicleModel}
                {quote.vehicleYear ? ` (${quote.vehicleYear})` : ""}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#a9adae]">
                <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono font-bold text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1.5 text-[11px] font-sans">P</span>
                  <span>{quote.vehiclePlate}</span>
                </div>
                {quote.vehicleColor && <span>{quote.vehicleColor}</span>}
                <span>·</span>
                <span>Bem-vindo, {quote.customerName}</span>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs px-3 py-1.5 font-bold ${
                status === "approved"
                  ? "bg-[#68a46b]/20 text-[#68a46b] border-[#68a46b]/30"
                  : status === "rejected"
                  ? "bg-[#f05a50]/20 text-[#f05a50] border-[#f05a50]/30"
                  : "bg-[#d3a548]/20 text-[#f7d46d] border-[#d3a548]/30"
              }`}
            >
              {status === "approved" && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              {status === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1" />}
              {STATUS_LABEL[status] ?? status}
            </Badge>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#f1ede5]">
            {canDecide ? "Escolhe a tua proposta" : "Opções propostas"}
          </h2>

          {quote.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isThisBusy = busy === opt.id;
            return (
              <Card
                key={opt.id}
                className={`p-5 flex flex-col gap-3 ${
                  isSelected
                    ? "border-[#68a46b]/60 bg-[#141b17]"
                    : "bg-[#101314] border-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#d3a548]">
                        {TIER_LABEL[opt.tier] ?? opt.tier}
                      </span>
                      <span className="font-bold text-sm text-[#f1ede5] truncate">{opt.name}</span>
                      {opt.isRecommended && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-[#d3a548]/10 text-[#f7d46d] border-[#d3a548]/30"
                        >
                          Recomendada
                        </Badge>
                      )}
                    </div>
                    {opt.description && (
                      <span className="text-xs text-[#a9adae]">{opt.description}</span>
                    )}
                    <span className="text-[11px] text-[#8a9092] flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-[#68a46b]" />
                      Garantia de {opt.warrantyYears} anos
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-[#f7d46d] whitespace-nowrap">
                    {formatCurrency(opt.totalWithVat)}
                  </span>
                </div>

                {opt.displayLines.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {opt.displayLines.map((line, index) => (
                      <li key={`${line.kind}-${index}`} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-[#f7d46d] shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[#f1ede5]">{displayLineLabel(line)}</span>
                          {line.kind === "service" && line.description && (
                            <span className="text-[11px] text-[#8a9092]">{line.description}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-col gap-1 p-3 rounded-sm bg-[#080a0b]/60 border border-white/[0.04] text-[11px]">
                  {opt.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#f7d46d]">
                      <span>Desconto ({opt.discountRate}%)</span>
                      <span className="tabular-nums">-{formatCurrency(opt.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#8a9092]">
                    <span>Base Tributável</span>
                    <span className="tabular-nums text-[#a9adae]">
                      {formatCurrency(opt.taxableBase)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#8a9092]">
                    <span>IVA ({vatPercentLabel(opt.vatRate)}%)</span>
                    <span className="tabular-nums text-[#a9adae]">
                      {formatCurrency(opt.vatAmount)}
                    </span>
                  </div>
                </div>

                {canDecide && (
                  <Button
                    variant={isSelected ? "outline" : "primary"}
                    size="sm"
                    onClick={() => handleAccept(opt.id)}
                    disabled={busy !== null}
                    className="mt-1 self-start"
                  >
                    {isThisBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>{isSelected ? "Opção aceita" : "Aceitar esta opção"}</span>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {error && <p className="text-xs font-semibold text-[#f05a50]">{error}</p>}

        {status === "approved" && (
          <div className="p-5 rounded-[16px] bg-[#141b17] border border-[#68a46b]/30 flex items-center gap-3 text-sm text-[#f1ede5]">
            <Award className="h-5 w-5 text-[#68a46b] shrink-0" />
            <span>
              Proposta aceite! A equipa X-Motion vai contactar-te para agendar a entrada da
              viatura.
            </span>
          </div>
        )}

        {canDecide && (
          <button
            type="button"
            onClick={handleReject}
            disabled={busy !== null}
            className="self-center text-[11px] text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy === "reject" ? "A processar…" : "Não tenho interesse nesta proposta"}
          </button>
        )}

        <footer className="py-6 mt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8a9092] gap-2">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            X-Flow by X-Motion — Documento oficial
          </span>
          <span>Oficina Oficial: Barcelos, Portugal</span>
        </footer>
      </div>
    </div>
  );
}
