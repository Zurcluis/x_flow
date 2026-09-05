"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Car,
  Check,
  MessageCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import { QuoteOptionSelector } from "@/components/xflow/quotes/QuoteOptionSelector";
import { initialQuotesData } from "@/lib/demo-data/quotes-data";
import { formatCurrency } from "@/lib/formatting";

export default function PublicQuotePage() {
  const params = useParams();
  const token = params?.token as string;

  const [quotes, setQuotes] = useState(initialQuotesData);
  const quote = quotes.find((q) => q.publicToken === token);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    quote?.selectedOptionId ||
      quote?.options.find((o) => o.isRecommended)?.id ||
      quote?.options[0]?.id ||
      ""
  );

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approverName, setApproverName] = useState(quote?.customerName || "");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproved, setIsApproved] = useState(quote?.status === "approved");

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center justify-center p-6 text-center">
        <Logo variant="full" className="mb-6" />
        <h1 className="text-2xl font-bold text-[#f1ede5]">Proposta não encontrada ou link expirado</h1>
        <p className="text-xs text-[#a9adae] mt-2 max-w-sm">
          Por favor, contacta a X-Motion para solicitar um novo link de proposta comercial.
        </p>
      </div>
    );
  }

  const selectedOption =
    quote.options.find((o) => o.id === selectedOptionId) || quote.options[0];

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    setIsApproved(true);
    setIsApproveModalOpen(false);

    // Update in memory
    const updated = quotes.map((q) => {
      if (q.id === quote.id) {
        return {
          ...q,
          status: "approved" as const,
          selectedOptionId,
          approvedAt: new Date().toISOString(),
          approvedByName: approverName || quote.customerName,
        };
      }
      return q;
    });

    setQuotes(updated);
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
        {isApproved && (
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
                  Opção selecionada: <strong className="text-[#f7d46d]">{selectedOption.name}</strong> ({formatCurrency(selectedOption.totalWithVat)} c/ IVA). A equipa X-Motion já foi notificada.
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#15191a] border border-white/[0.08] text-[#d3a548]">
              <Car className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#8a9092]">Proposta preparada para:</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f1ede5]">
                {quote.customerName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#a9adae]">
                {/* Plate Badge */}
                <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono font-bold text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                  <span>{quote.vehiclePlate}</span>
                </div>
                <span className="font-semibold text-[#f1ede5]">{quote.vehicleModel} ({quote.vehicleYear})</span>
                <span>·</span>
                <span>{quote.vehicleColor}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end">
            <span className="text-xs text-[#8a9092]">Válido até:</span>
            <span className="text-sm font-bold text-[#f1ede5] tabular-nums font-mono">
              {quote.expiresAt}
            </span>
          </div>
        </div>

        {/* 3 Comparative Options */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-[#f1ede5]">
              Escolhe o Nível de Proteção Ideal
            </h2>
            <p className="text-xs text-[#a9adae] mt-1">
              Todas as opções utilizam películas auto-regenerativas de alta espessura com garantia oficial de fábrica.
            </p>
          </div>

          <QuoteOptionSelector
            options={quote.options}
            selectedOptionId={selectedOptionId}
            onSelectOption={setSelectedOptionId}
            isInteractive={!isApproved}
          />
        </div>

        {/* Bottom Approval Action Bar */}
        {!isApproved && (
          <div className="sticky bottom-6 z-40 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[20px] bg-[#101314]/95 backdrop-blur-md border border-[#d3a548]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col">
              <span className="text-xs text-[#a9adae]">Opção Selecionada:</span>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-lg text-[#f1ede5]">
                  {selectedOption.name}
                </span>
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
      {isApproveModalOpen && (
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
              <div className="p-3.5 rounded-[12px] bg-[#15191a] border border-white/[0.04] flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm font-bold text-[#f1ede5]">
                  <span>Total da Proposta c/ IVA:</span>
                  <span className="text-[#f7d46d] tabular-nums font-black">
                    {formatCurrency(selectedOption.totalWithVat)}
                  </span>
                </div>
                <span className="text-[12px] text-[#8a9092]">
                  Garantia de {selectedOption.warrantyYears} anos com certificado digital emitido após conclusão.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Nome do Aprovador *</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Notas ou Preferência de Agendamento (Opcional)</label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="ex: Preferência para início na próxima segunda-feira de manhã..."
                  className="p-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <Check className="h-4 w-4" />
                  <span>Confirmar Aprovação</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
