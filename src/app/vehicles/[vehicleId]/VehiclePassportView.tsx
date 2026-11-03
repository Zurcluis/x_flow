"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  History,
  StickyNote,
  UserCheck,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehiclePassportHero } from "@/components/xflow/vehicles/VehiclePassportHero";
import { VehicleTimeline } from "@/components/xflow/vehicles/VehicleTimeline";
import {
  VehicleFormModal,
  VehicleSaveResult,
} from "@/components/xflow/vehicles/VehicleFormModal";
import {
  addVehicleNoteAction,
  deleteVehicleNoteAction,
  updateVehicleAction,
} from "@/app/actions/vehicles";
import { formatVehicleDateKey } from "@/domains/vehicles/presentation";
import { formatCheckinDate } from "@/domains/checkins/presentation";
import {
  ItemType,
  Vehicle,
  VehicleNote,
  VehicleTimelineEvent,
} from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";

const NOTE_CATEGORY_OPTIONS: Array<{
  value: VehicleNote["category"];
  label: string;
  badgeLabel: string;
}> = [
  {
    value: "technical",
    label: "Diagnóstico Técnico (Verniz, Desmontagem, Regime de Uso)",
    badgeLabel: "Diagnóstico Técnico",
  },
  {
    value: "bodywork",
    label: "Estado da Carroçaria / Repinturas / Gravilha",
    badgeLabel: "Inspeção de Pintura / Carroçaria",
  },
  {
    value: "general",
    label: "Curadoria de Amostras (3 Opções Físicas / Simulador)",
    badgeLabel: "Curadoria de Amostras & Notas",
  },
];

function noteTimelineTitle(category: VehicleNote["category"]): string {
  if (category === "technical") return "Diagnóstico Técnico";
  if (category === "bodywork") return "Inspeção de Pintura / Carroçaria";
  return "Curadoria de Amostras & Notas";
}

interface VehiclePassportViewProps {
  vehicle: Vehicle;
  customers?: Customer[];
}

export function VehiclePassportView({
  vehicle: initialVehicle,
  customers = [],
}: VehiclePassportViewProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [lastSynced, setLastSynced] = useState<Vehicle>(initialVehicle);
  const [activeTab, setActiveTab] = useState<"timeline" | "owners" | "notes">("timeline");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [noteCategory, setNoteCategory] = useState<VehicleNote["category"]>("technical");
  const [noteContent, setNoteContent] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  if (lastSynced !== initialVehicle) {
    setLastSynced(initialVehicle);
    setVehicle(initialVehicle);
  }

  const handleApplyTemplate = (
    category: VehicleNote["category"],
    templateText: string
  ) => {
    setNoteCategory(category);
    setNoteError(null);
    setNoteContent((prev) =>
      prev.trim().length > 0 ? `${prev.trim()}\n\n${templateText}` : templateText
    );
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteContent.trim();
    if (!trimmed) {
      setNoteError("Escreve o diagnóstico ou curadoria de amostras antes de registar.");
      return;
    }
    setIsSavingNote(true);
    setNoteError(null);
    const result = await addVehicleNoteAction(vehicle.id, {
      category: noteCategory,
      content: trimmed,
    });
    setIsSavingNote(false);
    if (!result.ok) {
      setNoteError(result.error);
      return;
    }

    const newNote = result.note;
    const timelineEvent: VehicleTimelineEvent = {
      id: `note-${newNote.id}`,
      vehicleId: vehicle.id,
      type: "note_added",
      title: noteTimelineTitle(newNote.category),
      description: newNote.content,
      date: newNote.createdAt,
      authorName: newNote.authorName,
      badgeText: "Nota",
    };

    setVehicle((prev) => ({
      ...prev,
      technicalNotes: [newNote, ...(prev.technicalNotes ?? [])],
      timeline: [timelineEvent, ...(prev.timeline ?? [])].sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
    }));
    setNoteContent("");
    router.refresh();
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    setNoteError(null);
    const result = await deleteVehicleNoteAction(vehicle.id, noteId);
    setDeletingNoteId(null);
    setConfirmDeleteNoteId(null);
    if (!result.ok) {
      setNoteError(result.error);
      return;
    }

    setVehicle((prev) => ({
      ...prev,
      technicalNotes: (prev.technicalNotes ?? []).filter((n) => n.id !== noteId),
      timeline: (prev.timeline ?? []).filter((ev) => ev.id !== `note-${noteId}`),
    }));
    router.refresh();
  };

  const handleUpdateVehicle = async (
    updatedFields: Partial<Vehicle> & { customerId?: string; itemType?: ItemType }
  ): Promise<VehicleSaveResult> => {
    const result = await updateVehicleAction(vehicle.id, updatedFields);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setVehicle((prev) => ({
      ...prev,
      ...result.vehicle,
      timeline: result.vehicle.timeline ?? prev.timeline,
      ownerHistory: result.vehicle.ownerHistory ?? prev.ownerHistory,
      technicalNotes: result.vehicle.technicalNotes ?? prev.technicalNotes,
    }));
    router.refresh();
    return { ok: true };
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Viaturas</span>
        </Link>
      </div>

      <VehiclePassportHero vehicle={vehicle} onEdit={() => setIsEditOpen(true)} />

      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setActiveTab("timeline")}
          aria-pressed={activeTab === "timeline"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "timeline"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Passaporte & Timeline Técnica ({vehicle.timeline?.length ?? 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("owners")}
          aria-pressed={activeTab === "owners"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "owners"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Histórico de Proprietários ({vehicle.ownerHistory?.length ?? 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          aria-pressed={activeTab === "notes"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "notes"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <StickyNote className="h-4 w-4" />
          <span>Notas Técnicas da Oficina</span>
        </button>
      </div>

      {activeTab === "timeline" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#f1ede5]">
              Histórico Técnico Rastreável
            </h3>
            <span className="text-xs text-[#8a9092]">
              Check-ins, serviços concluídos, controlos de qualidade e garantias
            </span>
          </div>

          <VehicleTimeline events={vehicle.timeline} vehicleId={vehicle.id} />
        </div>
      )}

      {activeTab === "owners" && (
        <div className="flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">
                Rastreabilidade de Posse da Viatura
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-[#a9adae]">
              A viatura preserva o histórico técnico de intervenções, materiais e garantias mesmo
              quando muda de proprietário. Os dados pessoais de proprietários anteriores permanecem
              protegidos.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              {vehicle.ownerHistory && vehicle.ownerHistory.length > 0 ? (
                vehicle.ownerHistory.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3.5 rounded-md border ${
                      link.isCurrent
                        ? "bg-[#1f1b14] border-[#d3a548]/40 text-[#f7d46d]"
                        : "bg-[#15191a] border-white/[0.06] text-[#a9adae]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <Link
                          href={`/customers/${link.customerId}`}
                          className="font-semibold text-sm hover:underline text-[#f1ede5]"
                        >
                          {link.customerName}
                        </Link>
                        <span className="text-[11px] text-[#8a9092]">
                          Relação:{" "}
                          {link.relationshipType === "owner"
                            ? "Proprietário"
                            : link.relationshipType === "fleet_manager"
                            ? "Gestor de Frota"
                            : "Condutor"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="tabular-nums">
                        {formatVehicleDateKey(link.startedAt)}{" "}
                        {link.endedAt
                          ? `até ${formatVehicleDateKey(link.endedAt)}`
                          : "(Atual)"}
                      </span>
                      {link.isCurrent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d3a548]/20 text-[#f7d46d] border border-[#d3a548]/40">
                          Atual
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-md bg-[#15191a] text-xs text-[#f1ede5]">
                  Sem histórico de proprietários registado.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-5 p-5 flex flex-col gap-4 bg-[#15191a] border-[#d3a548]/25">
              <CardHeader className="p-0 flex flex-col gap-1">
                <CardTitle className="text-sm text-[#f7d46d] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#d3a548]" />
                  <span>Diagnóstico Técnico & Amostras Selecionadas</span>
                </CardTitle>
                <p className="text-xs text-[#a9adae]">
                  Regista a avaliação física da viatura (Passo 2) e a curadoria de 3 amostras /
                  simulador (Passo 3) diretamente no passaporte técnico.
                </p>
              </CardHeader>

              <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="vehicle-note-category"
                    className="text-xs font-semibold text-[#f1ede5]"
                  >
                    Categoria do Registo
                  </label>
                  <select
                    id="vehicle-note-category"
                    value={noteCategory}
                    onChange={(e) =>
                      setNoteCategory(e.target.value as VehicleNote["category"])
                    }
                    className="h-9 rounded-sm bg-[#101314] border border-white/15 px-3 text-xs text-[#f1ede5] focus:outline-none focus:border-[#d3a548]"
                  >
                    {NOTE_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9092]">
                    Atalhos Rápidos (Templates Passos 2 e 3)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyTemplate(
                          "technical",
                          "• Verniz / Pintura de origem: \n• Necessidade de desmontagem: \n• Regime de uso (diário / trackday / coleção): \n• Recomendação técnica: "
                        )
                      }
                      className="text-[11px] px-2.5 py-1 rounded-sm bg-[#101314] border border-[#d3a548]/30 text-[#f7d46d] hover:border-[#d3a548] hover:bg-[#d3a548]/10 transition-colors cursor-pointer"
                    >
                      + Template Diagnóstico (Passo 2)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyTemplate(
                          "general",
                          "• Amostra 1 (Recomendada): \n• Amostra 2 (Alternativa): \n• Amostra 3 (Comparativa): \n• Validação em simulador / preferência do cliente: "
                        )
                      }
                      className="text-[11px] px-2.5 py-1 rounded-sm bg-[#101314] border border-[#d3a548]/30 text-[#f7d46d] hover:border-[#d3a548] hover:bg-[#d3a548]/10 transition-colors cursor-pointer"
                    >
                      + Template 3 Amostras (Passo 3)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyTemplate(
                          "bodywork",
                          "• Frente / impacto de gravilha: \n• Painéis com repintura prévia: \n• Arestas e borrachas críticas: "
                        )
                      }
                      className="text-[11px] px-2.5 py-1 rounded-sm bg-[#101314] border border-white/10 text-[#a9adae] hover:text-[#f1ede5] hover:border-white/25 transition-colors cursor-pointer"
                    >
                      + Template Carroçaria / Gravilha
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="vehicle-note-content"
                    className="text-xs font-semibold text-[#f1ede5]"
                  >
                    Detalhe Técnico / Amostras Apresentadas
                  </label>
                  <textarea
                    id="vehicle-note-content"
                    rows={5}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Descreve o estado do verniz, desmontagens necessárias ou as 3 amostras físicas apresentadas ao cliente..."
                    className="w-full rounded-sm bg-[#101314] border border-white/15 p-3 text-xs text-[#f1ede5] placeholder:text-[#8a9092] focus:outline-none focus:border-[#d3a548] leading-relaxed"
                  />
                </div>

                {noteError && (
                  <p className="text-xs text-[#f05a50] bg-[#f05a50]/10 border border-[#f05a50]/30 rounded-sm px-3 py-2">
                    {noteError}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingNote}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {isSavingNote ? "A registar..." : "Registar no Passaporte"}
                    </span>
                  </Button>
                </div>
              </form>
            </Card>

            <div className="lg:col-span-7 flex flex-col gap-4">
              <Card className="p-5 flex flex-col gap-3">
                <CardHeader className="p-0">
                  <CardTitle className="text-sm">Observações Gerais de Cadastro</CardTitle>
                </CardHeader>
                <p className="text-xs text-[#f1ede5] leading-relaxed">
                  {vehicle.notes || "Sem notas gerais registadas na ficha da viatura."}
                </p>
              </Card>

              <Card className="p-5 flex flex-col gap-3 bg-[#15191a]">
                <CardHeader className="p-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-[#d3a548]">
                    Registos de Diagnóstico & Curadoria ({vehicle.technicalNotes?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                {vehicle.technicalNotes && vehicle.technicalNotes.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {vehicle.technicalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex flex-col gap-2 rounded-md border border-white/[0.06] bg-[#101314] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#d3a548]">
                            {note.category === "technical"
                              ? "Diagnóstico Técnico (Passo 2)"
                              : note.category === "bodywork"
                              ? "Inspeção de Pintura / Carroçaria"
                              : "Curadoria de Amostras (Passo 3)"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#8a9092] tabular-nums">
                              {formatCheckinDate(note.createdAt)}
                            </span>
                            {confirmDeleteNoteId === note.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={deletingNoteId === note.id}
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#f05a50]/20 text-[#f05a50] border border-[#f05a50]/40 hover:bg-[#f05a50]/30 cursor-pointer"
                                >
                                  {deletingNoteId === note.id ? "A apagar..." : "Confirmar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNoteId(null)}
                                  className="text-[11px] px-2 py-0.5 rounded-sm text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteNoteId(note.id)}
                                title="Eliminar nota"
                                aria-label="Eliminar nota"
                                className="inline-flex items-center gap-1 text-[11px] text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#f1ede5] leading-relaxed whitespace-pre-line">
                          {note.content}
                        </p>
                        <span className="text-[11px] text-[#8a9092]">
                          Registado por: {note.authorName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8a9092] leading-relaxed">
                    Sem notas técnicas ou curadoria de amostras registadas para esta viatura.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      <VehicleFormModal
        key={isEditOpen ? `edit-open-${vehicle.updatedAt}` : "edit-closed"}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateVehicle}
        customers={customers}
        initialData={vehicle}
      />
    </div>
  );
}
