"use client";

import React, { useState } from "react";
import {
  Wrench,
  Search,
  CheckCircle2,
  MapPin,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { WorkshopTool } from "@/lib/demo-data/tools-team-data";

export function ToolsView({ initialTools }: { initialTools: WorkshopTool[] }) {
  const [tools] = useState<WorkshopTool[]>(initialTools);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.qrCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableCount = tools.filter((t) => t.status === "disponivel").length;
  const inUseCount = tools.filter((t) => t.status === "em_uso").length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Ferramentas & Equipamentos
          </h1>
          <p className="text-xs text-[#a9adae]">
            Inventário de maquinaria de precisão, pistolas de calor, lâmpadas de inspeção ótica e plotters de corte.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Total de Equipamentos</span>
            <Wrench className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {tools.length} Unidades
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
              100% calibrados e operacionais
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Em Utilização Ativa</span>
            <CheckCircle2 className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {inUseCount} em Oficina
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Atribuídos a técnicos em ordens ativas
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Disponíveis na Bancada</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              {availableCount} Prontos
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Livres para atribuição
            </span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por equipamento, marca, série ou QR Code..."
            className="h-10 w-full pl-10 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Todos" },
            { id: "corte", label: "Corte" },
            { id: "iluminacao", label: "Iluminação" },
            { id: "calor", label: "Calor" },
            { id: "limpeza", label: "Limpeza" },
            { id: "medicao", label: "Medição" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-[#d3a548] text-[#050606] font-bold shadow"
                  : "bg-[#101314] text-[#a9adae] hover:text-[#f1ede5] border border-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <Card
            key={tool.id}
            className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#d3a548] bg-[#1d1810] px-2 py-0.5 rounded-[6px] border border-[#d3a548]/30 font-bold">
                  {tool.qrCode}
                </span>

                <Badge
                  variant={tool.status === "disponivel" ? "success" : "in_progress"}
                  className="text-[11px]"
                >
                  {tool.status === "disponivel" ? "Disponível" : "Em Utilização"}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#f1ede5]">{tool.name}</h3>
                <span className="text-xs text-[#a9adae]">
                  {tool.brand} · {tool.model}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-3 rounded-[12px] bg-[#15191a] border border-white/[0.03] text-xs">
                <div className="flex items-center gap-2 text-[#a9adae]">
                  <MapPin className="h-3.5 w-3.5 text-[#d3a548] shrink-0" />
                  <span>{tool.location}</span>
                </div>

                {tool.assignedTo && (
                  <div className="flex items-center gap-2 text-[#f1ede5]">
                    <User className="h-3.5 w-3.5 text-[#68a46b] shrink-0" />
                    <span>Em uso por: <strong>{tool.assignedTo}</strong></span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[12px] text-[#8a9092] pt-1 mt-1 border-t border-white/[0.04]">
                  <span>Série: <strong className="font-mono text-[#a9adae]">{tool.serialNumber}</strong></span>
                  <span>Próx. Calibração: {tool.nextMaintenance}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
