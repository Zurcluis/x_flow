"use client";

import React, { useState } from "react";
import {
  Layers,
  Search,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/xflow/stock/MaterialCard";
import { StockAlertBanner } from "@/components/xflow/stock/StockAlertBanner";
import { Material } from "@/domains/materials/types";
import { formatCurrency } from "@/lib/formatting";

interface StockViewProps {
  initialMaterials: Material[];
}

export function StockView({ initialMaterials }: StockViewProps) {
  const [materials] = useState<Material[]>(initialMaterials);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const lowStockMaterials = materials.filter((m) => m.status === "low_stock");

  const filteredMaterials = materials.filter((mat) => {
    // Type / status filter
    if (activeTypeFilter === "low_stock" && mat.status !== "low_stock") return false;
    if (activeTypeFilter === "ppf" && mat.type !== "ppf_gloss" && mat.type !== "ppf_matte" && mat.type !== "color_ppf")
      return false;
    if (activeTypeFilter === "wrap" && mat.type !== "cast_vinyl") return false;
    if (activeTypeFilter === "ceramic" && mat.type !== "ceramic") return false;
    if (activeTypeFilter === "tint" && mat.type !== "tint") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        mat.brand.toLowerCase().includes(q) ||
        mat.name.toLowerCase().includes(q) ||
        mat.finish.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalStockMeters = materials
    .filter((m) => m.unit === "meter")
    .reduce((acc, m) => acc + m.currentStockMeters, 0);

  const totalStockValue = materials.reduce(
    (acc, m) => acc + m.currentStockMeters * m.costPerMeter,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">Inventário de Oficina & Lotes</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Materiais & Rolos
          </h1>
        </div>

        <Button variant="primary" className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Registar Novo Rolo / Lote</span>
        </Button>
      </div>

      {/* Critical Stock Alert Banner */}
      <StockAlertBanner lowStockMaterials={lowStockMaterials} />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Total em Stock Físico</span>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {Math.round(totalStockMeters)} metros lineares
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {materials.length} referências ativas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Valor Imobilizado em Stock</span>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {formatCurrency(totalStockValue)}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Preço de custo ponderado
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/30">
          <span className="text-xs text-[#d3a548]">Alertas de Stock Crítico</span>
          <span className="text-2xl font-black text-[#f05a50] tabular-nums">
            {lowStockMaterials.length} Itens
          </span>
          <span className="text-[12px] text-[#a9adae]">
            Abaixo do stock de segurança
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Type Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por marca (Stek, 3M, Xpel), acabamento..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          <button
            onClick={() => setActiveTypeFilter("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === "all"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Todos ({materials.length})
          </button>
          <button
            onClick={() => setActiveTypeFilter("ppf")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === "ppf"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Películas PPF
          </button>
          <button
            onClick={() => setActiveTypeFilter("wrap")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === "wrap"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Vinil Wrap
          </button>
          <button
            onClick={() => setActiveTypeFilter("ceramic")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === "ceramic"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Cerâmicas
          </button>
          <button
            onClick={() => setActiveTypeFilter("low_stock")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === "low_stock"
                ? "bg-[#3a1515] text-[#f05a50] border border-[#f05a50]/40 shadow-sm"
                : "text-[#f05a50] hover:bg-[#3a1515]/30"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Crítico ({lowStockMaterials.length})</span>
          </button>
        </div>
      </div>

      {/* Materials Cards Grid */}
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
