import React from "react";
import { MaterialUsage } from "@/domains/production/types";
import { Badge } from "@/components/ui/badge";

interface MaterialUsageWidgetProps {
  materialUsage: MaterialUsage;
}

export function MaterialUsageWidget({ materialUsage }: MaterialUsageWidgetProps) {
  const isHighScrap = materialUsage.scrapPercentage >= 15;

  return (
    <div className="flex flex-col gap-3 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Rastreabilidade de Película & Lote
          </span>
          <span className="font-bold text-sm text-[#f1ede5] mt-0.5">
            Consumo & Desperdício
          </span>
        </div>

        <Badge variant={isHighScrap ? "danger" : "success"} className="text-[11px]">
          {isHighScrap ? "Desperdício Elevado" : "Dentro do Tolerado"}
        </Badge>
      </div>

      {/* Material & Batch Info */}
      <div className="flex flex-col gap-1 p-3 rounded-md bg-[#0c0f10] border border-white/[0.04]">
        <span className="font-bold text-xs text-[#f1ede5]">
          {materialUsage.materialName}
        </span>
        <div className="flex items-center justify-between text-[12px] text-[#8a9092] mt-0.5">
          <span>Lote de Fábrica:</span>
          <span className="font-mono font-bold text-[#d3a548]">
            {materialUsage.batchNumber}
          </span>
        </div>
      </div>

      {/* Consumption Comparison */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-[#a9adae]">
          <span>Metros Orçamentados</span>
          <span className="font-mono font-bold text-[#f1ede5]">
            {materialUsage.estimatedMeters} m
          </span>
        </div>

        <div className="flex items-center justify-between text-[#a9adae]">
          <span>Metros Reais Consumidos</span>
          <span className="font-mono font-bold text-[#f7d46d]">
            {materialUsage.actualMeters} m
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <span className="font-bold text-[#f1ede5]">Taxa de Desperdício (% Scrap)</span>
          <span
            className={`font-mono font-black text-sm ${
              isHighScrap ? "text-[#f05a50]" : "text-[#68a46b]"
            }`}
          >
            +{materialUsage.scrapPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
