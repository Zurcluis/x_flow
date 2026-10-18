"use client";

import React, { useState } from "react";
import { AlertTriangle, Layers, Search } from "lucide-react";
import { MaterialCard } from "@/components/xflow/stock/MaterialCard";
import { StockAlertBanner } from "@/components/xflow/stock/StockAlertBanner";
import type { Material } from "@/domains/materials/types";
import { isCriticalStock } from "@/domains/materials/stock";
import { formatCurrency } from "@/lib/formatting";

interface StockViewProps {
  initialMaterials: Material[];
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "ppf", label: "Películas PPF" },
  { key: "wrap", label: "Vinil Wrap" },
  { key: "ceramic", label: "Cerâmicas" },
  { key: "tint", label: "Tint" },
  { key: "low_stock", label: "Crítico" },
] as const;

type StockFilter = (typeof FILTERS)[number]["key"];

function matchesFilter(material: Material, filter: StockFilter): boolean {
  switch (filter) {
    case "low_stock":
      return isCriticalStock(material.status);
    case "ppf":
      return (
        material.type === "ppf_gloss" ||
        material.type === "ppf_matte" ||
        material.type === "color_ppf"
      );
    case "wrap":
      return material.type === "cast_vinyl";
    case "ceramic":
      return material.type === "ceramic";
    case "tint":
      return material.type === "tint";
    default:
      return true;
  }
}

export function StockView({ initialMaterials }: StockViewProps) {
  const [materials] = useState<Material[]>(initialMaterials);
  const [activeTypeFilter, setActiveTypeFilter] = useState<StockFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const criticalMaterials = materials.filter((m) => isCriticalStock(m.status));

  const filteredMaterials = materials.filter((material) => {
    if (!matchesFilter(material, activeTypeFilter)) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      material.brand.toLowerCase().includes(query) ||
      material.name.toLowerCase().includes(query) ||
      material.finish.toLowerCase().includes(query)
    );
  });

  const totalStockMeters = materials
    .filter((m) => m.unit === "meter")
    .reduce((acc, m) => acc + m.currentStockMeters, 0);

  const totalStockValue = materials.reduce(
    (acc, m) => acc + m.currentStockMeters * m.costPerMeter,
    0
  );

  const countFor = (filter: StockFilter) =>
    filter === "low_stock"
      ? criticalMaterials.length
      : filter === "all"
        ? materials.length
        : materials.filter((material) => matchesFilter(material, filter)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Inventário de Oficina & Lotes
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Materiais & Rolos
          </h1>
        </div>
      </div>

      <StockAlertBanner lowStockMaterials={criticalMaterials} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Total em Stock Físico</span>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {Math.round(totalStockMeters)} metros lineares
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {materials.length} referências registadas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Valor Imobilizado em Stock</span>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {formatCurrency(totalStockValue)}
          </span>
          <span className="text-[12px] text-[#8a9092]">Preço de custo registado</span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/30">
          <span className="text-xs text-[#d3a548]">Alertas de Stock Crítico</span>
          <span className="text-2xl font-black text-[#f05a50] tabular-nums">
            {criticalMaterials.length} Itens
          </span>
          <span className="text-[12px] text-[#a9adae]">
            No mínimo de segurança ou esgotados
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por marca, referência ou acabamento..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          {FILTERS.map((filter) => {
            const isActive = activeTypeFilter === filter.key;
            const isCriticalFilter = filter.key === "low_stock";
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTypeFilter(filter.key)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isCriticalFilter
                      ? "bg-[#3a1515] text-[#f05a50] border border-[#f05a50]/40 shadow-sm"
                      : "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                    : isCriticalFilter
                      ? "text-[#f05a50] hover:bg-[#3a1515]/30"
                      : "text-[#a9adae] hover:text-[#f1ede5]"
                }`}
              >
                {isCriticalFilter && (
                  <AlertTriangle className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                )}
                {filter.label} ({countFor(filter.key)})
              </button>
            );
          })}
        </div>
      </div>

      <div role="status" className="sr-only">
        {filteredMaterials.length} materiais visíveis de {materials.length}.
      </div>

      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Layers className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            Nenhum material encontrado
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Tenta ajustar os termos de pesquisa ou filtros de categoria.
          </p>
        </div>
      )}
    </div>
  );
}
