import React from "react";
import { AlertTriangle } from "lucide-react";
import { Material } from "@/domains/materials/types";
import { Badge } from "@/components/ui/badge";

interface StockAlertBannerProps {
  lowStockMaterials: Material[];
}

export function StockAlertBanner({ lowStockMaterials }: StockAlertBannerProps) {
  if (!lowStockMaterials || lowStockMaterials.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-r from-[#2a1714] to-[#1a1210] border border-[#f05a50]/40 shadow-sm text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f05a50]/20 text-[#f05a50]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#f1ede5]">
              Alerta de Stock Crítico: {lowStockMaterials.length} Materiais em Falta
            </span>
            <Badge variant="danger" className="text-[11px]">
              Ação Urgente
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-[#f05a50]/20">
        {lowStockMaterials.map((mat) => (
          <div
            key={mat.id}
            className="flex items-center justify-between p-2 rounded-[8px] bg-[#050606]/40 border border-white/[0.04]"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-xs text-[#f1ede5] truncate">
                {mat.brand} {mat.name}
              </span>
              <span className="text-[11px] text-[#a9adae]">
                Mínimo: {mat.minimumStockAlertMeters} {mat.unit === "bottle" ? "un" : "m"}
              </span>
            </div>
            <span className="text-xs font-bold text-[#f05a50] tabular-nums shrink-0">
              {mat.currentStockMeters} {mat.unit === "bottle" ? "un" : "m"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
