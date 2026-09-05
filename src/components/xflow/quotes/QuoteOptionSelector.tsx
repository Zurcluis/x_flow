import React from "react";
import { Check, Star, ShieldCheck } from "lucide-react";
import { QuoteOption } from "@/domains/quotes/types";
import { formatCurrency } from "@/lib/formatting";

interface QuoteOptionSelectorProps {
  options: QuoteOption[];
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  isInteractive?: boolean;
}

export function QuoteOptionSelector({
  options,
  selectedOptionId,
  onSelectOption,
  isInteractive = true,
}: QuoteOptionSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isRecommended = option.isRecommended;

        return (
          <div
            key={option.id}
            onClick={() => isInteractive && onSelectOption && onSelectOption(option.id)}
            className={`relative flex flex-col justify-between p-6 rounded-[20px] transition-all duration-200 ${
              isInteractive ? "cursor-pointer" : ""
            } ${
              isSelected
                ? "bg-gradient-to-b from-[#1b2021] to-[#101314] border-2 border-[#d3a548] shadow-[0_12px_36px_rgba(211,165,72,0.15)]"
                : isRecommended
                ? "bg-[#141819] border border-[#d3a548]/50 hover:border-[#d3a548]"
                : "bg-[#101314] border border-white/[0.08] hover:border-white/20"
            }`}
          >
            {/* Top Badge */}
            {isRecommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] text-[12px] font-extrabold shadow-md uppercase tracking-wider">
                <Star className="h-3 w-3 fill-current" />
                <span>Recomendado</span>
              </div>
            )}

            <div>
              {/* Header: Option Title & Warranty */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#d3a548]">
                    {option.tier === "essential"
                      ? "Nível 1 · Essencial"
                      : option.tier === "recommended"
                      ? "Nível 2 · Recomendado"
                      : "Nível 3 · Premium"}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#f1ede5] mt-1">
                    {option.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-[12px] font-semibold text-[#68a46b] bg-[#68a46b]/10 px-2 py-0.5 rounded-full border border-[#68a46b]/20 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{option.warrantyYears} Anos</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#a9adae] mt-2.5 leading-relaxed">
                {option.description}
              </p>

              {/* Price Display */}
              <div className="flex flex-col mt-5 p-3.5 rounded-[12px] bg-[#080a0b]/60 border border-white/[0.04]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#f1ede5] tracking-tight tabular-nums">
                    {formatCurrency(option.totalWithVat)}
                  </span>
                  <span className="text-xs text-[#8a9092]">c/ IVA</span>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#8a9092] mt-0.5">
                  <span>Base tributável: {formatCurrency(option.taxableBase)}</span>
                  {option.discountRate > 0 && (
                    <span className="text-[#f7d46d] font-medium">
                      Desconto {option.discountRate}% (-{formatCurrency(option.discountAmount)})
                    </span>
                  )}
                </div>
              </div>

              {/* Included Parts List */}
              <div className="flex flex-col gap-2 mt-5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#8a9092]">
                  Peças & Componentes Incluídos:
                </span>
                <ul className="flex flex-col gap-1.5">
                  {option.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 text-xs text-[#f1ede5]"
                    >
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d3a548]/15 text-[#f7d46d]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="truncate">{item.bodyPartName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Select Radio / Action Indicator */}
            {isInteractive && (
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center">
                <div
                  className={`w-full py-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
      })}
    </div>
  );
}
