"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Share2,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Check,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuoteOptionSelector } from "@/components/xflow/quotes/QuoteOptionSelector";
import { QuoteFinancialSummary } from "@/components/xflow/quotes/QuoteFinancialSummary";
import { Quote } from "@/domains/quotes/types";
import {
  formatQuoteDateTime,
  quoteStatusBadgeVariant,
  quoteStatusLabel,
} from "@/domains/quotes/presentation";
import {
  approveQuoteAction,
  deleteQuoteAction,
  emitQuoteAction,
} from "@/app/actions/quotes";

interface QuoteDetailViewProps {
  quote: Quote;
}

const subscribeToOrigin = () => () => {};

export function QuoteDetailView({ quote: initialQuote }: QuoteDetailViewProps) {
  const router = useRouter();
  const quote = initialQuote;
  const [copied, setCopied] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [emitting, setEmitting] = useState(false);
  const [emitError, setEmitError] = useState<string | null>(null);
  const appOrigin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => ""
  );

  const currentOptionId =
    selectedOptionId ||
    quote.selectedOptionId ||
    quote.options.find((o) => o.isRecommended)?.id ||
    quote.options[0]?.id;

  const activeOption =
    quote.options.find((o) => o.id === currentOptionId) || quote.options[0];

  const canDecide = quote.status === "sent" || quote.status === "viewed";

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/quotes/public/${quote.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleManualApprove = async () => {
    setApproving(true);
    setApproveError(null);
    const result = await approveQuoteAction(quote.id, currentOptionId);
    setApproving(false);
    if (!result.ok) {
      setApproveError(result.error);
      return;
    }
    router.refresh();
  };

  const handleEmitQuote = async () => {
    setEmitting(true);
    setEmitError(null);
    const result = await emitQuoteAction(quote.id);
    setEmitting(false);
    if (!result.ok) {
      setEmitError(result.error ?? "Erro ao emitir a proposta.");
      return;
    }
    router.refresh();
  };

  const handleDelete = async () => {
    const result = await deleteQuoteAction(quote.id);
    if (!result.ok) {
      setDeleteError(result.error ?? "Erro ao eliminar a proposta.");
      setConfirmDelete(false);
      return;
    }
    router.push("/quotes");
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${quote.customerName}, segue a sua proposta comercial para o ${quote.vehicleModel} (${quote.vehiclePlate}):\n${appOrigin}/quotes/public/${quote.publicToken}`
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Orçamentos</span>
        </Link>
      </div>

      {copied && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-md bg-[#1b2021] border border-[#d3a548] text-xs font-semibold text-[#f7d46d] shadow-2xl animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          <span>Link público seguro copiado.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-black text-2xl text-[#f7d46d]">
              {quote.quoteNumber}
            </span>
            <Badge variant={quoteStatusBadgeVariant(quote.status)} className="text-xs">
              {quoteStatusLabel(quote.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
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

        <div className="flex flex-wrap items-center gap-2.5">
          {quote.status === "draft" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#15191a]"
                onClick={() => router.push(`/quotes/new?draft=${quote.id}`)}
              >
                <Pencil className="h-4 w-4 text-[#d3a548]" />
                <span>Editar rascunho</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handleEmitQuote} disabled={emitting}>
                {emitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{emitting ? "A emitir..." : "Emitir e gerar link seguro"}</span>
              </Button>
            </>
          )}

          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className: "bg-[#15191a]",
            })}
          >
            <MessageCircle className="h-4 w-4 text-[#68a46b]" />
            <span>WhatsApp</span>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPublicLink}
            className="bg-[#15191a]"
          >
            <Share2 className="h-4 w-4 text-[#d3a548]" />
            <span>Copiar Link</span>
          </Button>

          <Link
            href={`/quotes/public/${quote.publicToken}`}
            target="_blank"
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className: "bg-[#15191a]",
            })}
          >
            <ExternalLink className="h-4 w-4 text-[#d3a548]" />
            <span>Ver como Cliente</span>
          </Link>

          {canDecide && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualApprove}
              disabled={approving}
            >
              {approving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{approving ? "A aprovar..." : "Aprovar Manualmente"}</span>
            </Button>
          )}

          <Link
            href={`/quotes/new?vehicle=${quote.vehicleId}`}
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className: "bg-[#15191a]",
            })}
          >
            <RefreshCw className="h-4 w-4 text-[#d3a548]" />
            <span>Refazer Proposta</span>
          </Link>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                <span>Cancelar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="border-[#f05a50]/50 text-[#f05a50] hover:bg-[#f05a50]/10"
              >
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Eliminação</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="border-[#f05a50]/30 text-[#f05a50] hover:bg-[#f05a50]/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar</span>
            </Button>
          )}
        </div>

        {deleteError && (
          <p role="alert" className="text-xs font-semibold text-[#f05a50]">
            {deleteError}
          </p>
        )}

        {approveError && (
          <p role="alert" className="text-xs font-semibold text-[#f05a50]">
            {approveError}
          </p>
        )}

        {emitError && (
          <p role="alert" className="text-xs font-semibold text-[#f05a50]">
            {emitError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-[#f1ede5]">
              Histórico e Auditoria de Eventos da Proposta
            </h3>

            {quote.events.length === 0 ? (
              <p className="text-xs text-[#a9adae]">Sem eventos registados.</p>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {quote.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3 rounded-sm bg-[#15191a] border border-white/[0.04] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-[#d3a548]" />
                      <span className="text-[#f1ede5] font-medium">{evt.description}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#8a9092]">
                      {evt.authorName && <span>Por: {evt.authorName}</span>}
                      <span className="tabular-nums font-mono">
                        {formatQuoteDateTime(evt.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="sticky top-6 flex flex-col gap-4">
            {activeOption && <QuoteFinancialSummary financials={activeOption} />}

            {quote.status === "draft" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30 text-[11px] text-[#f7d46d]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Rascunho: o link só fica ativo depois de emitir.</span>
              </div>
            )}

            <Card className="p-4 flex flex-col gap-2 bg-[#15191a]">
              <span className="text-[11px] uppercase font-bold text-[#8a9092]">
                Token Público de Aprovação
              </span>
              <div className="flex items-center justify-between p-2 rounded-sm bg-[#080a0b] font-mono text-xs text-[#d3a548]">
                <span className="truncate pr-2">{quote.publicToken}</span>
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="hover:text-[#f1ede5] cursor-pointer"
                  title="Copiar link público"
                  aria-label="Copiar link público"
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
