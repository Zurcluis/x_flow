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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { VehicleTimeBookModel } from "@/domains/timebook/types";

export function TimeBookView({ initialModels }: { initialModels: VehicleTimeBookModel[] }) {
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModels[0]?.id ?? "");

  const activeModel =
    initialModels.find((m) => m.id === selectedModelId) ||
    initialModels[0];

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "reliable":
        return (
          <Badge
            variant="outline"
            className="bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30 text-xs font-semibold px-2.5 py-0.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Fiável (&gt;15 amostras)
          </Badge>
        );
      case "learning":
        return (
          <Badge
            variant="outline"
            className="bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30 text-xs font-semibold px-2.5 py-0.5"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Em Aprendizagem (5-14 amostras)
          </Badge>
        );
      case "initial":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-[#6e93b5]/15 text-[#6e93b5] border-[#6e93b5]/30 text-xs font-semibold px-2.5 py-0.5"
          >
            <Info className="h-3.5 w-3.5 mr-1" />
            Inicial (&lt;5 amostras)
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-[#d3a548]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              X-Motion Time Book
            </h1>
          </div>
          <p className="text-xs text-[#a9adae] mt-1">
            Biblioteca técnica de produtividade e benchmarks de horas reais por modelo, serviço e painel.
          </p>
        </div>

        <Link href="/quotes/new">
          <Button
            variant="primary"
            size="sm"
            className="bg-[#d3a548] text-[#050606] font-semibold text-xs h-9"
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            <span>Usar no Configurador de Orçamento</span>
          </Button>
        </Link>
      </div>

      {/* Methodological Transparency Alert */}
      <div className="p-4 rounded-md bg-[#15191a] border border-white/[0.08] flex items-start gap-3">
        <Info className="h-5 w-5 text-[#d3a548] shrink-0 mt-0.5" />
        <div className="text-xs text-[#a9adae] leading-relaxed">
          <span className="font-bold text-[#f1ede5] block mb-0.5">
            Regra Fundamental do Time Book: Transparência Metodológica
          </span>
          Estimativas preliminares e tempos observados nunca são misturados. Cada benchmark indica o número exato de viaturas concluídas, a mediana estatística e o grau de confiança. A meta inicial de maturidade é de{" "}
          <strong className="text-[#f7d46d]">10 a 15 viaturas comparáveis</strong>.
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
        {initialModels.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelectedModelId(model.id)}
            className={`px-4 py-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              selectedModelId === model.id
                ? "bg-[#d3a548] text-[#050606] shadow-lg"
                : "bg-[#101314] text-[#a9adae] hover:text-[#f1ede5] border border-white/[0.06] hover:border-white/20"
            }`}
          >
            <Car className="h-4 w-4" />
            <span>
              {model.make} {model.model} ({model.serviceType})
            </span>
          </button>
        ))}
      </div>

      {/* Selected Model Overview */}
      <div className="p-6 rounded-[18px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              {activeModel.make} {activeModel.model}
            </h2>
            {getConfidenceBadge(activeModel.overallConfidence)}
          </div>
          <span className="text-xs text-[#a9adae]">
            Serviço: <strong className="text-[#f7d46d]">{activeModel.serviceType}</strong> • Ano/Geração: {activeModel.generationYear} • Carroçaria: {activeModel.bodyType}
          </span>
          {activeModel.notes && (
            <p className="text-xs text-[#8a9092] mt-1 italic">
              {activeModel.notes}
            </p>
          )}
        </div>

        {/* Model KPI Stat Boxes */}
        <div className="grid grid-cols-3 gap-3 self-start md:self-auto">
          <div className="p-3 rounded-md bg-[#101314] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold block mb-1">
              Mediana Real
            </span>
            <span className="font-mono font-bold text-lg text-[#f7d46d]">
              {activeModel.totalMedianHours}h
            </span>
          </div>
          <div className="p-3 rounded-md bg-[#101314] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold block mb-1">
              Estimativa Base
            </span>
            <span className="font-mono font-bold text-lg text-[#f1ede5]">
              {activeModel.totalEstimatedHours}h
            </span>
          </div>
          <div className="p-3 rounded-md bg-[#101314] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold block mb-1">
              Amostras Reais
            </span>
            <span className="font-mono font-bold text-lg text-[#68a46b]">
              {activeModel.totalSamples}
            </span>
          </div>
        </div>
      </div>

      {/* Panels Breakdown Table */}
      <Card className="p-6 bg-[#101314] border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#d3a548]" />
            <h3 className="text-base font-bold text-[#f1ede5]">
              Tempos Detalhados por Painel / Peça ({activeModel.panels.length})
            </h3>
          </div>
          <span className="text-xs text-[#8a9092]">Cálculo baseado em minutos ativos de aplicação</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-[#8a9092]">
              <tr>
                <th className="pb-3 font-semibold">Painel / Peça</th>
                <th className="pb-3 font-semibold text-center">Tipo Serviço</th>
                <th className="pb-3 font-semibold text-right">Tempo Mediano</th>
                <th className="pb-3 font-semibold text-right">Intervalo Observado</th>
                <th className="pb-3 font-semibold text-center">Nº Amostras</th>
                <th className="pb-3 font-semibold text-center">Nível de Confiança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {activeModel.panels.map((panel) => (
                <tr key={panel.panelCode} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-3">
                    <span className="font-bold text-[#f1ede5] block">
                      {panel.panelName}
                    </span>
                    <span className="font-mono text-[11px] text-[#8a9092]">
                      {panel.panelCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-[#15191a] text-[#f1ede5] border-white/10">
                      {panel.serviceType}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-right text-[#f7d46d]">
                    {(panel.medianMinutes / 60).toFixed(1)} h ({panel.medianMinutes} min)
                  </td>
                  <td className="py-3.5 px-3 font-mono text-right text-[#a9adae]">
                    {(panel.minMinutes / 60).toFixed(1)}h – {(panel.maxMinutes / 60).toFixed(1)}h
                  </td>
                  <td className="py-3.5 px-3 font-mono text-center text-[#f1ede5]">
                    {panel.sampleCount}
                  </td>
                  <td className="py-3.5 pl-3 text-center">
                    {getConfidenceBadge(panel.confidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
