"use client";

import React, { useState } from "react";
import { Plus, Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Appointment, WorkshopBay } from "@/domains/calendar/types";
import {
  assignVehicleToBayAction,
  createBayAction,
  deleteBayAction,
  moveAppointmentAction,
  updateBayAction,
} from "@/app/actions/calendar";

interface WorkshopMapProps {
  date: Date;
  appointments: Appointment[];
  bays: WorkshopBay[];
  technicians: { id: string; name: string }[];
  vehicles: { id: string; label: string; customerId: string | null }[];
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  dragType: WorkshopBay["serviceType"] | null;
  setDragType: (t: WorkshopBay["serviceType"] | null) => void;
  bayModal: "new" | WorkshopBay | null;
  setBayModal: (b: "new" | WorkshopBay | null) => void;
  onOpenEditAppointment: (a: Appointment) => void;
  onRefresh: () => void;
}

const SERVICE_LABEL: Record<WorkshopBay["serviceType"], string> = {
  ppf: "PPF",
  wrap: "Wrap",
  detailing: "Detailing",
  tint: "Tint",
  general: "Geral",
};

const SERVICE_STYLE: Record<WorkshopBay["serviceType"], { floor: string; edge: string; text: string }> = {
  ppf: { floor: "bg-gradient-to-br from-[#2a2312] to-[#171410]", edge: "border-[#d3a548]/70", text: "text-[#f7d46d]" },
  wrap: { floor: "bg-gradient-to-br from-[#1a2140] to-[#10141f]", edge: "border-[#6e93b5]/70", text: "text-[#9fc0dd]" },
  detailing: { floor: "bg-gradient-to-br from-[#16261a] to-[#0e1811]", edge: "border-[#68a46b]/70", text: "text-[#8cc78f]" },
  tint: { floor: "bg-gradient-to-br from-[#1f1a2e] to-[#14111d]", edge: "border-[#a78bda]/70", text: "text-[#c8b5ef]" },
  general: { floor: "bg-gradient-to-br from-[#1a1d1e] to-[#101314]", edge: "border-white/25", text: "text-[#a9adae]" },
};

const SERVICE_TYPES: WorkshopBay["serviceType"][] = ["ppf", "wrap", "detailing", "tint", "general"];

export function WorkshopMap({
  date,
  appointments,
  bays,
  technicians,
  vehicles,
  draggedId,
  setDraggedId,
  dragType,
  setDragType,
  bayModal,
  setBayModal,
  onOpenEditAppointment,
  onRefresh,
}: WorkshopMapProps) {
  const dateStr = date.toISOString().slice(0, 10);
  const dayAppointments = appointments.filter((a) => a.date === dateStr);

  const [bayError, setBayError] = useState<string | null>(null);

  const dropBay = async (bay: WorkshopBay) => {
    // 1. mudar tipo de serviço
    if (dragType) {
      const r = await updateBayAction(bay.id, { serviceType: dragType });
      if (r.ok) onRefresh();
      setDragType(null);
      return;
    }
    // 2. arrastar viatura nova (pool)
    if (draggedId?.startsWith("vehicle:")) {
      const vehicleId = draggedId.replace("vehicle:", "");
      const r = await assignVehicleToBayAction(vehicleId, bay.id, dateStr);
      if (r.ok) onRefresh();
      else setBayError(r.error ?? "Erro ao atribuir.");
      setDraggedId(null);
      return;
    }
    // 3. mover marcação existente entre baías
    if (draggedId) {
      const appt = appointments.find((a) => a.id === draggedId);
      if (appt && appt.startIso && appt.endIso) {
        await moveAppointmentAction(appt.id, appt.startIso, appt.endIso, bay.id);
        onRefresh();
      }
      setDraggedId(null);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Piscina de viaturas disponíveis */}
      <div className="xl:w-64 shrink-0 flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a9092] px-1">
          Viaturas disponíveis
        </span>
        <div className="flex flex-col gap-2 p-3 rounded-md bg-[#0d0f10] border border-white/[0.06] min-h-[200px]">
          {vehicles
            .filter((v) => !dayAppointments.some((a) => a.vehicleId === v.id))
            .map((v) => (
              <div
                key={v.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(`vehicle:${v.id}`);
                  e.dataTransfer.setData("text/plain", v.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggedId(null)}
                className="cursor-grab active:cursor-grabbing p-2.5 rounded-sm bg-[#15191a] border border-white/[0.1] hover:border-[#d3a548]/60 transition-all"
              >
                <span className="text-xs font-bold text-[#f1ede5] block">{v.label}</span>
              </div>
            ))}
          {vehicles.filter((v) => !dayAppointments.some((a) => a.vehicleId === v.id)).length === 0 && (
            <span className="text-[11px] text-[#8a9092] p-2">
              Todas as viaturas têm baia atribuída neste dia.
            </span>
          )}
        </div>

        {/* Palette de tipos de serviço */}
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a9092] px-1 mt-2">
          Tipos de serviço (arrasta para a baia)
        </span>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-[#0d0f10] border border-white/[0.06]">
          {SERVICE_TYPES.map((t) => (
            <div
              key={t}
              draggable
              onDragStart={(e) => {
                setDragType(t);
                e.dataTransfer.setData("text/plain", `type:${t}`);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragType(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-grab active:cursor-grabbing ${SERVICE_STYLE[t].edge} ${SERVICE_STYLE[t].text} bg-[#15191a]`}
            >
              {SERVICE_LABEL[t]}
            </div>
          ))}
        </div>

        <button
          onClick={() => setBayModal("new")}
          className="flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-white/[0.15] text-xs font-bold text-[#a9adae] hover:text-[#f7d46d] hover:border-[#d3a548]/60 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Baia</span>
        </button>

        {bayError && <p className="text-[11px] font-semibold text-[#f05a50] px-1">{bayError}</p>}
      </div>

      {/* Piso 3D visto de cima */}
      <div
        className="flex-1 rounded-[18px] border border-white/[0.08] bg-gradient-to-b from-[#0a0c0d] to-[#050606] p-6 overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a9092]">
            Planta da Oficina — vista de cima
          </span>
          <span className="text-[11px] font-mono text-[#a9adae]">{dateStr}</span>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-[16px] bg-[#0d0f10] border border-white/[0.05]"
          style={{
            transform: "rotateX(48deg) scale(0.92)",
            transformStyle: "preserve-3d",
            boxShadow: "0 60px 80px rgba(0,0,0,0.5)",
          }}
        >
          {bays.map((bay) => {
            const style = SERVICE_STYLE[bay.serviceType] ?? SERVICE_STYLE.general;
            const bayAppointments = dayAppointments.filter((a) => a.bayId === bay.id);
            const isDropTarget = draggedId !== null;
            return (
              <div
                key={bay.id}
                onDragEnter={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void dropBay(bay);
                }}
                className={`relative min-h-[190px] p-3 rounded-md border-2 ${style.floor} ${style.edge} transition-all ${
                  isDropTarget ? "ring-2 ring-[#d3a548]/60 brightness-125" : ""
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* paredes 3D ilusórias */}
                <div
                  className="absolute inset-x-0 -top-3 h-3 rounded-t-[14px] opacity-70"
                  style={{ background: "linear-gradient(to top, rgba(255,255,255,0.06), transparent)", transform: "translateZ(1px)" }}
                />

                {/* Placa da baia (em pé, legível) */}
                <div
                  className="absolute -top-2 left-2 right-2 flex items-center justify-between"
                  style={{ transform: "rotateX(-48deg)", transformOrigin: "bottom center" }}
                >
                  <span className={`text-[11px] font-black uppercase tracking-wider truncate ${style.text}`}>
                    {bay.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBayModal(bay);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 cursor-pointer shrink-0"
                    aria-label={`Editar ${bay.name}`}
                  >
                    <Settings className="h-3.5 w-3.5 text-[#a9adae]" />
                  </button>
                </div>

                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${style.edge} border ${style.text}`}
                  style={{ transform: "rotateX(-48deg)", transformOrigin: "top center" }}
                >
                  {SERVICE_LABEL[bay.serviceType]}
                </span>

                {/* Viaturas na baia (em pé) */}
                <div className="flex flex-col gap-2 mt-2">
                  {bayAppointments.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedId(a.id);
                        e.dataTransfer.setData("text/plain", a.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDraggedId(null)}
                      onClick={() => onOpenEditAppointment(a)}
                      className="cursor-grab active:cursor-grabbing px-2.5 py-2 rounded-sm bg-[#1b2021] border border-white/[0.15] shadow-lg hover:border-[#d3a548]/60 transition-all"
                      style={{
                        transform: "rotateX(-48deg) translateZ(6px)",
                        transformOrigin: "bottom center",
                      }}
                    >
                      <span className="text-[11px] font-black font-mono text-[#f7d46d] block leading-tight">
                        {a.vehiclePlate}
                      </span>
                      <span className="text-[10px] text-[#a9adae] block truncate leading-tight">
                        {a.vehicleModel}
                      </span>
                      <span className="text-[10px] text-[#8a9092] block truncate leading-tight">
                        {a.startTime} · {a.customerName}
                      </span>
                    </div>
                  ))}
                  {bayAppointments.length === 0 && (
                    <div className="flex items-center justify-center h-16 rounded-sm border border-dashed border-white/[0.12] text-[10px] text-[#5a6062]">
                      Arrasta uma viatura para aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Tile adicionar baia */}
          <button
            onClick={() => setBayModal("new")}
            className="min-h-[190px] rounded-md border-2 border-dashed border-white/[0.12] flex flex-col items-center justify-center gap-2 text-[#5a6062] hover:text-[#f7d46d] hover:border-[#d3a548]/60 transition-all cursor-pointer"
          >
            <Plus className="h-6 w-6" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Nova Baia</span>
          </button>
        </div>
      </div>

      {/* Modal de baia (criar/editar) */}
      {bayModal && (
        <BayModal
          bay={bayModal === "new" ? null : bayModal}
          technicians={technicians}
          onClose={() => {
            setBayModal(null);
            setBayError(null);
          }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function BayModal({
  bay,
  technicians,
  onClose,
  onRefresh,
}: {
  bay: WorkshopBay | null;
  technicians: { id: string; name: string }[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(bay?.name ?? "");
  const [serviceType, setServiceType] = useState<WorkshopBay["serviceType"]>(
    bay?.serviceType ?? "general"
  );
  const [technicianId, setTechnicianId] = useState(
    technicians.find((t) => t.name === bay?.defaultTechnicianName)?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] w-full";

  const handleSave = async () => {
    if (!name.trim()) {
      setError("O nome da baia é obrigatório.");
      return;
    }
    setSaving(true);
    if (bay) {
      const r = await updateBayAction(bay.id, {
        name: name.trim(),
        serviceType,
        technicianId: technicianId || undefined,
      });
      if (!r.ok) {
        setError(r.error ?? "Erro ao guardar.");
        setSaving(false);
        return;
      }
    } else {
      const code = `B-${Math.floor(Math.random() * 90 + 10)}`;
      const r = await createBayAction({
        name: name.trim(),
        code,
        serviceType,
        technicianId: technicianId || undefined,
      });
      if (!r.ok) {
        setError(r.error ?? "Erro ao criar a baia.");
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onRefresh();
    onClose();
  };

  const handleDelete = async () => {
    if (!bay) return;
    setSaving(true);
    const r = await deleteBayAction(bay.id);
    setSaving(false);
    if (!r.ok) {
      setError(r.error ?? "Erro ao eliminar.");
      return;
    }
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold">{bay ? "Editar Baia" : "Nova Baia"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer" aria-label="Fechar">
            <X className="h-5 w-5 text-[#a9adae]" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 mt-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Nome *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="ex: Baia 4 — PPF Frontal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Tipo de serviço
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as WorkshopBay["serviceType"])}
              className={inputClass + " cursor-pointer"}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SERVICE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Técnico predefinido
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className={inputClass + " cursor-pointer"}
            >
              <option value="">Sem técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-xs font-semibold text-[#f05a50]">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          {bay ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={saving}
              className="border-[#f05a50]/40 text-[#f05a50] hover:bg-[#f05a50]/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar</span>
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              <span>Fechar</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              <span>{bay ? "Guardar" : "Criar Baia"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
