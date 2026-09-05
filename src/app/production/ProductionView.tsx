"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Kanban,
  List,
} from "lucide-react";
import { updateWorkOrderStatusAction } from "@/app/actions/production";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkOrder } from "@/domains/checkins/types";

const KANBAN_COLUMNS: Array<{
  status: WorkOrder["status"];
  label: string;
  accent: string;
}> = [
  { status: "draft", label: "Rascunho", accent: "text-[#8a9092]" },
  { status: "in_progress", label: "Em Curso", accent: "text-[#d3a548]" },
  { status: "waiting_parts", label: "Aguardar Peças", accent: "text-[#f05a50]" },
  { status: "quality_control", label: "Controlo de Qualidade", accent: "text-[#6e93b5]" },
  { status: "completed", label: "Concluído", accent: "text-[#68a46b]" },
];

interface ProductionViewProps {
  initialWorkOrders: WorkOrder[];
}

export function ProductionView({ initialWorkOrders }: ProductionViewProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "waiting_parts">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);

  const handleMoveCard = async (workOrderId: string, status: WorkOrder["status"]) => {
    const wo = workOrders.find((w) => w.id === workOrderId);
    if (!wo || wo.status === status) return;
    // otimista
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === workOrderId ? { ...w, status } : w))
    );
    const result = await updateWorkOrderStatusAction(workOrderId, status);
    if (!result.ok) console.error("Falha ao mudar estado:", result.error);
  };

  const totalActiveJobs = workOrders.filter((wo) => wo.status === "in_progress").length;
  const waitingOrders = workOrders.filter((wo) => wo.status === "waiting_parts");
  const averageProgress = Math.round(
    workOrders.reduce((acc, wo) => acc + wo.progressPercentage, 0) / (workOrders.length || 1)
  );
  const totalHours = workOrders.reduce((acc, wo) => acc + wo.actualHoursSpent, 0);

  const filteredOrders = workOrders.filter((wo) => {
    if (activeTab === "in_progress" && wo.status !== "in_progress") return false;
    if (activeTab === "waiting_parts" && wo.status !== "waiting_parts") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        wo.workOrderNumber.toLowerCase().includes(q) ||
        wo.vehiclePlate.toLowerCase().includes(q) ||
        wo.vehicleModel.toLowerCase().includes(q) ||
        wo.primaryTechnicianName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Controlo Operacional de Fábrica & Execução
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Produção & Ordens de Trabalho
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-[12px] bg-[#101314] border border-white/[0.06]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Lista</span>
            </button>
          </div>
          <Link href="/checkins/new">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              <span>Novo Check-in / Ordem</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Trabalhos em Curso</span>
            <Layers className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {totalActiveJobs} Viaturas
          </span>
          <span className="text-[12px] text-[#68a46b]">
            100% de capacidade das baias
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Progresso Médio</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <span className="text-2xl font-black text-[#68a46b] tabular-nums">
            {averageProgress}%
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Alinhado com os prazos
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/30">
          <div className="flex items-center justify-between text-xs text-[#d3a548]">
            <span>A Guardar Peças</span>
            <AlertTriangle className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {waitingOrders.length} Viatura{waitingOrders.length === 1 ? "" : "s"}
          </span>
          <span className="text-[12px] text-[#a9adae]">
            {waitingOrders[0]
              ? `${waitingOrders[0].vehicleModel} (${waitingOrders[0].serviceTitle})`
              : "Sem espera de peças"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Horas Dedicadas Hoje</span>
            <Clock className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {totalHours.toFixed(1)}h
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Total acumulado em produção
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const columnOrders = workOrders.filter((wo) => wo.status === col.status);
            const isDropTarget = dropColumn === col.status;
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropColumn(col.status);
                }}
                onDragLeave={() => setDropColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId) void handleMoveCard(draggedId, col.status);
                  setDraggedId(null);
                  setDropColumn(null);
                }}
                className={`flex flex-col gap-2 p-2.5 rounded-lg border min-h-[320px] transition-colors ${
                  isDropTarget
                    ? "bg-[#1f1b14]/60 border-[#d3a548]/60"
                    : "bg-[#0d0f10] border-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.accent}`}>
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono text-[#8a9092]">
                    {columnOrders.length}
                  </span>
                </div>

                {columnOrders.map((wo) => {
                  const isWaiting = wo.status === "waiting_parts";
                  return (
                    <div
                      key={wo.id}
                      draggable
                      onDragStart={() => setDraggedId(wo.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className="cursor-grab active:cursor-grabbing p-3 rounded-[12px] bg-[#101314] border border-white/[0.08] hover:border-[#d3a548]/40 transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono font-black text-[11px] text-[#f7d46d]">
                          {wo.workOrderNumber}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#f1ede5] block truncate">
                        {wo.vehicleModel}
                      </span>
                      <span className="text-[11px] text-[#8a9092] block truncate">
                        {wo.serviceTitle}
                      </span>
                      <div className="relative h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${
                            isWaiting ? "bg-[#f05a50]" : "bg-gradient-to-r from-[#d3a548] to-[#f7d46d]"
                          }`}
                          style={{ width: `${wo.progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#8a9092]">
                        <span className="truncate">{wo.primaryTechnicianName}</span>
                        <span className="font-mono">{wo.progressPercentage}%</span>
                      </div>
                      <Link
                        href={`/production/${wo.id}`}
                        className="text-[11px] font-semibold text-[#d3a548] hover:underline mt-1.5 inline-block"
                      >
                        Painel da Obra →
                      </Link>
                    </div>
                  );
                })}

                {columnOrders.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-4 text-[11px] text-[#5a6062] border border-dashed border-white/[0.06] rounded-[10px]">
                    Arrasta ordens para aqui
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Controls Bar: Search & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por OT, matrícula, modelo ou técnico..."
            className="w-full h-10 pl-10 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#101314] border border-white/[0.06] select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Todos ({workOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
              activeTab === "in_progress"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Em Produção ({totalActiveJobs})
          </button>
          <button
            onClick={() => setActiveTab("waiting_parts")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
              activeTab === "waiting_parts"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            A Guardar Peças ({waitingOrders.length})
          </button>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.map((wo) => {
          const isWaiting = wo.status === "waiting_parts";

          return (
            <Card
              key={wo.id}
              className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150"
            >
              <div>
                {/* Header: OT Number, Plate & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#f7d46d]">
                        {wo.workOrderNumber}
                      </span>
                      <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f1ede5]">
                        <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                        <span>{wo.vehiclePlate}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-[#f1ede5] line-clamp-1 mt-0.5">
                      {wo.vehicleModel}
                    </h3>
                  </div>

                  <Badge
                    variant={isWaiting ? "danger" : "in_progress"}
                    className="text-[11px] shrink-0"
                  >
                    {isWaiting ? "A Guardar Peças" : "Em Produção"}
                  </Badge>
                </div>

                {/* Service Title & Customer */}
                <div className="flex flex-col gap-0.5 mt-3 text-xs">
                  <span className="font-semibold text-[#f1ede5]">{wo.serviceTitle}</span>
                  <span className="text-[#a9adae]">Cliente: {wo.customerName}</span>
                </div>

                {/* Progress Bar & Hours */}
                <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a9adae]">Progresso de Aplicação</span>
                    <span className="font-bold text-[#f1ede5] tabular-nums font-mono">
                      {wo.progressPercentage}%
                    </span>
                  </div>

                  <div className="relative h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWaiting
                          ? "bg-gradient-to-r from-[#f05a50] to-[#f78e85]"
                          : "bg-gradient-to-r from-[#d3a548] to-[#f7d46d]"
                      }`}
                      style={{ width: `${wo.progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#8a9092] mt-1">
                    <div className="flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-[#d3a548]" />
                      <span>{wo.primaryTechnicianName}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{wo.actualHoursSpent}h / {wo.estimatedHours}h previstas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/[0.06] text-xs">
                <Link
                  href={`/checkins/${wo.checkinId}`}
                  className="font-semibold text-[#a9adae] hover:text-[#d3a548] transition-colors"
                >
                  Ver Check-in
                </Link>

                <div className="flex items-center gap-2">
                  <Link href={`/production/${wo.id}`}>
                    <Button variant="outline" size="sm" className="bg-[#15191a]">
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Painel da Obra</span>
                    </Button>
                  </Link>
                  <Link href={`/production/${wo.id}/qc`}>
                    <Button variant="primary" size="sm" className="bg-[#d3a548] text-[#050606] font-bold">
                      <span>QC</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}
