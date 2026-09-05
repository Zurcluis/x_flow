import React from "react";
import { Check, Clock } from "lucide-react";
import { WorkOrderPhase, PhaseKey } from "@/domains/production/types";

interface WorkOrderPhaseStepperProps {
  phases: WorkOrderPhase[];
  activePhaseKey: PhaseKey;
  onSelectPhase: (phaseKey: PhaseKey) => void;
}

export function WorkOrderPhaseStepper({
  phases,
  activePhaseKey,
  onSelectPhase,
}: WorkOrderPhaseStepperProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-[18px] bg-[#101314] border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
          Fases Técnicas da Obra (8 Etapas Sequenciais)
        </span>
        <span className="text-[12px] text-[#8a9092]">
          {phases.filter((p) => p.status === "completed").length} de {phases.length} concluídas
        </span>
      </div>

      {/* Stepper horizontal row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 select-none">
        {phases.map((phase, idx) => {
          const isSelected = activePhaseKey === phase.phaseKey;
          const isCompleted = phase.status === "completed";
          const isInProgress = phase.status === "in_progress";

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhase(phase.phaseKey)}
              className={`flex flex-col items-start justify-between p-2.5 rounded-[12px] border text-left transition-all cursor-pointer min-h-[72px] ${
                isSelected
                  ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d] shadow-sm ring-1 ring-[#d3a548]/30"
                  : isCompleted
                  ? "bg-[#141b17] border-[#68a46b]/40 text-[#68a46b]"
                  : isInProgress
                  ? "bg-[#1c1811] border-[#d3a548]/60 text-[#f7d46d] animate-pulse"
                  : "bg-[#0c0f10] border-white/[0.04] text-[#8a9092] hover:border-white/15 hover:text-[#a9adae]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-[11px] font-bold">
                  {idx + 1}
                </span>
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-[#68a46b]" />
                ) : isInProgress ? (
                  <Clock className="h-3.5 w-3.5 text-[#d3a548]" />
                ) : null}
              </div>

              <span className="text-[12px] font-bold leading-snug line-clamp-2 mt-1">
                {phase.name.replace(/^\d+\.\s*/, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
