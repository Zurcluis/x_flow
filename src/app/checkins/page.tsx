"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Car,
  User,
  Clock,
  Share2,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initialCheckinsData } from "@/lib/demo-data/checkins-data";
import { Checkin } from "@/domains/checkins/types";

export default function CheckinsPage() {
  const [checkins] = useState<Checkin[]>(initialCheckinsData);
  const [activeTab, setActiveTab] = useState<"all" | "entry" | "exit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/checkins/report/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const filteredCheckins = checkins.filter((chk) => {
    if (activeTab === "entry" && chk.type !== "entry") return false;
    if (activeTab === "exit" && chk.type !== "exit") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        chk.vehiclePlate.toLowerCase().includes(q) ||
        chk.vehicleModel.toLowerCase().includes(q) ||
        chk.customerName.toLowerCase().includes(q) ||
        chk.technicianName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalDamagesRecorded = checkins.reduce((acc, c) => acc + c.damages.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Receção, Inspeção Fotográfica & Entregas
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Check-ins de Viaturas
          </h1>
        </div>

        <Link href="/checkins/new">
          <Button variant="primary" className="self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>Novo Check-in de Entrada</span>
          </Button>
        </Link>
      </div>

      {/* Copy Alert Toast */}
      {copiedToken && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-[12px] bg-[#1b2021] border border-[#d3a548] text-xs font-semibold text-[#f7d46d] shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          <span>Link do relatório de check-in copiado para a área de transferência!</span>
        </div>
      )}

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Viaturas na Oficina</span>
            <Car className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            4 Viaturas
          </span>
          <span className="text-[12px] text-[#68a46b] font-medium">
            Todas com check-in e fotos
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Validação de Tejadilho</span>
            <ShieldCheck className="h-4 w-4 text-[#68a46b]" />
          </div>
          <span className="text-2xl font-black text-[#68a46b] tabular-nums">
            100%
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Regra mandatória cumprida
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Danos Pré-existentes</span>
            <AlertTriangle className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {totalDamagesRecorded} Registados
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Mapeados nas silhuetas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Entregas Previstas Hoje</span>
            <Clock className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            2 Check-outs
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Inspeção de saída e QC
          </span>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por matrícula, modelo, cliente ou técnico..."
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
            Todos ({checkins.length})
          </button>
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
              activeTab === "entry"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Entradas ({checkins.filter((c) => c.type === "entry").length})
          </button>
          <button
            onClick={() => setActiveTab("exit")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
              activeTab === "exit"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Saídas / Entregas (0)
          </button>
        </div>
      </div>

      {/* Check-ins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCheckins.map((chk) => (
          <Card
            key={chk.id}
            className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150"
          >
            <div>
              {/* Header: Date, Plate & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono text-xs font-bold text-[#f1ede5] self-start">
                    <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                    <span>{chk.vehiclePlate}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#f1ede5] line-clamp-1 mt-1">
                    {chk.vehicleModel}
                  </h3>
                </div>

                <Badge variant="success" className="text-[11px] shrink-0">
                  Entrada Concluída
                </Badge>
              </div>

              {/* Customer & Technician */}
              <div className="flex flex-col gap-1 mt-3 text-xs text-[#a9adae]">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#8a9092]" />
                  <span className="truncate">{chk.customerName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#8a9092]">
                  <span>Técnico: {chk.technicianName}</span>
                  <span>·</span>
                  <span>{chk.createdAt}</span>
                </div>
              </div>

              {/* Odometer & Badges */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-[10px] bg-[#15191a] border border-white/[0.04] text-xs">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8a9092]">Odómetro</span>
                  <span className="font-bold text-[#f1ede5] tabular-nums">
                    {chk.mileage.toLocaleString("pt-PT")} km
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8a9092]">Combustível</span>
                  <span className="font-bold text-[#f1ede5]">
                    {chk.fuelLevel === "full"
                      ? "100% Cheio"
                      : chk.fuelLevel === "three_quarters"
                      ? "3/4 Depósito"
                      : chk.fuelLevel === "half"
                      ? "1/2 Depósito"
                      : "1/4 Depósito"}
                  </span>
                </div>
              </div>

              {/* Roof Photo & Damages Pill */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                {chk.hasRoofPhoto && (
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-[#68a46b] bg-[#68a46b]/10 px-2 py-0.5 rounded-full border border-[#68a46b]/20">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Tejadilho Inspecionado</span>
                  </span>
                )}

                <span className="text-[12px] text-[#8a9092] bg-[#15191a] px-2 py-0.5 rounded-full border border-white/[0.04]">
                  {chk.photos.length} Fotos · {chk.damages.length} Danos
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => handleCopyLink(chk.token)}
                className="flex items-center gap-1 text-xs font-semibold text-[#a9adae] hover:text-[#d3a548] transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Link Relatório</span>
              </button>

              <Link href={`/checkins/${chk.id}`}>
                <Button variant="outline" size="sm" className="bg-[#15191a] text-xs">
                  <FileCheck className="h-3.5 w-3.5 text-[#d3a548]" />
                  <span>Ver Ficha</span>
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
