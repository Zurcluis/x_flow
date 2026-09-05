"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkOrderPhaseStepper } from "@/components/xflow/production/WorkOrderPhaseStepper";
import { PhaseChecklistCard } from "@/components/xflow/production/PhaseChecklistCard";
import { TimesheetTracker } from "@/components/xflow/production/TimesheetTracker";
import { MaterialUsageWidget } from "@/components/xflow/production/MaterialUsageWidget";
import {
  initialBMWPhases,
  initialBMWTimeEntries,
  initialBMWMaterialUsage,
} from "@/lib/demo-data/production-phases-data";
import { initialWorkOrdersData } from "@/lib/demo-data/work-orders-data";
import { PhaseKey } from "@/domains/production/types";

export default function WorkOrderDetailPage() {
  const params = useParams();
  const workOrderId = params?.workOrderId as string;

  const [workOrders] = useState(initialWorkOrdersData);
  const workOrder =
    workOrders.find((w) => w.id === workOrderId) || workOrders[0];

  const [phases, setPhases] = useState(initialBMWPhases);
  const [activePhaseKey, setActivePhaseKey] = useState<PhaseKey>("application");
  const [timeEntries, setTimeEntries] = useState(initialBMWTimeEntries);
  const [materialUsage] = useState(initialBMWMaterialUsage);

  const activePhase =
    phases.find((p) => p.phaseKey === activePhaseKey) || phases[0];

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedPhases = phases.map((phase) => {
      if (phase.phaseKey === activePhaseKey) {
        return {
          ...phase,
          checklist: phase.checklist.map((item) => {
            if (item.id === itemId) {
              const nextState = !item.isCompleted;
              return {
                ...item,
                isCompleted: nextState,
                completedByName: nextState ? "João Martins" : undefined,
                completedAt: nextState
                  ? new Date().toISOString().replace("T", " ").slice(0, 16)
                  : undefined,
              };
            }
            return item;
          }),
        };
      }
      return phase;
    });

    setPhases(updatedPhases);
  };

  const handleCompletePhase = (phaseKey: string) => {
    const updatedPhases = phases.map((phase) => {
      if (phase.phaseKey === phaseKey) {
        return {
          ...phase,
          status: "completed" as const,
          completedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        };
      }
      return phase;
    });

    setPhases(updatedPhases);

    // Auto advance to next phase
    const currentIndex = phases.findIndex((p) => p.phaseKey === phaseKey);
    if (currentIndex >= 0 && currentIndex < phases.length - 1) {
      setActivePhaseKey(phases[currentIndex + 1].phaseKey);
    }
  };

  const handleAddTimeEntry = (entry: {
    technicianName: string;
    hours: number;
    notes: string;
  }) => {
    const newEntry = {
      id: `te-${Date.now()}`,
      workOrderId: workOrder.id,
      phaseKey: activePhaseKey,
      technicianName: entry.technicianName,
      hoursSpent: entry.hours,
      notes: entry.notes,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/production"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Quadro de Produção</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-black text-2xl text-[#f7d46d]">
              {workOrder.workOrderNumber}
            </span>
            <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono text-xs font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{workOrder.vehiclePlate}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              {workOrder.vehicleModel}
            </h1>
            <Badge variant="in_progress" className="text-xs">
              Em Produção ({workOrder.progressPercentage}%)
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <span>Cliente: <strong className="text-[#f1ede5]">{workOrder.customerName}</strong></span>
            <span>·</span>
            <span>Serviço: <strong className="text-[#f1ede5]">{workOrder.serviceTitle}</strong></span>
            <span>·</span>
            <span>Técnico Principal: <strong className="text-[#f1ede5]">{workOrder.primaryTechnicianName}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/checkins/${workOrder.checkinId}`}>
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <FileCheck className="h-4 w-4 text-[#d3a548]" />
              <span>Ver Check-in</span>
            </Button>
          </Link>

          <Link href={`/production/${workOrder.id}/qc`}>
            <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-extrabold">
              <ShieldCheck className="h-4 w-4" />
              <span>Controlo de Qualidade (QC)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stepper of the 8 Sequential Phases */}
      <WorkOrderPhaseStepper
        phases={phases}
        activePhaseKey={activePhaseKey}
        onSelectPhase={setActivePhaseKey}
      />

      {/* Main Grid: Phase Checklist & Production Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Phase Checklist */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <PhaseChecklistCard
            phase={activePhase}
            onToggleItem={handleToggleChecklistItem}
            onCompletePhase={handleCompletePhase}
          />
        </div>

        {/* Right Column: Timesheet & Material Usage */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <TimesheetTracker
            timeEntries={timeEntries}
            estimatedHours={workOrder.estimatedHours}
            onAddTimeEntry={handleAddTimeEntry}
          />

          <MaterialUsageWidget materialUsage={materialUsage} />
        </div>
      </div>
    </div>
  );
}
