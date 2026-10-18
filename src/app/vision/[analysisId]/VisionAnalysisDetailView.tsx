"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Wrench,
  Sparkles,
  FileCheck,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisionDamageAnnotator } from "@/components/xflow/vision/VisionDamageAnnotator";
import { PanelAssessmentList } from "@/components/xflow/vision/PanelAssessmentList";
import { formatCoverageLabel } from "@/domains/intelligence/vision-analyzer";
import { VisionAnalysis } from "@/domains/intelligence/types";
import { formatCheckinDate } from "@/domains/checkins/presentation";

interface VisionAnalysisDetailViewProps {
  initialAnalysis: VisionAnalysis;
  vehicleId?: string;
}

const COLOR_HEX: Record<string, string> = {
  green: "#1b3a28",
  silver: "#b8bcc0",
  white: "#e8e6e1",
  black: "#111314",
  dark_grey: "#373a3c",
  grey: "#70767c",
  blue: "#28405f",
  red: "#7a2424",
};

export function VisionAnalysisDetailView({
  initialAnalysis,
  vehicleId,
}: VisionAnalysisDetailViewProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<VisionAnalysis>(initialAnalysis);
  const [isSaved, setIsSaved] = useState(false);

  const handleUpdateDamageStatus = (
    damageId: string,
    status: "confirmed" | "rejected"
  ) => {
    setAnalysis((prev) => ({
      ...prev,
      damageSuggestions: prev.damageSuggestions.map((d) =>
        d.id === damageId ? { ...d, status } : d
      ),
    }));
  };

  const handleTogglePanel = (panelCode: string) => {
    setAnalysis((prev) => ({
      ...prev,
      panels: prev.panels.map((p) =>
        p.panelCode === panelCode
          ? {
              ...p,
              status: p.status === "confirmed" ? "pending" : "confirmed",
            }
          : p
      ),
    }));
  };

  const handleOpenQuote = () => {
    if (!vehicleId) return;
    setIsSaved(true);
    router.push(`/quotes/new?vehicle=${encodeURIComponent(vehicleId)}`);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <Link href="/vision">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/[0.06] text-[#f1ede5]">
                {analysis.vehiclePlate}
              </span>
              <Badge variant="gold" className="text-[11px] font-mono">
                Pré-visualização · {Math.round(analysis.vehicleConfidence * 100)}% demo
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              {analysis.vehicleMake} {analysis.vehicleModel}
            </h1>
            <span className="text-[12px] text-[#8a9092]">
              {formatCheckinDate(analysis.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Button
            onClick={handleOpenQuote}
            disabled={!vehicleId || isSaved}
            className="bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d] font-bold"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>A abrir Orçamento...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                <span>Usar Viatura em Orçamento</span>
              </>
            )}
          </Button>
          {!vehicleId && (
            <span className="text-[11px] text-[#f78e85]">
              Matrícula demo sem viatura correspondente nesta organização.
            </span>
          )}
        </div>
      </div>

      <div
        role="status"
        className="flex items-start gap-3 p-4 rounded-md bg-[#1f1b14] border border-[#d3a548]/40"
      >
        <Info className="h-5 w-5 shrink-0 text-[#f7d46d]" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[#f7d46d]">
            Revisão em pré-visualização
          </span>
          <p className="text-xs text-[#a9adae] leading-relaxed">
            Confirmações e rejeições nesta ficha são apenas locais e não são guardadas.
            O botão de orçamento abre a viatura real correspondente à matrícula, quando
            existir.
          </p>
        </div>
      </div>

      {/* Color & Contrast Analysis Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">Deteção de Cor de Fábrica</span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-white/20"
              style={{
                backgroundColor:
                  COLOR_HEX[analysis.originalColorFamily] ?? "#8a9092",
              }}
            />
            <span className="font-bold text-sm text-[#f1ede5]">
              {analysis.originalColorName}
            </span>
          </div>
          <span className="text-[12px] text-[#68a46b]">
            Confiança cromática: {Math.round(analysis.colorConfidence * 100)}%
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">Acabamento Solicitado</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#d3a548]">
              {analysis.targetColorName}
            </span>
          </div>
          <span className="text-[12px] text-[#a9adae]">
            Serviço: {analysis.serviceType}
          </span>
        </Card>

        <Card
          className={`p-4 border flex flex-col justify-between gap-2 ${
            analysis.contrastLevel === "high"
              ? "bg-[#2a1714] border-[#f05a50]/40 text-[#f05a50]"
              : "bg-[#101314] border-white/[0.06] text-[#68a46b]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">
              Contraste & Cobertura
            </span>
            <Badge
              variant={analysis.contrastLevel === "high" ? "danger" : "success"}
              className="text-[11px] uppercase font-mono"
            >
              Contraste {analysis.contrastLevel === "high" ? "Alto" : "Baixo"}
            </Badge>
          </div>
          <span className="font-bold text-xs text-[#f1ede5]">
            {formatCoverageLabel(analysis.recommendedCoverage)}
          </span>
          <span className="text-[12px] text-[#a9adae]">
            {analysis.contrastLevel === "high"
              ? "Aviso: Requer retornos amplos nas soleiras para ocultar cor de origem."
              : "Película compatível sem risco de desfasamento estético nas frestas."}
          </span>
        </Card>
      </div>

      {/* Section 1: Interactive Damage Annotator */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#f1ede5] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d3a548]" />
            <span>1. Deteção Visual Assistida de Danos (Bounding Boxes)</span>
          </h3>
          <span className="text-xs text-[#a9adae]">
            {analysis.damageSuggestions.filter((d) => d.status === "confirmed").length}/
            {analysis.damageSuggestions.length} Danos Confirmados
          </span>
        </div>

        <VisionDamageAnnotator
          photoUrl="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&auto=format&fit=crop&q=80"
          photoLabel="Frente da Viatura (fotografia ilustrativa)"
          suggestions={analysis.damageSuggestions}
          onUpdateStatus={handleUpdateDamageStatus}
        />
      </div>

      {/* Section 2: Panel Assessment & Disassembly Requirements */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#f1ede5] flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#d3a548]" />
          <span>2. Avaliação Técnica dos Painéis e Desmontagens</span>
        </h3>

        <PanelAssessmentList
          panels={analysis.panels}
          onToggleStatus={handleTogglePanel}
        />
      </div>

      {/* Section 3: Recommended Technical Sequence */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#f1ede5] flex items-center gap-2">
          <Wrench className="h-4 w-4 text-[#d3a548]" />
          <span>3. Sequência Técnica de Execução Recomendada (8 Etapas)</span>
        </h3>

        <Card className="p-4 bg-[#101314] border-white/[0.06]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {analysis.recommendedSequence.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-[#0c0f10] border border-white/[0.04] flex items-start gap-2.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d3a548]/20 text-[#d3a548] text-xs font-bold font-mono">
                  {idx + 1}
                </div>
                <span className="text-xs text-[#f1ede5] leading-relaxed">
                  {step.replace(/^\d+\.\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
