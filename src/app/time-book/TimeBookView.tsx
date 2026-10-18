"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Car,
  Layers,
  CheckCircle2,
  Info,
  Calculator,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleTimeBookModel } from "@/domains/timebook/types";
import type { BenchmarkConfidence } from "@/domains/timebook/types";

const PRIMARY_LINK_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-[#e7c77c]/30 bg-gradient-to-r from-[#d3a548] to-[#a77c2e] px-3 text-xs font-semibold text-[#050606] shadow-[0_4px_20px_rgba(211,165,72,0.25)] transition-all duration-150 hover:brightness-110 active:scale-[0.98]";

function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${String(rest).padStart(2, "0")}min`;
}

function ConfidenceBadge({
  confidence,
  compact = false,
}: {
  confidence: BenchmarkConfidence;
  compact?: boolean;
}) {
  switch (confidence) {
    case "reliable":
      return (
        <Badge
          variant="outline"
          title="15 ou mais viaturas concluídas"
          className="bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30 text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {compact ? "Fiável" : "Fiável (15+ viaturas)"}
        </Badge>
      );
    case "learning":
      return (
        <Badge
          variant="outline"
          title="Entre 5 e 14 viaturas concluídas"
          className="bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30 text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap"
        >
          <Clock className="h-3.5 w-3.5 mr-1" />
          {compact ? "Aprendizagem" : "Em aprendizagem (5-14 viaturas)"}
        </Badge>
      );
    case "initial":
    default:
      return (
        <Badge
          variant="outline"
          title="Menos de 5 viaturas concluídas"
          className="bg-[#6e93b5]/15 text-[#6e93b5] border-[#6e93b5]/30 text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap"
        >
          <Info className="h-3.5 w-3.5 mr-1" />
          {compact ? "Inicial" : "Inicial (<5 viaturas)"}
        </Badge>
      );
  }
}

export function TimeBookView({
  initialModels,
  canUseConfigurator,
}: {
  initialModels: VehicleTimeBookModel[];
  canUseConfigurator: boolean;
}) {
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModels[0]?.id ?? "");

  const activeModel =
    initialModels.find((model) => model.id === selectedModelId) || initialModels[0];
  const activeModelId = activeModel?.id ?? "";

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Biblioteca técnica de produtividade
          </span>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#f1ede5]">
            <Clock className="h-6 w-6 text-[#d3a548]" />
            Time Book
          </h1>
          <p className="mt-1 text-xs text-[#a9adae]">
            Benchmarks de horas reais por modelo, serviço e fase, calculados a partir de
            ordens de trabalho concluídas.
          </p>
        </div>

        {canUseConfigurator && (
          <Link href="/quotes/new" className={PRIMARY_LINK_CLASS}>
            <Calculator className="h-4 w-4" />
            <span>Criar orçamento</span>
          </Link>
        )}
      </div>

      {/* Methodological transparency */}
      <div className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-[#15191a] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#d3a548]" />
        <div className="text-xs leading-relaxed text-[#a9adae]">
          <span className="mb-0.5 block font-bold text-[#f1ede5]">
            Transparência metodológica
          </span>
          Só entram viaturas com ordem de trabalho <strong className="text-[#f1ede5]">concluída</strong>{" "}
          e registos reais de horas. Os lançamentos automáticos de conclusão de fase
          (horas estimadas) são excluídos. Cada benchmark mostra o número de viaturas, a
          mediana e o intervalo observado; a meta de maturidade é de{" "}
          <strong className="text-[#f7d46d]">10 a 15 viaturas comparáveis</strong>.
        </div>
      </div>

      {!activeModel ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/[0.08] bg-[#101314]/60 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d3a548]/10 text-[#d3a548]">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[#f1ede5]">
            Ainda não há benchmarks suficientes
          </h2>
          <p className="max-w-md text-xs leading-relaxed text-[#8a9092]">
            Conclui ordens de trabalho com registos reais de horas no painel da obra. Os
            registos automáticos de conclusão de fase não contam como amostras.
          </p>
          <Link
            href="/production"
            className="mt-2 inline-flex h-8 items-center justify-center gap-2 rounded-sm border border-[#d3a548]/40 bg-transparent px-3 text-xs font-medium text-[#f1ede5] transition-all hover:border-[#d3a548] hover:bg-[#d3a548]/10 active:scale-[0.98]"
          >
            <Layers className="h-4 w-4" />
            <span>Ir para Produção</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Model selection tabs */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]"
            role="group"
            aria-label="Selecionar modelo"
          >
            {initialModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModelId(model.id)}
                aria-pressed={activeModelId === model.id}
                aria-label={`${model.make} ${model.model}, ${model.serviceCategory}, ${model.generationYear}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeModelId === model.id
                    ? "bg-[#d3a548] text-[#050606] shadow-lg"
                    : "border border-white/[0.06] bg-[#101314] text-[#a9adae] hover:border-white/20 hover:text-[#f1ede5]"
                }`}
              >
                <Car className="h-4 w-4" />
                <span>
                  {model.make} {model.model} · {model.serviceCategory}
                </span>
              </button>
            ))}
          </div>

          {/* Selected model overview */}
          <div className="flex flex-col justify-between gap-6 rounded-lg border border-white/[0.08] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] p-6 shadow-xl md:flex-row md:items-center">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
                  {activeModel.make} {activeModel.model}
                </h2>
                <ConfidenceBadge confidence={activeModel.overallConfidence} />
              </div>
              <span className="text-xs text-[#a9adae]">
                Serviço: <strong className="text-[#f7d46d]">{activeModel.serviceCategory}</strong>{" "}
                ({activeModel.serviceType}) • Ano/Geração: {activeModel.generationYear || "—"} •
                Carroçaria: {activeModel.bodyType || "—"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 self-start sm:grid-cols-3 md:self-auto">
              <div className="rounded-md border border-white/[0.04] bg-[#101314] p-3">
                <span className="mb-1 block text-[11px] font-bold uppercase text-[#8a9092]">
                  Mediana Real
                </span>
                <span className="font-mono text-lg font-bold text-[#f7d46d]">
                  {activeModel.totalMedianHours}h
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8a9092]">
                  por viatura concluída
                </span>
              </div>
              <div className="rounded-md border border-white/[0.04] bg-[#101314] p-3">
                <span className="mb-1 block text-[11px] font-bold uppercase text-[#8a9092]">
                  Mediana Planeada
                </span>
                <span className="font-mono text-lg font-bold text-[#f1ede5]">
                  {activeModel.totalEstimatedHours}h
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8a9092]">
                  por viatura concluída
                </span>
              </div>
              <div className="rounded-md border border-white/[0.04] bg-[#101314] p-3">
                <span className="mb-1 block text-[11px] font-bold uppercase text-[#8a9092]">
                  Viaturas
                </span>
                <span className="font-mono text-lg font-bold text-[#68a46b]">
                  {activeModel.totalSamples}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8a9092]">
                  amostras concluídas
                </span>
              </div>
            </div>
          </div>

          {/* Panels breakdown */}
          <Card className="border-white/[0.08] bg-[#101314] p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#d3a548]" />
                <h3 className="text-base font-bold text-[#f1ede5]">
                  Tempos por fase ({activeModel.panels.length})
                </h3>
              </div>
              <span className="text-xs text-[#8a9092]">
                Mediana e intervalo por viatura concluída
              </span>
            </div>

            {activeModel.panels.length === 0 ? (
              <p className="rounded-md border border-dashed border-white/[0.08] px-4 py-6 text-center text-xs text-[#8a9092]">
                Sem fases com registos reais para este modelo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <caption className="sr-only">
                    Tempos por fase para {activeModel.make} {activeModel.model},{" "}
                    {activeModel.serviceCategory}
                  </caption>
                  <thead className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-[#8a9092]">
                    <tr>
                      <th scope="col" className="pb-3 font-semibold">Fase / Painel</th>
                      <th scope="col" className="pb-3 text-center font-semibold">Serviço</th>
                      <th scope="col" className="pb-3 text-right font-semibold">Mediana</th>
                      <th scope="col" className="pb-3 text-right font-semibold">Intervalo</th>
                      <th scope="col" className="pb-3 text-center font-semibold">Viaturas</th>
                      <th scope="col" className="pb-3 pl-3 text-center font-semibold">Confiança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {activeModel.panels.map((panel) => (
                      <tr key={panel.panelCode} className="transition-colors hover:bg-white/[0.02]">
                        <td className="py-3.5 pr-3">
                          <span className="block font-bold text-[#f1ede5]">
                            {panel.panelName}
                          </span>
                          <span className="font-mono text-[11px] text-[#8a9092]">
                            {panel.panelCode}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className="border-white/10 bg-[#15191a] px-2 py-0.5 text-[11px] text-[#f1ede5]"
                          >
                            {panel.serviceType}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-bold text-[#f7d46d]">
                          {formatMinutes(panel.medianMinutes)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-[#a9adae]">
                          {formatMinutes(panel.minMinutes)} – {formatMinutes(panel.maxMinutes)}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono text-[#f1ede5]">
                          {panel.sampleCount}
                        </td>
                        <td className="py-3.5 pl-3 text-center">
                          <ConfidenceBadge confidence={panel.confidence} compact />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
