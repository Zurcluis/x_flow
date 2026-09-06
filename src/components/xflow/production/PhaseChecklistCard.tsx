"use client";

import React from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { WorkOrderPhase } from "@/domains/production/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhaseChecklistCardProps {
  phase: WorkOrderPhase;
  onToggleItem: (itemId: string) => void;
  onCompletePhase: (phaseKey: string) => void;
}

export function PhaseChecklistCard({
  phase,
  onToggleItem,
  onCompletePhase,
}: PhaseChecklistCardProps) {
  const allCompleted = phase.checklist.every((i) => i.isCompleted);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Checklist de Execução Técnica
          </span>
          <h3 className="font-bold text-base text-[#f1ede5] mt-0.5">
            {phase.name}
          </h3>
        </div>

        <Badge
          variant={
            phase.status === "completed"
              ? "success"
              : phase.status === "in_progress"
              ? "in_progress"
              : "outline"
          }
          className="text-xs"
        >
          {phase.status === "completed"
            ? "Fase Concluída"
            : phase.status === "in_progress"
            ? "Em Execução"
            : "Pendente"}
        </Badge>
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-2">
        {phase.checklist.map((item) => (
          <label
            key={item.id}
            onClick={() => onToggleItem(item.id)}
            className={`flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer select-none ${
              item.isCompleted
                ? "bg-[#141b17] border-[#68a46b]/40 text-[#f1ede5]"
                : "bg-[#15191a]/50 border-white/[0.04] text-[#a9adae] hover:border-white/15 hover:text-[#f1ede5]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                  item.isCompleted
                    ? "bg-[#68a46b] border-[#68a46b] text-[#050606]"
                    : "border-white/20 bg-[#080a0b]"
                }`}
              >
                {item.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium ${item.isCompleted ? "line-through text-[#a9adae]" : ""}`}>
                {item.label}
              </span>
            </div>

            {item.isCompleted && item.completedByName && (
              <span className="text-[11px] text-[#68a46b] shrink-0 font-medium">
                ✓ {item.completedByName.split(" ")[0]} ({item.completedAt?.slice(-5)})
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Complete Phase Button */}
      {phase.status !== "completed" && (
        <div className="flex items-center justify-end pt-3 border-t border-white/[0.06]">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onCompletePhase(phase.phaseKey)}
            disabled={!allCompleted}
            className={!allCompleted ? "opacity-50 cursor-not-allowed" : ""}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Validar e Concluir Fase</span>
          </Button>
        </div>
      )}
    </div>
  );
}
