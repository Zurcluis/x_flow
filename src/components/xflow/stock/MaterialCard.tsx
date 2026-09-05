import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/domains/materials/types";
import { formatCurrency } from "@/lib/formatting";

interface MaterialCardProps {
  material: Material;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const isLowStock = material.status === "low_stock";
  const stockPercentage = Math.min(
    100,
    Math.round((material.currentStockMeters / (material.minimumStockAlertMeters * 2)) * 100)
  );

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150">
      <div>
        {/* Top Header: Brand, Type & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              {material.brand}
            </span>
            <h3 className="font-bold text-sm text-[#f1ede5] line-clamp-1 mt-0.5">
              {material.name}
            </h3>
          </div>

          <Badge variant={isLowStock ? "danger" : "outline"} className="text-[11px] shrink-0">
            {isLowStock ? "Stock Baixo" : "Disponível"}
          </Badge>
        </div>

        {/* Specs: Finish, Thickness & Roll width */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[#a9adae]">
          <span className="p-1 px-2 rounded-[6px] bg-[#15191a] border border-white/[0.04]">
            {material.finish}
          </span>
          {material.thicknessMicrons && (
            <span className="p-1 px-2 rounded-[6px] bg-[#15191a] border border-white/[0.04]">
              {material.thicknessMicrons} µm
            </span>
          )}
          {material.rollWidthMeters > 0 && (
            <span className="p-1 px-2 rounded-[6px] bg-[#15191a] border border-white/[0.04]">
              Largura: {material.rollWidthMeters} m
            </span>
          )}
        </div>

        {/* Stock Level Bar */}
        <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a9092]">Stock Disponível:</span>
            <span
              className={`font-extrabold tabular-nums ${
                isLowStock ? "text-[#f05a50]" : "text-[#f1ede5]"
              }`}
            >
              {material.currentStockMeters} {material.unit === "bottle" ? "garrafas" : "metros"}
            </span>
          </div>

          <div className="relative h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLowStock
                  ? "bg-gradient-to-r from-[#f05a50] to-[#f78e85]"
                  : "bg-gradient-to-r from-[#d3a548] to-[#f7d46d]"
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8a9092] mt-0.5">
            <span>Alerta mín: {material.minimumStockAlertMeters} {material.unit === "bottle" ? "un" : "m"}</span>
            {material.batches && material.batches.length > 0 && (
              <span>Lote: {material.batches[0].batchNumber}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Price table */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/[0.04] text-xs">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#8a9092]">Custo Oficina</span>
          <span className="font-semibold text-[#a9adae] tabular-nums">
            {formatCurrency(material.costPerMeter)}/{material.unit === "bottle" ? "un" : "m"}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-[#8a9092]">Preço Venda</span>
          <span className="font-bold text-[#f7d46d] tabular-nums">
            {formatCurrency(material.pricePerMeter)}/{material.unit === "bottle" ? "un" : "m"}
          </span>
        </div>
      </div>
    </Card>
  );
}
