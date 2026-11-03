"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  Scissors,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkOrderPhaseStepper } from "@/components/xflow/production/WorkOrderPhaseStepper";
import { PhaseChecklistCard } from "@/components/xflow/production/PhaseChecklistCard";
import { TimesheetTracker } from "@/components/xflow/production/TimesheetTracker";
import { MaterialUsageWidget } from "@/components/xflow/production/MaterialUsageWidget";
import {
  MaterialUsage,
  PhaseKey,
  WorkOrderPhase,
  WorkOrderTimeEntry,
} from "@/domains/production/types";
import { WorkOrder } from "@/domains/checkins/types";
import { calculateRemnantAreaM2, type Material } from "@/domains/materials/types";
import {
  addTimeEntryAction,
  completePhaseAction,
  startPhaseAction,
  toggleChecklistItemAction,
} from "@/app/actions/production";
import {
  listMaterialsAction,
  registerMaterialCutAction,
} from "@/app/actions/materials";

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  initialPhases: WorkOrderPhase[];
  initialTimeEntries: WorkOrderTimeEntry[];
  materialUsage: MaterialUsage[];
  currentUserName: string;
}

export function WorkOrderDetailView({
  workOrder,
  initialPhases,
  initialTimeEntries,
  materialUsage,
  currentUserName,
}: WorkOrderDetailViewProps) {
  const router = useRouter();
  const [phases, setPhases] = useState<WorkOrderPhase[]>(initialPhases);
  const firstActive =
    initialPhases.find((p) => p.status === "in_progress") ??
    initialPhases.find((p) => p.status !== "completed");
  const [activePhaseKey, setActivePhaseKey] = useState<PhaseKey>(
    firstActive?.phaseKey ?? initialPhases[0]?.phaseKey ?? "application"
  );
  const [timeEntries, setTimeEntries] =
    useState<WorkOrderTimeEntry[]>(initialTimeEntries);
  const [usages, setUsages] = useState<MaterialUsage[]>(materialUsage);
  const [lastSynced, setLastSynced] = useState({
    phases: initialPhases,
    timeEntries: initialTimeEntries,
    materialUsage,
  });
  if (
    lastSynced.phases !== initialPhases ||
    lastSynced.timeEntries !== initialTimeEntries ||
    lastSynced.materialUsage !== materialUsage
  ) {
    setLastSynced({
      phases: initialPhases,
      timeEntries: initialTimeEntries,
      materialUsage,
    });
    setPhases(initialPhases);
    setTimeEntries(initialTimeEntries);
    setUsages(materialUsage);
  }
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [showCutModal, setShowCutModal] = useState(false);
  const [stockMaterials, setStockMaterials] = useState<Material[]>([]);
  const [cutForm, setCutForm] = useState({
    materialId: materialUsage[0]?.materialId ?? "",
    metersCut: "3.0",
    estimatedMeters: "3.0",
    notes: "",
    saveRemnant: false,
    remnantWidthCm: "60",
    remnantLengthCm: "120",
    remnantLocation: "Estante A · Tubo 2",
  });

  const activePhase =
    phases.find((p) => p.phaseKey === activePhaseKey) || phases[0];

  const openMaterialCutModal = async (preferredMaterialId?: string) => {
    let loaded = stockMaterials;
    if (loaded.length === 0) {
      try {
        const res = await listMaterialsAction();
        if (res.ok) {
          loaded = res.materials;
          setStockMaterials(res.materials);
        }
      } catch {
        // fallback if offline
      }
    }
    const chosenId =
      preferredMaterialId ||
      cutForm.materialId ||
      loaded[0]?.id ||
      usages[0]?.materialId ||
      "";
    setCutForm((prev) => ({
      ...prev,
      materialId: chosenId,
    }));
    setShowCutModal(true);
  };

  const handleRegisterWorkOrderCut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending || !cutForm.materialId) return;
    setPending(true);
    setFeedback(null);

    const metersCut = Number(cutForm.metersCut);
    const estimatedMeters = Number(cutForm.estimatedMeters) || metersCut;

    try {
      const result = await registerMaterialCutAction({
        materialId: cutForm.materialId,
        metersCut,
        estimatedMeters,
        workOrderId: workOrder.id,
        notes: cutForm.notes || undefined,
        createRemnant: cutForm.saveRemnant
          ? {
              widthCm: Number(cutForm.remnantWidthCm),
              lengthCm: Number(cutForm.remnantLengthCm),
              location: cutForm.remnantLocation,
              notes: cutForm.notes || undefined,
            }
          : undefined,
      });

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível registar o consumo de película.",
        });
        return;
      }

      const mat = stockMaterials.find((m) => m.id === cutForm.materialId);
      const scrapPercentage =
        estimatedMeters > 0 && metersCut > estimatedMeters
          ? Math.round(((metersCut - estimatedMeters) / estimatedMeters) * 10000) /
            100
          : 0;

      const optimisticUsage: MaterialUsage = {
        id: `mu-${Date.now()}`,
        workOrderId: workOrder.id,
        materialId: cutForm.materialId,
        materialName: mat
          ? `${mat.brand} ${mat.name}`
          : usages[0]?.materialName || "Película Registada",
        batchNumber:
          mat?.batches?.[0]?.batchNumber ||
          usages[0]?.batchNumber ||
          "LOTE-OFICINA",
        estimatedMeters,
        actualMeters: metersCut,
        scrapPercentage,
        rollWidthMeters: mat?.rollWidthMeters ?? 1.52,
        costPerMeter: mat?.costPerMeter ?? 0,
      };

      setUsages((prev) => [optimisticUsage, ...prev]);
      setShowCutModal(false);
      setFeedback({
        tone: "success",
        message: `Consumo de ${metersCut} m registado na obra e descontado do stock.`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao registar consumo de película.",
      });
    } finally {
      setPending(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    const item = phases.flatMap((p) => p.checklist).find((c) => c.id === itemId);
    if (!item || pending) return;
    const nextState = !item.isCompleted;
    const previousPhases = phases;
    setPending(true);
    setFeedback(null);

    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.phaseKey !== activePhaseKey) return phase;
        return {
          ...phase,
          checklist: phase.checklist.map((entry) =>
            entry.id === itemId
              ? {
                  ...entry,
                  isCompleted: nextState,
                  completedByName: nextState ? currentUserName : undefined,
                  completedAt: nextState
                    ? new Date().toISOString().slice(0, 16)
                    : undefined,
                }
              : entry
          ),
        };
      })
    );

    try {
      const result = await toggleChecklistItemAction(
        workOrder.id,
        itemId,
        nextState
      );
      if (!result.ok) {
        setPhases(previousPhases);
        setFeedback({
          tone: "error",
          message:
            result.error || "Não foi possível atualizar o item de checklist.",
        });
        return;
      }
      router.refresh();
    } catch (error) {
      setPhases(previousPhases);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o item de checklist.",
      });
    } finally {
      setPending(false);
    }
  };

  const handleCompletePhase = async (phaseKey: string) => {
    const phase = phases.find((p) => p.phaseKey === phaseKey);
    if (!phase || pending) return;

    const previousPhases = phases;
    setPending(true);
    setFeedback(null);

    setPhases((prev) =>
      prev.map((p) =>
        p.phaseKey === phaseKey
          ? {
              ...p,
              status: "completed" as const,
              completedAt: new Date().toISOString().slice(0, 16),
            }
          : p
      )
    );

    try {
      const result = await completePhaseAction(workOrder.id, phase.id);
      if (!result.ok) {
        setPhases(previousPhases);
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível concluir a fase.",
        });
        return;
      }

      const currentIndex = previousPhases.findIndex(
        (p) => p.phaseKey === phaseKey
      );
      if (currentIndex >= 0 && currentIndex < previousPhases.length - 1) {
        const next = previousPhases[currentIndex + 1];
        setActivePhaseKey(next.phaseKey);
        const startResult = await startPhaseAction(workOrder.id, next.id);
        if (!startResult.ok) {
          setFeedback({
            tone: "error",
            message:
              startResult.error ||
              "Fase concluída, mas não foi possível iniciar a seguinte.",
          });
        }
      }
      router.refresh();
    } catch (error) {
      setPhases(previousPhases);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a fase.",
      });
    } finally {
      setPending(false);
    }
  };

  const handleAddTimeEntry = async (entry: {
    technicianName: string;
    hours: number;
    notes: string;
  }) => {
    if (pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const result = await addTimeEntryAction(
        workOrder.id,
        activePhaseKey,
        entry.hours,
        entry.notes || undefined
      );
      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível registar as horas.",
        });
        return;
      }
      const newEntry: WorkOrderTimeEntry = {
        id: `te-${Date.now()}`,
        workOrderId: workOrder.id,
        phaseKey: activePhaseKey,
        technicianName: currentUserName,
        hoursSpent: entry.hours,
        notes: entry.notes,
        createdAt: new Date().toISOString().slice(0, 16),
      };
      setTimeEntries((prev) => [...prev, newEntry]);
      setFeedback({ tone: "success", message: "Registo de horas adicionado." });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível registar as horas.",
      });
    } finally {
      setPending(false);
    }
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

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedback.tone === "error"
              ? "border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f8a19b]"
              : "border-[#68a46b]/30 bg-[#68a46b]/10 text-[#9ed3a0]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

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
            <span>
              Cliente: <strong className="text-[#f1ede5]">{workOrder.customerName}</strong>
            </span>
            <span>·</span>
            <span>
              Serviço: <strong className="text-[#f1ede5]">{workOrder.serviceTitle}</strong>
            </span>
            <span>·</span>
            <span>
              Técnico Principal:{" "}
              <strong className="text-[#f1ede5]">{workOrder.primaryTechnicianName}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openMaterialCutModal()}
          >
            <Scissors className="h-4 w-4 text-[#d3a548]" />
            <span>Registar Corte de Película (m)</span>
          </Button>

          <Link href={`/checkins/${workOrder.checkinId}`}>
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <FileCheck className="h-4 w-4 text-[#d3a548]" />
              <span>Ver Check-in</span>
            </Button>
          </Link>

          <Link href={`/production/${workOrder.id}/qc`}>
            <Button
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-extrabold"
            >
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
            disabled={pending}
            onToggleItem={handleToggleChecklistItem}
            onCompletePhase={handleCompletePhase}
          />
        </div>

        {/* Right Column: Timesheet & Material Usage */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <TimesheetTracker
            timeEntries={timeEntries}
            estimatedHours={workOrder.estimatedHours}
            currentUserName={currentUserName}
            disabled={pending}
            onAddTimeEntry={handleAddTimeEntry}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
              Consumo de Película na Obra
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openMaterialCutModal()}
              className="text-[11px]"
            >
              <Scissors className="h-3.5 w-3.5 text-[#d3a548]" />
              <span>Registar Corte (m)</span>
            </Button>
          </div>

          {usages.length > 0 ? (
            usages.map((mu) => (
              <MaterialUsageWidget
                key={mu.id}
                materialUsage={mu}
                onRegisterCut={(matId) => openMaterialCutModal(matId)}
              />
            ))
          ) : (
            <p className="text-xs text-[#8a9092]">
              Sem consumo de material registado.
            </p>
          )}
        </div>
      </div>

      {/* Modal de registo de corte/consumo de película na Ordem de Trabalho */}
      {showCutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Registar Consumo / Corte na Obra ({workOrder.workOrderNumber})
              </h2>
              <button
                type="button"
                onClick={() => setShowCutModal(false)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleRegisterWorkOrderCut}
              className="flex flex-col gap-3 mt-4 text-xs"
            >
              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Película / Material</span>
                <select
                  value={cutForm.materialId}
                  onChange={(e) =>
                    setCutForm({ ...cutForm, materialId: e.target.value })
                  }
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  required
                >
                  {stockMaterials.length > 0 ? (
                    stockMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand} {m.name} ({m.currentStockMeters} m disp.)
                      </option>
                    ))
                  ) : (
                    usages.map((u) => (
                      <option key={u.id} value={u.materialId}>
                        {u.materialName} ({u.batchNumber})
                      </option>
                    ))
                  )}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Metros Cortados (m)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cutForm.metersCut}
                    onChange={(e) =>
                      setCutForm({ ...cutForm, metersCut: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Metros Orçamentados (m)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cutForm.estimatedMeters}
                    onChange={(e) =>
                      setCutForm({ ...cutForm, estimatedMeters: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Peças Aplicadas / Notas</span>
                <input
                  type="text"
                  value={cutForm.notes}
                  onChange={(e) =>
                    setCutForm({ ...cutForm, notes: e.target.value })
                  }
                  placeholder="Ex: Frente Integral (Capot + Para-choques)"
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                />
              </label>

              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cutForm.saveRemnant}
                  onChange={(e) =>
                    setCutForm({ ...cutForm, saveRemnant: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#d3a548]"
                />
                <span className="font-semibold text-[#f7d46d]">
                  Guardar sobra aproveitável como Retalho
                </span>
              </label>

              {cutForm.saveRemnant && (
                <div className="flex flex-col gap-2 p-3 rounded-md bg-[#15191a] border border-[#d3a548]/30">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Largura (cm)</span>
                      <input
                        type="number"
                        min="5"
                        value={cutForm.remnantWidthCm}
                        onChange={(e) =>
                          setCutForm({
                            ...cutForm,
                            remnantWidthCm: e.target.value,
                          })
                        }
                        className="h-8 px-2 rounded bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Comprimento (cm)</span>
                      <input
                        type="number"
                        min="5"
                        value={cutForm.remnantLengthCm}
                        onChange={(e) =>
                          setCutForm({
                            ...cutForm,
                            remnantLengthCm: e.target.value,
                          })
                        }
                        className="h-8 px-2 rounded bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                  </div>
                  <span className="text-[11px] text-[#a9adae]">
                    Área da sobra:{" "}
                    <strong className="text-[#f7d46d]">
                      {calculateRemnantAreaM2(
                        Number(cutForm.remnantWidthCm),
                        Number(cutForm.remnantLengthCm)
                      )}{" "}
                      m²
                    </strong>
                  </span>
                  <input
                    type="text"
                    value={cutForm.remnantLocation}
                    onChange={(e) =>
                      setCutForm({
                        ...cutForm,
                        remnantLocation: e.target.value,
                      })
                    }
                    placeholder="Estante A · Tubo 2"
                    className="h-8 px-2 rounded bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCutModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  Confirmar Consumo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
