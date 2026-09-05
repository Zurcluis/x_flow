import React from "react";
import Link from "next/link";
import {
  User,
  ArrowRight,
  Share2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote } from "@/domains/quotes/types";
import { formatCurrency } from "@/lib/formatting";

interface QuoteCardProps {
  quote: Quote;
  onCopyLink?: (token: string) => void;
}

export function QuoteCard({ quote, onCopyLink }: QuoteCardProps) {
  // Find recommended or approved option
  const mainOption =
    quote.options.find((o) => o.id === quote.selectedOptionId) ||
    quote.options.find((o) => o.isRecommended) ||
    quote.options[0];

  const getStatusBadge = (status: Quote["status"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Aprovado</Badge>;
      case "sent":
        return <Badge variant="in_progress">Enviado</Badge>;
      case "viewed":
        return <Badge variant="gold">Visualizado</Badge>;
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejeitado</Badge>;
      case "expired":
      default:
        return <Badge variant="outline">Expirado</Badge>;
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${quote.customerName}, segue a proposta comercial da X-Motion para o seu ${quote.vehicleModel} (${quote.vehiclePlate}):\n${typeof window !== "undefined" ? window.location.origin : ""}/quotes/public/${quote.publicToken}`
  );

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150 group">
      <div>
        {/* Top bar: Quote number, Date & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#f7d46d]">
              {quote.quoteNumber}
            </span>
            <span className="text-[12px] text-[#8a9092]">
              · {quote.createdAt.slice(0, 10)}
            </span>
          </div>

          {getStatusBadge(quote.status)}
        </div>

        {/* Vehicle & Plate */}
        <div className="mt-3.5 flex items-start gap-3">
          {/* Plate style badge */}
          <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2 py-0.5 text-xs font-bold tracking-wider text-[#f1ede5] shadow-inner font-mono shrink-0">
            <span className="text-[#6e93b5] mr-1 text-[11px] font-sans font-black">P</span>
            <span>{quote.vehiclePlate}</span>
          </div>

          <div className="flex flex-col min-w-0">
            <Link
              href={`/quotes/${quote.id}`}
              className="font-bold text-sm text-[#f1ede5] hover:text-[#f7d46d] transition-colors truncate"
            >
              {quote.vehicleModel}
            </Link>
            <span className="text-xs text-[#8a9092] truncate">
              {quote.vehicleColor} · Ano {quote.vehicleYear}
            </span>
          </div>
        </div>

        {/* Customer info */}
        <div className="flex items-center gap-2 mt-3 text-xs text-[#a9adae]">
          <User className="h-3.5 w-3.5 text-[#d3a548] shrink-0" />
          <Link
            href={`/customers/${quote.customerId}`}
            className="hover:text-[#f1ede5] hover:underline truncate"
          >
            {quote.customerName}
          </Link>
          <span className="text-[11px] text-[#8a9092]">
            ({quote.customerType === "business" ? "B2B" : "Particular"})
          </span>
        </div>

        {/* Main Option & Price Preview */}
        {mainOption && (
          <div className="mt-4 p-3 rounded-[10px] bg-[#15191a] border border-white/[0.04] flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a9adae] font-medium truncate pr-2">
                {mainOption.name}
              </span>
              <span className="font-bold text-sm text-[#f1ede5] tabular-nums shrink-0">
                {formatCurrency(mainOption.totalWithVat)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px] text-[#8a9092] pt-1 border-t border-white/[0.03]">
              <span>Base: {formatCurrency(mainOption.taxableBase)} + IVA</span>
              <span className="text-[#68a46b] font-medium">
                Margem: {mainOption.estimatedMarginPercentage}% ({formatCurrency(mainOption.estimatedMarginAmount)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Quick Actions */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/[0.04] text-xs">
        <div className="flex items-center gap-2">
          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#68a46b]/20 hover:text-[#68a46b] text-[#8a9092] transition-colors"
            title="Enviar por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>

          {/* Copy Public Link */}
          <button
            onClick={() => onCopyLink && onCopyLink(quote.publicToken)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-[#8a9092] hover:text-[#f1ede5] transition-colors cursor-pointer"
            title="Copiar Link Público"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* Public Page View */}
          <Link
            href={`/quotes/public/${quote.publicToken}`}
            target="_blank"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#d3a548]/20 hover:text-[#f7d46d] text-[#8a9092] transition-colors"
            title="Ver Página do Cliente"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <Link
          href={`/quotes/${quote.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[#d3a548] hover:text-[#f7d46d] transition-colors group-hover:translate-x-0.5"
        >
          <span>Abrir Proposta</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
