"use client";

import React, { useEffect, useState } from "react";
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
  ClipboardX,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkin } from "@/domains/checkins/types";
import {
  checkinStatusLabel,
  formatCheckinDate,
  fuelLevelLabel,
} from "@/domains/checkins/presentation";
import { workshopDateKey } from "@/domains/calendar/datetime";
import { copyTextToClipboard } from "@/lib/clipboard";

function statusVariant(checkin: Checkin): "success" | "gold" {
  return checkin.status === "draft" ? "gold" : "success";
}

export function CheckinsView({ initialCheckins }: { initialCheckins: Checkin[] }) {
  const [checkins] = useState<Checkin[]>(initialCheckins);
  const [activeTab, setActiveTab] = useState<"all" | "entry" | "exit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [copyFeedback, setCopyFeedback] = useState<{
    token: string;
    ok: boolean;
  } | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const showCopyFeedback = (token: string, ok: boolean) => {
    setCopyFeedback({ token, ok });
    window.setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/checkins/report/${token}`;
    const copied = await copyTextToClipboard(url);
    showCopyFeedback(token, copied);
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
        chk.technicianName.toLowerCase().includes(q) ||
        checkinStatusLabel(chk).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const entries = checkins.filter((checkin) => checkin.type === "entry");
  const exits = checkins.filter((checkin) => checkin.type === "exit");
  const uniqueVehicles = new Set(checkins.map((checkin) => checkin.vehicleId)).size;
  const roofCompliant = checkins.filter((checkin) => checkin.hasRoofPhoto).length;
  const roofPercentage =
    checkins.length > 0 ? Math.round((roofCompliant / checkins.length) * 100) : 0;
  const totalDamagesRecorded = checkins.reduce(
    (acc, checkin) => acc + (checkin.damageCount ?? checkin.damages.length),
    0
  );
  const todayKey = workshopDateKey(now);
  const checkoutsToday = exits.filter((checkin) => {
    const date = new Date(checkin.createdAt);
    return !Number.isNaN(date.getTime()) && workshopDateKey(date) === todayKey;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Receção, Inspeção Fotográfica & Entregas
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Check-ins de Viaturas
          </h1>
        </div>

        <Link
          href="/checkins/new"
          className={buttonStyles({
            variant: "primary",
            className: "self-start sm:self-auto",
          })}
        >
          <Plus className="h-4 w-4" />
          <span>Novo Check-in de Entrada</span>
        </Link>
      </div>

      <div aria-live="polite" className="min-h-0">
        {copyFeedback && (
          <div
            role="status"
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-md bg-[#1b2021] border text-xs font-semibold shadow-2xl animate-fade-in ${
              copyFeedback.ok
                ? "border-[#d3a548] text-[#f7d46d]"
                : "border-[#f05a50]/50 text-[#f78e85]"
            }`}
          >
            {copyFeedback.ok ? (
              <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#f05a50]" />
            )}
            <span>
              {copyFeedback.ok
                ? "Link do relatório copiado para a área de transferência."
                : "Não foi possível copiar o link. Abre a ficha e copia o endereço."}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Viaturas com Check-in</span>
            <Car className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {uniqueVehicles}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {entries.length} {entries.length === 1 ? "entrada" : "entradas"} ·{" "}
            {exits.length} {exits.length === 1 ? "saída" : "saídas"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Validação de Tejadilho</span>
            <ShieldCheck className="h-4 w-4 text-[#68a46b]" />
          </div>
          <span
            className={`text-2xl font-black tabular-nums ${
              roofPercentage === 100 && checkins.length > 0
                ? "text-[#68a46b]"
                : "text-[#f7d46d]"
            }`}
          >
            {roofPercentage}%
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {roofCompliant} de {checkins.length} com foto do tejadilho
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Danos Pré-existentes</span>
            <AlertTriangle className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {totalDamagesRecorded}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Mapeados nas fotografias de inspeção
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Check-outs Registados</span>
            <Clock className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {exits.length}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {checkoutsToday} hoje · inspeção de saída
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="checkin-search" className="sr-only">
            Pesquisar check-ins
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            id="checkin-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por matrícula, modelo, cliente ou técnico..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        <div
          className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] select-none"
          role="group"
          aria-label="Filtrar por tipo de check-in"
        >
          {(
            [
              { id: "all", label: "Todos", count: checkins.length },
              { id: "entry", label: "Entradas", count: entries.length },
              { id: "exit", label: "Saídas / Entregas", count: exits.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {filteredCheckins.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#15191a] text-[#8a9092]">
            <ClipboardX className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-[#f1ede5]">
              {checkins.length === 0
                ? "Ainda não existem check-ins registados"
                : "Nenhum check-in corresponde aos filtros"}
            </h2>
            <p className="text-xs text-[#a9adae] max-w-md">
              {checkins.length === 0
                ? "Cria o primeiro check-in para registar fotografias, danos e a assinatura de receção da viatura."
                : "Ajusta a pesquisa ou muda de separador para ver outros registos."}
            </p>
          </div>
          {checkins.length === 0 && (
            <Link
              href="/checkins/new"
              className={buttonStyles({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" />
              <span>Novo Check-in de Entrada</span>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCheckins.map((chk) => {
            const photoCount = chk.photoCount ?? chk.photos.length;
            const damageCount = chk.damageCount ?? chk.damages.length;

            return (
              <Card
                key={chk.id}
                className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150"
              >
                <div>
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

                    <Badge variant={statusVariant(chk)} className="text-[11px] shrink-0">
                      {checkinStatusLabel(chk)}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1 mt-3 text-xs text-[#a9adae]">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#8a9092]" />
                      <span className="truncate">{chk.customerName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#8a9092]">
                      <span>Técnico: {chk.technicianName}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={chk.createdAt}>{formatCheckinDate(chk.createdAt)}</time>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-sm bg-[#15191a] border border-white/[0.04] text-xs">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8a9092]">Odómetro</span>
                      <span className="font-bold text-[#f1ede5] tabular-nums">
                        {chk.mileage.toLocaleString("pt-PT")} km
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8a9092]">Combustível</span>
                      <span className="font-bold text-[#f1ede5]">
                        {fuelLevelLabel(chk.fuelLevel)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    {chk.hasRoofPhoto ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-[#68a46b] bg-[#68a46b]/10 px-2 py-0.5 rounded-full border border-[#68a46b]/20">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Tejadilho Inspecionado</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-[#f7d46d] bg-[#d3a548]/10 px-2 py-0.5 rounded-full border border-[#d3a548]/20">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Sem foto do tejadilho</span>
                      </span>
                    )}

                    <span className="text-[12px] text-[#8a9092] bg-[#15191a] px-2 py-0.5 rounded-full border border-white/[0.04]">
                      {photoCount} fotos · {damageCount} danos
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(chk.token)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#a9adae] hover:text-[#d3a548] transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Copiar Link</span>
                  </button>

                  <Link
                    href={`/checkins/${chk.id}`}
                    className={buttonStyles({
                      variant: "outline",
                      size: "sm",
                      className: "bg-[#15191a] text-xs",
                    })}
                  >
                    <FileCheck className="h-3.5 w-3.5 text-[#d3a548]" />
                    <span>Ver Ficha</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
