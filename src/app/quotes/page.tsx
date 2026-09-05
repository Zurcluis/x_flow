"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteCard } from "@/components/xflow/quotes/QuoteCard";
import { initialQuotesData } from "@/lib/demo-data/quotes-data";
import { Quote } from "@/domains/quotes/types";
import { formatCurrency } from "@/lib/formatting";

export default function QuotesPage() {
  const [quotes] = useState<Quote[]>(initialQuotesData);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/quotes/public/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab === "pending" && q.status !== "sent" && q.status !== "viewed") return false;
    if (activeTab === "approved" && q.status !== "approved") return false;
    if (activeTab === "draft" && q.status !== "draft") return false;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      return (
        q.quoteNumber.toLowerCase().includes(term) ||
        q.vehiclePlate.toLowerCase().includes(term) ||
        q.vehicleModel.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Financial KPIs
  const totalPendingAmount = quotes
    .filter((q) => q.status === "sent" || q.status === "viewed")
    .reduce((acc, q) => {
      const mainOpt = q.options.find((o) => o.isRecommended) || q.options[0];
      return acc + (mainOpt ? mainOpt.totalWithVat : 0);
    }, 0);

  const approvedQuotes = quotes.filter((q) => q.status === "approved");
  const totalApprovedAmount = approvedQuotes.reduce((acc, q) => {
    const opt = q.options.find((o) => o.id === q.selectedOptionId) || q.options[0];
    return acc + (opt ? opt.totalWithVat : 0);
  }, 0);

  const conversionRate = Math.round(
    (approvedQuotes.length / (quotes.filter((q) => q.status !== "draft").length || 1)) * 100
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">Motor Comercial & Propostas</span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Orçamentos da Oficina
          </h1>
        </div>

        <Link href="/quotes/new">
          <Button variant="primary" className="self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>Novo Orçamento</span>
          </Button>
        </Link>
      </div>

      {/* Copy notification toast */}
      {copiedToken && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-[12px] bg-[#1b2021] border border-[#d3a548] text-xs font-semibold text-[#f7d46d] shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          <span>Link público seguro copiado para a área de transferência!</span>
        </div>
      )}

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Em Proposta Pendente</span>
            <Clock className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {formatCurrency(totalPendingAmount)}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {quotes.filter((q) => q.status === "sent" || q.status === "viewed").length} orçamentos ativos
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Aprovado no Mês</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <span className="text-2xl font-black text-[#68a46b] tabular-nums">
            {formatCurrency(totalApprovedAmount)}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {approvedQuotes.length} propostas convertidas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Taxa de Conversão</span>
            <TrendingUp className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {conversionRate}%
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Média de 3 dias para fecho
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/30">
          <div className="flex items-center justify-between text-xs text-[#d3a548]">
            <span>Aguardam Resposta &gt; 4 dias</span>
            <AlertTriangle className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            3 Orçamentos
          </span>
          <span className="text-[12px] text-[#a9adae]">
            Requer follow-up comercial
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por número, matrícula, viatura ou cliente..."
            className="w-full h-10 pl-10 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Todos ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Pendentes ({quotes.filter((q) => q.status === "sent" || q.status === "viewed").length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "approved"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Aprovados ({approvedQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab("draft")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "draft"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Rascunhos ({quotes.filter((q) => q.status === "draft").length})
          </button>
        </div>
      </div>

      {/* Quotes Cards Grid */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} onCopyLink={handleCopyLink} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <FileText className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            Nenhum orçamento encontrado
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Tenta ajustar os filtros de pesquisa ou cria uma nova proposta comercial.
          </p>
        </div>
      )}
    </div>
  );
}
