"use client";

import React from "react";
import { VisionPanelAssessment } from "@/domains/intelligence/types";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface PanelAssessmentListProps {
  panels: VisionPanelAssessment[];
  onToggleStatus?: (panelCode: string) => void;
  isReadOnly?: boolean;
}

export function PanelAssessmentList({
  panels,
  onToggleStatus,
  isReadOnly = false,
}: PanelAssessmentListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {panels.map((panel) => {
        const isConfirmed = panel.status === "confirmed";

        return (
          <div
            key={panel.panelCode}
            className={`p-4 rounded-lg border flex flex-col justify-between gap-4 transition-all ${
              isConfirmed
                ? "bg-[#101314] border-white/[0.08]"
                : "bg-[#1f1b14] border-[#d3a548]/40"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-[#d3a548]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#f1ede5]">
                    {panel.panelName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#a9adae] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(panel.estimatedMinutes / 60)}h{" "}
                      {panel.estimatedMinutes % 60 > 0 &&
                        `${panel.estimatedMinutes % 60}m`}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {Math.round(panel.confidence * 100)}% Confiança IA
                    </span>
                  </div>
                </div>
              </div>

              <Badge
                variant={
                  panel.complexity === "high"
                    ? "danger"
                    : panel.complexity === "medium"
                    ? "gold"
                    : "outline"
                }
                className="text-[11px] uppercase font-mono"
              >
                Complexidade {panel.complexity === "high" ? "Alta" : panel.complexity === "medium" ? "Média" : "Baixa"}
              </Badge>
            </div>

            {/* Disassembly & Risks */}
            <div className="space-y-2.5 text-xs">
              {panel.disassemblyRecommended.length > 0 && (
                <div className="p-2.5 rounded-[10px] bg-[#0c0f10] border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#d3a548] mb-1">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Desmontagem Recomendada:</span>
                  </div>
                  <ul className="list-disc list-inside text-[#a9adae] space-y-0.5 pl-1">
                    {panel.disassemblyRecommended.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {panel.risks.length > 0 && (
                <div className="p-2.5 rounded-[10px] bg-[#1a1412] border border-[#f05a50]/20">
                  <div className="flex items-center gap-1.5 font-semibold text-[#f05a50] mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Pontos de Atenção & Sensores:</span>
                  </div>
                  <ul className="list-disc list-inside text-[#e0a8a4] space-y-0.5 pl-1">
                    {panel.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!isReadOnly && onToggleStatus && (
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[12px] text-[#8a9092]">
                  Validação técnica humana:
                </span>
                <button
                  type="button"
                  onClick={() => onToggleStatus(panel.panelCode)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isConfirmed
                      ? "bg-[#68a46b]/20 text-[#68a46b] hover:bg-[#68a46b]/30"
                      : "bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d]"
                  }`}
                >
                  {isConfirmed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Validado</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Aprovar Painel</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
