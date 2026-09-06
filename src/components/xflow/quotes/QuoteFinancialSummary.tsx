import { PricingFinancials } from "@/domains/quotes/pricing-engine";
import { formatCurrency } from "@/lib/formatting";
import { TrendingUp, Clock } from "lucide-react";

interface QuoteFinancialSummaryProps {
  financials: PricingFinancials;
}

export function QuoteFinancialSummary({ financials }: QuoteFinancialSummaryProps) {
  const isHealthyMargin = financials.estimatedMarginPercentage >= 35;
  const isWarningMargin =
    financials.estimatedMarginPercentage >= 20 &&
    financials.estimatedMarginPercentage < 35;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <span className="font-bold text-sm text-[#f1ede5]">
          Resumo Comercial & Margens
        </span>
        <span className="text-[11px] uppercase font-bold text-[#8a9092]">
          Determinístico
        </span>
      </div>

      {/* Customer Price Breakdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[#a9adae]">
          <span>Subtotal Serviços</span>
          <span className="tabular-nums font-semibold text-[#f1ede5]">
            {formatCurrency(financials.subtotal)}
          </span>
        </div>

        {financials.discountAmount > 0 && (
          <div className="flex items-center justify-between text-[#f7d46d]">
            <span>Desconto ({financials.discountRate}%)</span>
            <span className="tabular-nums font-semibold">
              -{formatCurrency(financials.discountAmount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[#a9adae] pt-1 border-t border-white/[0.03]">
          <span>Base Tributável Líquida</span>
          <span className="tabular-nums font-semibold text-[#f1ede5]">
            {formatCurrency(financials.taxableBase)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#8a9092]">
          <span>IVA (23% pt-PT)</span>
          <span className="tabular-nums font-medium">
            {formatCurrency(financials.vatAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-sm bg-[#15191a] border border-[#d3a548]/30 mt-1">
          <span className="font-bold text-sm text-[#f1ede5]">Total da Proposta</span>
          <span className="font-extrabold text-base text-[#f7d46d] tabular-nums">
            {formatCurrency(financials.totalWithVat)}
          </span>
        </div>
      </div>

      {/* Internal Workshop Metrics (Confidential) */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.06] bg-[#080a0b]/40 p-3 rounded-md">
        <span className="text-[11px] uppercase font-bold text-[#8a9092] tracking-wider">
          Rentabilidade Interna da Oficina:
        </span>

        <div className="flex items-center justify-between text-[#a9adae]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#8a9092]" />
            <span>Tempo Estimado</span>
          </div>
          <span className="tabular-nums font-semibold text-[#f1ede5]">
            {financials.estimatedHours} horas
          </span>
        </div>

        <div className="flex items-center justify-between text-[#a9adae]">
          <span>Custo Total Previsto</span>
          <span className="tabular-nums font-semibold text-[#f1ede5]">
            {formatCurrency(financials.estimatedCost)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <TrendingUp
              className={`h-3.5 w-3.5 ${
                isHealthyMargin
                  ? "text-[#68a46b]"
                  : isWarningMargin
                  ? "text-[#f7d46d]"
                  : "text-[#f05a50]"
              }`}
            />
            <span className="font-bold text-[#f1ede5]">Margem Estimada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-bold text-[#f1ede5]">
              {formatCurrency(financials.estimatedMarginAmount)}
            </span>
            <span
              className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                isHealthyMargin
                  ? "bg-[#68a46b]/15 text-[#68a46b]"
                  : isWarningMargin
                  ? "bg-[#f7d46d]/15 text-[#f7d46d]"
                  : "bg-[#f05a50]/15 text-[#f05a50]"
              }`}
            >
              {financials.estimatedMarginPercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
