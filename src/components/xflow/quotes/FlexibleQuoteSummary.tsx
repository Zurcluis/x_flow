"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/formatting";
import { round2 } from "@/domains/pricing/engine";
import type {
  FinalFinancials,
  PricingRates,
  PricingValidationError,
  SuggestionResult,
} from "@/domains/pricing/types";

const QUICK_NOTE_CHIPS = [
  "Cliente B2B",
  "Preço comercial",
  "Complexidade adicional",
  "Desconto autorizado",
];

interface FlexibleQuoteSummaryProps {
  rates: PricingRates | null;
  formulaPublished: boolean;
  suggestion: SuggestionResult | null;
  financials: FinalFinancials | null;
  warnings: PricingValidationError[];
  isManual: boolean;
  finalPriceInput: string;
  onFinalPriceChange: (value: string) => void;
  onRestoreSuggestion: () => void;
  adjustReason: string;
  onAdjustReasonChange: (value: string) => void;
  showSuggestionChangedNotice: boolean;
  submittingIntent: "draft" | "send" | null;
  canSubmit: boolean;
  submitError: string | null;
  onSaveDraft: () => void;
  onEmit: () => void;
}

function vatPercentLabel(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(1);
}

export function FlexibleQuoteSummary({
  rates,
  formulaPublished,
  suggestion,
  financials,
  warnings,
  isManual,
  finalPriceInput,
  onFinalPriceChange,
  onRestoreSuggestion,
  adjustReason,
  onAdjustReasonChange,
  showSuggestionChangedNotice,
  submittingIntent,
  canSubmit,
  submitError,
  onSaveDraft,
  onEmit,
}: FlexibleQuoteSummaryProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const submitting = submittingIntent !== null;

  const suggested = suggestion?.suggestedPriceBeforeVat ?? null;
  const diff = financials?.priceVsSuggested ?? 0;
  const diffPercent = financials?.priceVsSuggestedPercent ?? 0;
  const diffColor =
    diff > 0 ? "text-[#68a46b]" : diff < 0 ? "text-[#f7d46d]" : "text-[#8a9092]";

  const appendNote = (chip: string) => {
    const current = adjustReason.trim();
    if (current.split(/\s*·\s*/).includes(chip)) return;
    onAdjustReasonChange(current ? `${current} · ${chip}` : chip);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <span className="font-bold text-sm text-[#f1ede5]">Resumo Financeiro</span>
        {isManual && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d3a548]/15 text-[#f7d46d] border border-[#d3a548]/30">
            Manual
          </span>
        )}
      </div>

      {!rates && (
        <div className="flex items-start gap-2 p-3 rounded-sm bg-[#d3a548]/10 border border-[#d3a548]/30 text-[11px] text-[#f7d46d]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            A base financeira está mal configurada. Revê Configurações → Orçamentos e preços.
          </span>
        </div>
      )}

      {rates && !formulaPublished && (
        <div className="flex items-start gap-2 p-3 rounded-sm bg-[#d3a548]/10 border border-[#d3a548]/30 text-[11px] text-[#f7d46d]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Fórmula não publicada. Publica a fórmula em Configurações → Orçamentos e preços para poderes emitir.
          </span>
        </div>
      )}

      {/* Suggested price */}
      <div className="flex items-start justify-between">
        <span className="text-[11px] text-[#8a9092] pt-0.5">Preço sugerido</span>
        <span className="flex flex-col items-end">
          <span className="text-sm font-semibold text-[#a9adae] tabular-nums">
            {suggested !== null ? formatCurrency(suggested) : "—"}
          </span>
          <span className="text-[10px] text-[#8a9092]">antes de IVA</span>
        </span>
      </div>

      {/* Final price (editable) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[#f1ede5]">Preço final sem IVA</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={finalPriceInput}
          placeholder={suggested !== null ? String(suggested) : "0"}
          onChange={(e) => onFinalPriceChange(e.target.value)}
          className="h-12 px-4 rounded-sm bg-[#15191a] border border-[#d3a548]/40 focus:border-[#d3a548] outline-none text-lg font-bold text-[#f1ede5] tabular-nums"
        />
        {showSuggestionChangedNotice && isManual && (
          <div className="flex items-start gap-2 p-2.5 rounded-sm bg-[#6e93b5]/10 border border-[#6e93b5]/30 text-[11px] text-[#9dbdd8] mt-1">
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>A sugestão mudou. Mantivemos o preço final que escolheste.</span>
          </div>
        )}
      </div>

      {/* VAT + Total */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[#a9adae]">
          <span>IVA ({rates ? `${vatPercentLabel(rates.vatRate)}%` : "—"})</span>
          <span className="tabular-nums font-semibold text-[#f1ede5]">
            {formatCurrency(financials?.vatAmount ?? 0)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-sm bg-[#15191a] border border-[#d3a548]/30">
          <span className="font-bold text-sm text-[#f1ede5]">Total a apresentar ao cliente</span>
          <span className="font-extrabold text-base text-[#f7d46d] tabular-nums">
            {formatCurrency(financials?.totalWithVat ?? 0)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#8a9092]">Diferença face à sugestão</span>
          {isManual ? (
            <span className={`tabular-nums font-bold ${diffColor}`}>
              {diff > 0 ? "+" : ""}
              {formatCurrency(diff)} ({formatPercentage(diffPercent, true)})
            </span>
          ) : (
            <span className="text-[#8a9092]">—</span>
          )}
        </div>
      </div>

      {/* Internal composition expander */}
      {suggestion && financials && rates && (
        <div className="rounded-md border border-white/[0.06] bg-[#080a0b]/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setBreakdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8a9092] hover:text-[#a9adae] cursor-pointer transition-colors select-none"
          >
            <span>Ver composição interna</span>
            {breakdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {breakdownOpen && (
            <div className="flex flex-col gap-1.5 px-3 pb-3">
              {suggestion.breakdown.map((component, i) => (
                <div
                  key={`${component.type}-${i}`}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-[#a9adae]">{component.label}</span>
                  <span className="tabular-nums font-semibold text-[#f1ede5]">
                    {formatCurrency(component.value)}
                  </span>
                </div>
              ))}

              <div className="border-t border-white/[0.06] my-1.5" />

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a9adae]">Material previsto</span>
                <span className="tabular-nums font-semibold text-[#f1ede5]">
                  {formatCurrency(suggestion.costSummary.materialCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a9adae]">Despesas atribuídas</span>
                <span className="tabular-nums font-semibold text-[#f1ede5]">
                  {formatCurrency(financials.aggregatedAttributed)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a9adae]">Aquisição e reservas a recuperar</span>
                {rates.method === "monthly" ? (
                  <span className="tabular-nums font-semibold text-[#f1ede5]">
                    {formatCurrency(
                      round2((rates.hourlyCashRecovery ?? 0) * suggestion.costSummary.billedHours)
                    )}
                  </span>
                ) : (
                  <span className="text-[#8a9092]">incluída na base diária</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a9adae]">Objetivo incluído</span>
                <span className="tabular-nums font-semibold text-[#f1ede5]">
                  {formatCurrency(round2(rates.profitHourly * suggestion.costSummary.billedHours))}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-white/[0.06]">
                <span className="text-[11px] font-bold text-[#f7d46d]">
                  Qualidade dos dados: orçamentado
                </span>
                <span className="text-[10px] text-[#8a9092] leading-relaxed">
                  Este resultado usa despesas e reservas orçamentadas. Os custos reais podem variar.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings (blocking) */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-sm bg-[#f05a50]/10 border border-[#f05a50]/30">
          {warnings.map((warning, i) => (
            <div key={`${warning.field}-${i}`} className="flex items-start gap-2 text-[11px] text-[#f05a50]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick notes */}
      <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
        <label className="text-[11px] uppercase font-bold tracking-wider text-[#8a9092]">
          Notas do ajuste
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NOTE_CHIPS.map((chip) => {
            const alreadyIncluded = adjustReason.split(/\s*·\s*/).includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => appendNote(chip)}
                disabled={alreadyIncluded}
                className={`px-2 py-1 rounded-full border text-[10px] font-semibold transition-colors select-none ${
                  alreadyIncluded
                    ? "border-[#d3a548]/50 bg-[#1f1b14] text-[#f7d46d] cursor-default"
                    : "border-white/[0.12] bg-[#080a0b] text-[#a9adae] hover:border-[#d3a548]/50 hover:text-[#f7d46d] cursor-pointer"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <textarea
          rows={2}
          value={adjustReason}
          onChange={(e) => onAdjustReasonChange(e.target.value)}
          placeholder="Motivo do ajuste…"
          className="p-2.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] outline-none text-xs text-[#f1ede5]"
        />
      </div>

      {submitError && (
        <p className="text-[11px] font-semibold text-[#f05a50]">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          variant="secondary"
          className="w-full"
          onClick={onSaveDraft}
          disabled={!canSubmit || submitting}
        >
          {submittingIntent === "draft" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A guardar rascunho…</span>
            </>
          ) : (
            <span>Guardar rascunho</span>
          )}
        </Button>

        <Button
          variant="primary"
          className="w-full"
          onClick={onEmit}
          disabled={!canSubmit || submitting}
        >
          {submittingIntent === "send" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A emitir proposta…</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Emitir e gerar link seguro</span>
            </>
          )}
        </Button>

        {isManual && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onRestoreSuggestion}
            disabled={submitting}
          >
            Restaurar sugestão
          </Button>
        )}
      </div>
    </div>
  );
}
