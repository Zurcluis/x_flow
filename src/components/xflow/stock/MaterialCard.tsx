import React from "react";
import { Plus, Scissors, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Material } from "@/domains/materials/types";
import { isCriticalStock, stockLevelPercentage } from "@/domains/materials/stock";
import { formatCurrency } from "@/lib/formatting";

interface MaterialCardProps {
  material: Material;
  onAddRoll?: (material: Material) => void;
  onRegisterCut?: (material: Material) => void;
  onOrderSupplier?: (material: Material) => void;
}

function unitLabel(material: Material): string {
  return material.unit === "bottle" ? "un" : material.unit === "kit" ? "kit" : "m";
}

export function MaterialCard({
  material,
  onAddRoll,
  onRegisterCut,
  onOrderSupplier,
}: MaterialCardProps) {
  const isCritical = isCriticalStock(material.status);
  const isOutOfStock = material.status === "out_of_stock";
  const stockPercentage = stockLevelPercentage(
    material.currentStockMeters,
    material.minimumStockAlertMeters
  );

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              {material.brand}
            </span>
            <h3 className="font-bold text-sm text-[#f1ede5] line-clamp-1 mt-0.5">
              {material.name}
            </h3>
          </div>

          <Badge variant={isCritical ? "danger" : "outline"} className="text-[11px] shrink-0">
            {isOutOfStock ? "Esgotado" : isCritical ? "Stock Baixo" : "Disponível"}
          </Badge>
        </div>

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

        <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a9092]">Stock Disponível:</span>
            <span
              className={`font-extrabold tabular-nums ${
                isCritical ? "text-[#f05a50]" : "text-[#f1ede5]"
              }`}
            >
              {material.currentStockMeters} {unitLabel(material)}
            </span>
          </div>

          <div className="relative h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical
                  ? "bg-gradient-to-r from-[#f05a50] to-[#f78e85]"
                  : "bg-gradient-to-r from-[#d3a548] to-[#f7d46d]"
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8a9092] mt-0.5">
            <span>
              Alerta mín: {material.minimumStockAlertMeters} {unitLabel(material)}
            </span>
            {material.batches && material.batches.length > 0 && (
              <span>Lote: {material.batches[0].batchNumber}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#8a9092]">Custo Oficina</span>
            <span className="font-semibold text-[#a9adae] tabular-nums">
              {formatCurrency(material.costPerMeter)}/{unitLabel(material)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#8a9092]">Preço Venda</span>
            <span className="font-bold text-[#f7d46d] tabular-nums">
              {formatCurrency(material.pricePerMeter)}/{unitLabel(material)}
            </span>
          </div>
        </div>

        {(onRegisterCut || onOrderSupplier || onAddRoll) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.04]">
            {onRegisterCut && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onRegisterCut(material)}
                disabled={material.currentStockMeters <= 0}
                className="flex-1 text-[11px] px-2.5"
              >
                <Scissors className="h-3.5 w-3.5 text-[#d3a548]" />
                <span>Registar Corte (m)</span>
              </Button>
            )}
            {onAddRoll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddRoll(material)}
                className="text-[11px] px-2.5"
                title="Adicionar novo rolo ou lote a este material"
              >
                <Plus className="h-3.5 w-3.5 text-[#f7d46d]" />
                <span>Novo Rolo</span>
              </Button>
            )}
            {onOrderSupplier && (
              <Button
                type="button"
                variant={isCritical ? "primary" : "outline"}
                size="sm"
                onClick={() => onOrderSupplier(material)}
                className="w-full text-[11px] mt-0.5"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Encomendar ao Fornecedor</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
