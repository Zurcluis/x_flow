"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Scan,
  ShieldCheck,
  ChevronRight,
  Layers,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialVisionAnalyses } from "@/lib/demo-data/vision-simulation-data";

export default function VisionOverviewPage() {
  const [analyses] = useState(initialVisionAnalyses);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState(false);

  const handleTriggerAnalysis = () => {
    setIsSimulatingUpload(true);
    setTimeout(() => {
      setIsSimulatingUpload(false);
      setUploadSuccessMessage(true);
      setTimeout(() => setUploadSuccessMessage(false), 4000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="gold"
              className="text-[11px] uppercase font-mono tracking-wider flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Terceira Versão • Inteligência Visual
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            X-Flow Vision Review
          </h1>
          <p className="text-sm text-[#a9adae]">
            Análise assistida de fotografias de check-in: reconhecimento de modelo, deteção de danos e mapa de painéis.
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
            onClick={handleTriggerAnalysis}
            disabled={isSimulatingUpload}
            className="bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d] font-bold"
          >
            {isSimulatingUpload ? (
              <>
                <Scan className="h-4 w-4 mr-2 animate-spin text-[#050606]" />
                <span>A analisar imagens...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4 mr-2" />
                <span>Nova Análise Vision</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {uploadSuccessMessage && (
        <div className="p-4 rounded-md bg-[#142618] border border-[#68a46b]/40 text-[#68a46b] flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-bold text-[#f1ede5]">
            Fotografias analisadas com sucesso pelo modelo X-Flow Vision! Dados prontos para validação humana.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Viaturas Analisadas</span>
            <div className="text-2xl font-bold text-[#f1ede5] mt-1">2</div>
            <span className="text-[12px] text-[#68a46b] flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="h-3 w-3" />
              100% com validação humana
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#d3a548]">
            <Eye className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Danos Detetados por IA</span>
            <div className="text-2xl font-bold text-[#f7d46d] mt-1">3</div>
            <span className="text-[12px] text-[#a9adae]">Picadas de gravilha e riscos</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#f7d46d]">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a9adae]">Confiança Média dos Modelos</span>
            <div className="text-2xl font-bold text-[#68a46b] mt-1">97.5%</div>
            <span className="text-[12px] text-[#a9adae]">Reconhecimento de peças e cor</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#68a46b]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Analysis List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-[#f1ede5]">
          Análises Técnicas Recentes
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {analyses.map((analysis) => (
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
                    <Badge variant="outline" className="text-[11px] text-[#68a46b] border-[#68a46b]/30">
                      {Math.round(analysis.vehicleConfidence * 100)}% Confiança IA
                    </Badge>
                  </div>

                  <p className="text-xs text-[#a9adae]">
                    Cor Original: <span className="text-[#f1ede5] font-semibold">{analysis.originalColorName}</span> • Serviço: <span className="text-[#d3a548] font-semibold">{analysis.serviceType}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#8a9092] pt-1">
                    <span>{analysis.damageSuggestions.length} anomalias assinaladas</span>
                    <span>•</span>
                    <span>{analysis.panels.length} painéis avaliados</span>
                    <span>•</span>
                    <span>Revisão por: {analysis.reviewedBy || "Pendente"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <Link href={`/vision/${analysis.id}`}>
                  <Button className="bg-[#1f1b14] border border-[#d3a548]/40 text-[#f7d46d] hover:bg-[#d3a548] hover:text-[#050606] font-bold text-xs">
                    <span>Abrir Ficha de Revisão</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
