"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Scan,
  ShieldCheck,
  ChevronRight,
  Layers,
  AlertTriangle,
  Sparkles,
  Info,
  ClipboardCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisionAnalysis } from "@/domains/intelligence/types";
import { formatCheckinDate } from "@/domains/checkins/presentation";

export function VisionOverviewView({
  initialAnalyses,
}: {
  initialAnalyses: VisionAnalysis[];
}) {
  const router = useRouter();
  const analyses = initialAnalyses;
  const totalDamages = analyses.reduce(
    (total, analysis) => total + analysis.damageSuggestions.length,
    0
  );
  const confirmedDamages = analyses.reduce(
    (total, analysis) =>
      total +
      analysis.damageSuggestions.filter((damage) => damage.status === "confirmed")
        .length,
    0
  );
  const averageConfidence =
    analyses.length === 0
      ? 0
      : Math.round(
          (analyses.reduce(
            (total, analysis) => total + analysis.vehicleConfidence,
            0
          ) /
            analyses.length) *
            1000
        ) / 10;
  const reviewedCount = analyses.filter((analysis) => analysis.reviewedBy).length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="gold"
              className="text-[11px] uppercase font-mono tracking-wider flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Pré-visualização · Inteligência Visual
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            X-Flow Vision Review
          </h1>
          <p className="text-sm text-[#a9adae]">
            Análise assistida de fotografias de check-in: reconhecimento de modelo,
            deteção de danos e mapa de painéis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/simulator">
            <Button
              variant="outline"
              className="border-white/[0.1] bg-[#101314] text-[#f1ede5] hover:bg-white/[0.05]"
            >
              <Layers className="h-4 w-4 mr-2 text-[#d3a548]" />
              <span>Simulador 3D</span>
            </Button>
          </Link>

          <Button
            onClick={() => router.push("/checkins")}
            className="bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d] font-bold"
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            <span>Abrir Check-ins</span>
          </Button>
        </div>
      </div>

      <div
        role="status"
        className="flex items-start gap-3 p-4 rounded-md bg-[#1f1b14] border border-[#d3a548]/40"
      >
        <Info className="h-5 w-5 shrink-0 text-[#f7d46d]" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[#f7d46d]">
            Módulo em pré-visualização
          </span>
          <p className="text-xs text-[#a9adae] leading-relaxed">
            O X-Flow Vision ainda não está ligado a um serviço de análise de imagem. As
            análises abaixo são dados de demonstração e as decisões de revisão não são
            guardadas. Usa esta área para validar o fluxo antes da integração do modelo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Viaturas Analisadas</span>
            <div className="text-2xl font-bold text-[#f1ede5] mt-1 tabular-nums">
              {analyses.length}
            </div>
            <span className="text-[12px] text-[#8a9092] flex items-center gap-1 mt-0.5">
              <Eye className="h-3 w-3" />
              {reviewedCount} com revisão iniciada
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#d3a548]">
            <Eye className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Danos Sinalizados</span>
            <div className="text-2xl font-bold text-[#f7d46d] mt-1 tabular-nums">
              {totalDamages}
            </div>
            <span className="text-[12px] text-[#8a9092]">
              {confirmedDamages} confirmados na revisão
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#f7d46d]">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Confiança Média dos Modelos</span>
            <div className="text-2xl font-bold text-[#68a46b] mt-1 tabular-nums">
              {averageConfidence}%
            </div>
            <span className="text-[12px] text-[#8a9092]">
              Reconhecimento de peças e cor (demo)
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#68a46b]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#f1ede5]">
            Análises Técnicas Recentes
          </h2>
          <span className="text-xs text-[#8a9092]">
            {analyses.length} {analyses.length === 1 ? "análise" : "análises"}
          </span>
        </div>

        {analyses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#15191a] text-[#8a9092]">
              <Scan className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#f1ede5]">
              Ainda não existem análises Vision
            </h3>
            <p className="max-w-md text-xs text-[#a9adae]">
              Cria primeiro um check-in com fotografias. Quando a integração de análise
              de imagem estiver ativa, as análises aparecem aqui.
            </p>
            <Button variant="primary" onClick={() => router.push("/checkins/new")}>
              <ClipboardCheck className="h-4 w-4" />
              <span>Novo Check-in</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {analyses.map((analysis) => {
              const confirmed = analysis.damageSuggestions.filter(
                (damage) => damage.status === "confirmed"
              ).length;

              return (
                <Card
                  key={analysis.id}
                  className="p-5 bg-[#101314] border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#1f1b14] border border-[#d3a548]/30 text-[#d3a548]">
                      <Scan className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/[0.06] text-[#f1ede5]">
                          {analysis.vehiclePlate}
                        </span>
                        <h3 className="text-base font-bold text-[#f1ede5]">
                          {analysis.vehicleMake} {analysis.vehicleModel}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[11px] text-[#f7d46d] border-[#d3a548]/30"
                        >
                          Pré-visualização
                        </Badge>
                      </div>

                      <p className="text-xs text-[#a9adae]">
                        Cor Original:{" "}
                        <span className="text-[#f1ede5] font-semibold">
                          {analysis.originalColorName}
                        </span>{" "}
                        · Serviço:{" "}
                        <span className="text-[#d3a548] font-semibold">
                          {analysis.serviceType}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#8a9092] pt-1">
                        <span>{analysis.damageSuggestions.length} anomalias assinaladas</span>
                        <span aria-hidden="true">·</span>
                        <span>{confirmed} confirmadas</span>
                        <span aria-hidden="true">·</span>
                        <span>{analysis.panels.length} painéis avaliados</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Revisão por: {analysis.reviewedBy || "Pendente"}
                        </span>
                      </div>
                      <span className="text-[12px] text-[#8a9092]">
                        {formatCheckinDate(analysis.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <Button
                      className="bg-[#1f1b14] border border-[#d3a548]/40 text-[#f7d46d] hover:bg-[#d3a548] hover:text-[#050606] font-bold text-xs"
                      onClick={() => router.push(`/vision/${analysis.id}`)}
                    >
                      <span>Abrir Ficha de Revisão</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
