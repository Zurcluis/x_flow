"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuoteOptionSelector } from "@/components/xflow/quotes/QuoteOptionSelector";
import { QuoteFinancialSummary } from "@/components/xflow/quotes/QuoteFinancialSummary";
import { Quote } from "@/domains/quotes/types";
import { approveQuoteAction } from "@/app/actions/quotes";

interface QuoteDetailViewProps {
  quote: Quote;
}

export function QuoteDetailView({ quote: initialQuote }: QuoteDetailViewProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [copied, setCopied] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");

  const currentOptionId =
    selectedOptionId ||
    quote.selectedOptionId ||
    quote.options.find((o) => o.isRecommended)?.id ||
    quote.options[0]?.id;

  const activeOption =
    quote.options.find((o) => o.id === currentOptionId) || quote.options[0];

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/quotes/public/${quote.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleManualApprove = async () => {
    const result = await approveQuoteAction(quote.id, currentOptionId);
    if (result.ok) {
      setQuote({
        ...quote,
        status: "approved",
        selectedOptionId: currentOptionId,
        approvedAt: new Date().toISOString(),
        approvedByName: "Aprovação Manual na Oficina",
        events: [
          {
            id: `qe-${Date.now()}`,
            quoteId: quote.id,
            eventType: "approved",
            description: `Proposta aprovada manualmente com a opção selecionada (${activeOption?.name}).`,
            authorName: "Luís Gonçalves",
            createdAt: new Date().toISOString(),
          },
          ...quote.events,
        ],
      });
    } else {
      console.error("Falha ao aprovar orçamento:", result.error);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${quote.customerName}, segue a sua proposta comercial da X-Motion para o ${quote.vehicleModel} (${quote.vehiclePlate}):\n${typeof window !== "undefined" ? window.location.origin : ""}/quotes/public/${quote.publicToken}`
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back Button */}
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Orçamentos</span>
        </Link>
      </div>

      {/* Copy Alert Toast */}
      {copied && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-[12px] bg-[#1b2021] border border-[#d3a548] text-xs font-semibold text-[#f7d46d] shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          <span>Link público seguro copiado!</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-black text-2xl text-[#f7d46d]">
              {quote.quoteNumber}
            </span>
            <Badge
              variant={
                quote.status === "approved"
                  ? "success"
                  : quote.status === "sent"
                  ? "in_progress"
                  : quote.status === "viewed"
                  ? "gold"
                  : "outline"
              }
              className="text-xs"
            >
              {quote.status === "approved"
                ? "Aprovado pelo Cliente"
                : quote.status === "sent"
                ? "Enviado · Aguarda Resposta"
                : quote.status === "viewed"
                ? "Visualizado pelo Cliente"
                : "Rascunho"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            {/* Plate */}
            <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{quote.vehiclePlate}</span>
            </div>

            <Link
              href={`/vehicles/${quote.vehicleId}`}
              className="font-semibold text-[#f1ede5] hover:text-[#f7d46d] hover:underline"
            >
              {quote.vehicleModel} ({quote.vehicleYear})
            </Link>

            <span>·</span>

            <Link
              href={`/customers/${quote.customerId}`}
              className="hover:text-[#f1ede5] hover:underline"
            >
              {quote.customerName} ({quote.customerType === "business" ? "B2B" : "Particular"})
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <MessageCircle className="h-4 w-4 text-[#68a46b]" />
              <span>WhatsApp</span>
            </Button>
          </a>

          <Button variant="outline" size="sm" onClick={handleCopyPublicLink} className="bg-[#15191a]">
            <Share2 className="h-4 w-4 text-[#d3a548]" />
            <span>Copiar Link</span>
          </Button>

          <Link href={`/quotes/public/${quote.publicToken}`} target="_blank">
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <ExternalLink className="h-4 w-4 text-[#d3a548]" />
              <span>Ver como Cliente</span>
            </Button>
          </Link>

          {quote.status !== "approved" && (
            <Button variant="primary" size="sm" onClick={handleManualApprove}>
              <Check className="h-4 w-4" />
              <span>Aprovar Manualmente</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Options Comparer + Confidential Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3-Tier Option Selector */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#f1ede5]">
              Opções Comparativas da Proposta ({quote.options.length})
            </h2>
            <span className="text-xs text-[#8a9092]">
              Clica numa opção para inspecionar os detalhes de rentabilidade
            </span>
          </div>

          <QuoteOptionSelector
            options={quote.options}
            selectedOptionId={currentOptionId}
            onSelectOption={setSelectedOptionId}
            isInteractive={true}
          />

          {/* Timeline of events */}
          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-[#f1ede5]">
              Histórico & Auditoria de Eventos da Proposta
            </h3>

            <div className="flex flex-col gap-2 mt-2">
              {quote.events.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-[#15191a] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-[#d3a548]" />
                    <span className="text-[#f1ede5] font-medium">{evt.description}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#8a9092]">
                    {evt.authorName && <span>Por: {evt.authorName}</span>}
                    <span className="tabular-nums font-mono">{evt.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Confidential Financials for the selected option */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="sticky top-6 flex flex-col gap-4">
            <QuoteFinancialSummary financials={activeOption} />

            {/* Public Link Box */}
            <Card className="p-4 flex flex-col gap-2 bg-[#15191a]">
              <span className="text-[11px] uppercase font-bold text-[#8a9092]">
                Token Público de Aprovação
              </span>
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#080a0b] font-mono text-xs text-[#d3a548]">
                <span className="truncate pr-2">{quote.publicToken}</span>
                <button
                  onClick={handleCopyPublicLink}
                  className="hover:text-[#f1ede5] cursor-pointer"
                  title="Copiar"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
