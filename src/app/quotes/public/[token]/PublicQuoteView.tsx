"use client";

import React, { useState } from "react";
import {
  Car,
  Check,
  CheckCircle2,
  FileCheck,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import { formatCurrency } from "@/lib/formatting";
import { approvePublicQuoteAction } from "@/app/actions/quotes";
import type {
  PublicQuote,
  PublicQuoteOption,
  PublicQuoteOptionLine,
} from "@/domains/quotes/types";

const TIER_LABELS: Record<PublicQuoteOption["tier"], string> = {
  essential: "Essencial",
  recommended: "Recomendada",
  premium: "Premium",
};

function formatDatePtPT(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function vatPercentLabel(rate: number): string {
  // quote_options.vat_rate é fração (0.23 = 23%)
  const percent = Math.round(rate * 100);
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

function displayLineLabel(line: PublicQuoteOptionLine): string {
  if (line.kind === "material") {
    const suffix =
      line.quantity && line.quantity > 1 && line.unitLabel
        ? ` — ${line.quantity} ${line.unitLabel}`
        : "";
    return `Fornecimento de ${line.name}${suffix}`;
  }
  return line.name;
}

interface PublicOptionCardProps {
  option: PublicQuoteOption;
  isSelected: boolean;
  isInteractive: boolean;
  onSelect: (optionId: string) => void;
}

function PublicOptionCard({
  option,
  isSelected,
  isInteractive,
  onSelect,
}: PublicOptionCardProps) {
  return (
    <div
      onClick={() => isInteractive && onSelect(option.id)}
      className={`relative flex flex-col p-6 rounded-[20px] transition-all duration-200 ${
        isInteractive ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "bg-gradient-to-b from-[#1b2021] to-[#101314] border-2 border-[#d3a548] shadow-[0_12px_36px_rgba(211,165,72,0.15)]"
          : option.isRecommended
          ? "bg-[#141819] border border-[#d3a548]/50 hover:border-[#d3a548]"
          : "bg-[#101314] border border-white/[0.08] hover:border-white/20"
      }`}
    >
      {option.isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] text-[12px] font-extrabold shadow-md uppercase tracking-wider">
          <Star className="h-3 w-3 fill-current" />
          <span>Recomendada</span>
        </div>
      )}

      <div className="mt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold tracking-wider text-[#d3a548]">
              {TIER_LABELS[option.tier]}
            </span>
            <h3 className="font-extrabold text-lg text-[#f1ede5] mt-1">{option.name}</h3>
          </div>

          <div className="flex items-center gap-1 text-[12px] font-semibold text-[#68a46b] bg-[#68a46b]/10 px-2 py-0.5 rounded-full border border-[#68a46b]/20 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{option.warrantyYears} Anos</span>
          </div>
        </div>

        {option.description && (
          <p className="text-xs text-[#a9adae] mt-2.5 leading-relaxed">{option.description}</p>
        )}

        {option.displayLines.length > 0 && (
          <ul className="flex flex-col gap-2 mt-4">
            {option.displayLines.map((line, index) => (
              <li key={`${line.kind}-${index}`} className="flex items-start gap-2 text-xs">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d3a548]/15 text-[#f7d46d] mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[#f1ede5]">{displayLineLabel(line)}</span>
                  {line.kind === "service" && line.description && (
                    <span className="text-[11px] text-[#8a9092] mt-0.5">{line.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-1.5 mt-5 p-3.5 rounded-md bg-[#080a0b]/60 border border-white/[0.04]">
          <div className="flex items-center justify-between text-[12px] text-[#8a9092]">
            <span>Base Tributável</span>
            <span className="tabular-nums text-[#a9adae] font-medium">
              {formatCurrency(option.taxableBase)}
            </span>
          </div>
          {option.discountAmount > 0 && (
            <div className="flex items-center justify-between text-[12px] text-[#f7d46d]">
              <span>Desconto ({option.discountRate}%)</span>
              <span className="tabular-nums font-medium">
                -{formatCurrency(option.discountAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[12px] text-[#8a9092]">
            <span>IVA ({vatPercentLabel(option.vatRate)}%)</span>
            <span className="tabular-nums text-[#a9adae] font-medium">
              {formatCurrency(option.vatAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="font-bold text-sm text-[#f1ede5]">Total da Proposta</span>
            <span className="font-extrabold text-xl text-[#f7d46d] tabular-nums">
              {formatCurrency(option.totalWithVat)}
            </span>
          </div>
        </div>
      </div>

      {isInteractive && (
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center">
          <div
            className={`w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isSelected
                ? "bg-[#d3a548] text-[#050606] shadow-sm"
                : "bg-white/[0.05] text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/10"
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{isSelected ? "Opção Selecionada" : "Selecionar Esta Opção"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicQuoteView({
  quote: initialQuote,
  token,
}: {
  quote: PublicQuote | null;
  token: string;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    initialQuote?.selectedOptionId ||
      initialQuote?.options.find((o) => o.isRecommended)?.id ||
      initialQuote?.options[0]?.id ||
      ""
  );

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approverName, setApproverName] = useState(initialQuote?.customerName || "");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproved, setIsApproved] = useState(initialQuote?.status === "approved");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const quote = initialQuote;

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center justify-center p-6 text-center">
        <Logo variant="full" className="mb-6" />
        <h1 className="text-2xl font-bold text-[#f1ede5]">
          Proposta não encontrada ou link expirado
        </h1>
        <p className="text-xs text-[#a9adae] mt-2 max-w-sm">
          Por favor, contacta a X-Motion para solicitar um novo link de proposta comercial.
        </p>
      </div>
    );
  }

  const selectedOption =
    quote.options.find((o) => o.id === selectedOptionId) || quote.options[0];

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    setApproving(true);
    setApprovalError(null);
    const result = await approvePublicQuoteAction(token ?? "", selectedOption.id, approverName);
    setApproving(false);
    if (!result.ok) {
      setApprovalError(result.error);
      return;
    }
    setIsApproved(true);
    setIsApproveModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Public Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-[#a9adae]">Proposta Comercial Oficial</span>
            <span className="font-mono font-bold text-sm text-[#f7d46d]">
              {quote.quoteNumber}
            </span>
          </div>
        </header>

        {/* Success Banner if Approved */}
        {isApproved && selectedOption && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[18px] bg-gradient-to-r from-[#142618] to-[#101c13] border border-[#68a46b]/40 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#68a46b]/20 text-[#68a46b]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-[#f1ede5]">
                  Proposta Aprovada com Sucesso!
                </span>
                <span className="text-xs text-[#a9adae]">
                  Opção selecionada: <strong className="text-[#f7d46d]">{selectedOption.name}</strong>{" "}
                  ({formatCurrency(selectedOption.totalWithVat)} c/ IVA). A equipa X-Motion já foi
                  notificada.
                </span>
              </div>
            </div>

            <a
              href="https://wa.me/351912345678"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start sm:self-auto"
            >
              <Button variant="primary" size="sm">
                <MessageCircle className="h-4 w-4" />
                <span>Contactar Oficina</span>
              </Button>
            </a>
          </div>
        )}

        {/* Vehicle Presentation Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#15191a] border border-white/[0.08] text-[#d3a548]">
              <Car className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#8a9092]">Proposta preparada para:</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f1ede5]">{quote.customerName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#a9adae]">
                {/* Plate Badge */}
                <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono font-bold text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                  <span>{quote.vehiclePlate}</span>
                </div>
                <span className="font-semibold text-[#f1ede5]">
                  {quote.vehicleModel}
                  {quote.vehicleYear ? ` (${quote.vehicleYear})` : ""}
                </span>
                {quote.vehicleColor && (
                  <>
                    <span>·</span>
                    <span>{quote.vehicleColor}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end">
            <span className="text-xs text-[#8a9092]">Válido até:</span>
            <span className="text-sm font-bold text-[#f1ede5] tabular-nums font-mono">
              {formatDatePtPT(quote.expiresAt)}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-[#f1ede5]">
              Escolhe o Nível de Proteção Ideal
            </h2>
            <p className="text-xs text-[#a9adae] mt-1">
              Todas as opções incluem aplicações certificadas com garantia oficial.
            </p>
          </div>

          {quote.options.length === 0 ? (
            <div className="p-8 rounded-[20px] bg-[#101314] border border-white/[0.08] text-center text-xs text-[#a9adae]">
              Esta proposta ainda não tem opções disponíveis. Contacta a X-Motion para
              receberes uma nova versão.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {quote.options.map((option) => (
                <PublicOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOptionId === option.id}
                  isInteractive={!isApproved}
                  onSelect={setSelectedOptionId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Approval Action Bar */}
        {!isApproved && selectedOption && (
          <div className="sticky bottom-6 z-40 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[20px] bg-[#101314]/95 backdrop-blur-md border border-[#d3a548]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col">
              <span className="text-xs text-[#a9adae]">Opção Selecionada:</span>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-lg text-[#f1ede5]">{selectedOption.name}</span>
                <span className="text-lg font-black text-[#f7d46d] tabular-nums">
                  {formatCurrency(selectedOption.totalWithVat)}
                </span>
                <span className="text-[12px] text-[#8a9092]">c/ IVA</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsApproveModalOpen(true)}
              className="w-full sm:w-auto px-8"
            >
              <Check className="h-5 w-5" />
              <span>Aprovar Proposta e Agendar</span>
            </Button>
          </div>
        )}

        {/* Footer info */}
        <footer className="flex flex-col items-center justify-center gap-2 pt-8 pb-12 border-t border-white/[0.06] text-xs text-[#8a9092] text-center">
          <span>X-Motion Performance Detailing & PPF · Barcelos, Portugal</span>
          <span>Garantia de aplicação certificada e rastreabilidade por passaporte digital</span>
        </footer>
      </div>

      {/* Approval Confirmation Modal */}
      {isApproveModalOpen && selectedOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-[20px] bg-[#101314] border border-white/[0.12] p-6 shadow-2xl text-[#f1ede5]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3a548]/20 text-[#f7d46d]">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base">Confirmar Aprovação</h3>
                <span className="text-xs text-[#a9adae]">{selectedOption.name}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="flex flex-col gap-4 mt-4 text-xs">
              <div className="p-3.5 rounded-md bg-[#15191a] border border-white/[0.04] flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm font-bold text-[#f1ede5]">
                  <span>Total da Proposta c/ IVA:</span>
                  <span className="text-[#f7d46d] tabular-nums font-black">
                    {formatCurrency(selectedOption.totalWithVat)}
                  </span>
                </div>
                <span className="text-[12px] text-[#8a9092]">
                  Garantia de {selectedOption.warrantyYears} anos com certificado digital emitido
                  após conclusão.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Nome do Aprovador *</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] outline-none text-sm text-[#f1ede5]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">
                  Notas ou Preferência de Agendamento (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="ex: Preferência para início na próxima segunda-feira de manhã..."
                  className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] outline-none text-xs text-[#f1ede5]"
                />
              </div>

              {approvalError && (
                <p className="text-[11px] font-semibold text-[#f05a50]">{approvalError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  disabled={approving}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={approving}>
                  <Check className="h-4 w-4" />
                  <span>{approving ? "A confirmar…" : "Confirmar Aprovação"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
