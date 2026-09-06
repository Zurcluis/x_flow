"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Check,
} from "lucide-react";
import { QCItem, QCItemStatus, QCInspection } from "@/domains/production/types";
import { validateQCInspection } from "@/domains/production/qc-validator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QCInspectionGridProps {
  inspection: QCInspection;
  onChangeItems: (items: QCItem[]) => void;
  onApproveInspection: () => void;
}

export function QCInspectionGrid({
  inspection,
  onChangeItems,
  onApproveInspection,
}: QCInspectionGridProps) {
  const [items, setItems] = useState<QCItem[]>(inspection.items);
  const [activeReworkId, setActiveReworkId] = useState<string | null>(null);

  const validation = validateQCInspection(items);

  const handleStatusChange = (itemId: string, newStatus: QCItemStatus) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          status: newStatus,
          reworkNotes: newStatus === "fail" ? (item.reworkNotes || "Micro-bolha detetada sob luz de detalhe. Requer aplicação de calor.") : undefined,
        };
      }
      return item;
    });

    setItems(updated);
    onChangeItems(updated);

    if (newStatus === "fail") {
      setActiveReworkId(itemId);
    } else if (activeReworkId === itemId) {
      setActiveReworkId(null);
    }
  };

  const handleReworkNoteChange = (itemId: string, note: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, reworkNotes: note } : item
    );
    setItems(updated);
    onChangeItems(updated);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "finish":
        return "Acabamento da Película";
      case "edges":
        return "Remates & Cantos";
      case "alignment":
        return "Alinhamento & Folgas";
      case "cleanliness":
        return "Limpeza & Vidros";
      case "safety":
        return "Segurança & Sensores";
      default:
        return category;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: QC Approval Status */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[18px] border transition-all ${
          validation.canApprove
            ? "bg-gradient-to-r from-[#142618] to-[#101c13] border-[#68a46b]/50 shadow-[0_12px_36px_rgba(104,164,107,0.15)]"
            : "bg-gradient-to-r from-[#2a1714] to-[#1a1210] border-[#f05a50]/60 shadow-[0_12px_36px_rgba(240,90,80,0.15)]"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              validation.canApprove
                ? "bg-[#68a46b]/20 text-[#68a46b]"
                : "bg-[#f05a50]/20 text-[#f05a50]"
            }`}
          >
            {validation.canApprove ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-[#f1ede5]">
              {validation.canApprove
                ? "Conformidade Total de Qualidade: 10/10 Pontos Aprovados"
                : `Atenção: ${validation.failedItems.length} Ponto(s) com Defeito — Obra em Retrabalho`}
            </span>
            <span className="text-xs text-[#a9adae]">
              {validation.canApprove
                ? "Viatura inspecionada sob luz Scangrip. Apta para emissão do Certificado de Conformidade."
                : "A entrega e o passaporte digital estão bloqueados até resolução de todas as não-conformidades."}
            </span>
          </div>
        </div>

        <Badge
          variant={validation.canApprove ? "success" : "danger"}
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          {validation.canApprove ? "QC PASS" : "REWORK NECESSÁRIO"}
        </Badge>
      </div>

      {/* 10 Inspection Criteria Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Checklist Rigoroso de 10 Pontos Críticos
          </span>
          <span className="text-xs text-[#8a9092]">
            {validation.passedCount} de {validation.totalCount} aprovados
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {items.map((item, idx) => {
            const isFailed = item.status === "fail";
            const isPassed = item.status === "pass";

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-2 p-4 rounded-md border transition-all ${
                  isFailed
                    ? "bg-[#1c1212] border-[#f05a50]/60"
                    : isPassed
                    ? "bg-[#101314] border-white/[0.06] hover:border-white/15"
                    : "bg-[#0c0f10] border-white/[0.04]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-[#8a9092] shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#f1ede5]">
                          {item.criterionName}
                        </span>
                        <span className="text-[11px] uppercase font-semibold text-[#8a9092] bg-[#15191a] px-2 py-0.2 rounded-full border border-white/[0.04]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pass / Fail Toggle buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, "pass")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                        isPassed
                          ? "bg-[#142618] text-[#68a46b] border border-[#68a46b]/40 shadow-sm"
                          : "bg-[#15191a] text-[#8a9092] border border-white/[0.04] hover:text-[#f1ede5]"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Conforme</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, "fail")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                        isFailed
                          ? "bg-[#3a1515] text-[#f05a50] border border-[#f05a50] shadow-sm"
                          : "bg-[#15191a] text-[#8a9092] border border-white/[0.04] hover:text-[#f05a50]"
                      }`}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reprovar</span>
                    </button>
                  </div>
                </div>

                {/* Rework note box if failed */}
                {isFailed && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-[#f05a50]/20 text-xs">
                    <label className="font-semibold text-[#f05a50]">
                      Ação Corretiva de Retrabalho Obrigatória:
                    </label>
                    <input
                      type="text"
                      value={item.reworkNotes || ""}
                      onChange={(e) => handleReworkNoteChange(item.id, e.target.value)}
                      placeholder="Descreve a correção necessária..."
                      className="h-9 px-3 rounded-sm bg-[#0c0808] border border-[#f05a50]/50 text-xs text-[#f1ede5] focus:border-[#f05a50]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Approval Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-xs text-[#a9adae]">Inspetor Responsável:</span>
          <span className="font-bold text-sm text-[#f1ede5]">
            {inspection.inspectorName}
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onApproveInspection}
          disabled={!validation.canApprove}
          className={!validation.canApprove ? "opacity-40 cursor-not-allowed" : ""}
        >
          <Check className="h-4 w-4" />
          <span>Emitir Certificado Digital de Conformidade QC</span>
        </Button>
      </div>
    </div>
  );
}
