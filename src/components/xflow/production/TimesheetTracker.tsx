"use client";

import React, { useState } from "react";
import { Clock, TrendingUp, Plus, Check } from "lucide-react";
import { WorkOrderTimeEntry } from "@/domains/production/types";
import { calculateLaborEfficiency } from "@/domains/production/efficiency-calculator";
import { Button } from "@/components/ui/button";

interface TimesheetTrackerProps {
  timeEntries: WorkOrderTimeEntry[];
  estimatedHours: number;
  onAddTimeEntry: (entry: { technicianName: string; hours: number; notes: string }) => void;
}

export function TimesheetTracker({
  timeEntries,
  estimatedHours,
  onAddTimeEntry,
}: TimesheetTrackerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [techName, setTechName] = useState("João Martins");
  const [hoursInput, setHoursInput] = useState("1.0");
  const [notesInput, setNotesInput] = useState("");

  const totalActualHours = timeEntries.reduce((acc, t) => acc + t.hoursSpent, 0);
  const efficiency = calculateLaborEfficiency(estimatedHours, totalActualHours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTimeEntry({
      technicianName: techName,
      hours: parseFloat(hoursInput) || 1.0,
      notes: notesInput || "Horas de produção registadas",
    });
    setIsModalOpen(false);
    setNotesInput("");
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Timesheet & Cronómetro de Produção
          </span>
          <span className="font-bold text-sm text-[#f1ede5] mt-0.5">
            Horas de Mão de Obra
          </span>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="bg-[#15191a]">
          <Plus className="h-3.5 w-3.5" />
          <span>Registar Horas</span>
        </Button>
      </div>

      {/* Efficiency Gauge */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-[12px] bg-[#0c0f10] border border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#8a9092]">Horas Gastas / Previstas</span>
          <span className="font-mono font-bold text-sm text-[#f1ede5]">
            {totalActualHours}h / {estimatedHours}h
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] text-[#8a9092]">Eficiência da Oficina</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#68a46b]" />
            <span className="font-black text-sm text-[#68a46b]">
              {efficiency.efficiencyPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Time entries list */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
          Histórico de Registos:
        </span>
        {timeEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#15191a] border border-white/[0.03]"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-[#f1ede5] truncate">
                {entry.technicianName}
              </span>
              <span className="text-[11px] text-[#8a9092] truncate">
                {entry.notes}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-mono font-bold text-[#f7d46d]">
                {entry.hoursSpent}h
              </span>
              <span className="text-[11px] text-[#8a9092]">
                {entry.createdAt.slice(-5)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding hours */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-[20px] bg-[#101314] border border-white/[0.12] p-6 shadow-2xl text-[#f1ede5]"
            role="dialog"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="font-bold text-base">Registar Horas de Produção</h3>
              <Clock className="h-4 w-4 text-[#d3a548]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Técnico</label>
                <select
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  <option value="João Martins">João Martins (Lead Detailer)</option>
                  <option value="Rui Almeida">Rui Almeida (Wrap Master)</option>
                  <option value="Pedro Santos">Pedro Santos (PPF Specialist)</option>
                  <option value="Miguel Costa">Miguel Costa (Finishing Specialist)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Horas Gastas</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="12"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Notas de Execução</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="ex: Ajuste e corte de folgas..."
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <Check className="h-4 w-4" />
                  <span>Registar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
