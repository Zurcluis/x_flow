"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  CalendarDays,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Appointment, AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";
import { WorkshopMap } from "@/components/xflow/calendar/WorkshopMap";
import {
  cancelAppointmentAction,
  forceSaveAppointmentAction,
  moveAppointmentAction,
  saveAppointmentAction,
} from "@/app/actions/calendar";

type ViewMode = "month" | "week" | "day" | "agenda" | "mapa";

interface EngineProps {
  initialAppointments: Appointment[];
  bays: WorkshopBay[];
  technicians: { id: string; name: string }[];
  vehicles: { id: string; label: string; customerId: string | null }[];
}

const DAY_START_H = 7;
const DAY_END_H = 20;
const PX_PER_HOUR = 48;

const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // segunda = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function statusColor(status: AppointmentStatus): { bg: string; border: string; text: string } {
  switch (status) {
    case "in_progress":
      return { bg: "bg-[#d3a548]/25", border: "border-[#d3a548]", text: "text-[#f7d46d]" };
    case "confirmed":
      return { bg: "bg-[#6e93b5]/20", border: "border-[#6e93b5]", text: "text-[#9fc0dd]" };
    case "completed":
      return { bg: "bg-[#68a46b]/20", border: "border-[#68a46b]", text: "text-[#8cc78f]" };
    case "cancelled":
      return { bg: "bg-white/[0.03]", border: "border-white/[0.08]", text: "text-[#8a9092]" };
    default:
      return { bg: "bg-white/[0.05]", border: "border-white/20", text: "text-[#f1ede5]" };
  }
}

interface SlotInfo {
  date: Date;
  hour: number;
  minutes: number;
  bayId?: string;
}

interface ModalState {
  mode: "create" | "edit";
  appointment?: Appointment;
  slot?: SlotInfo;
}

export function CalendarEngine({
  initialAppointments,
  bays,
  technicians,
  vehicles,
}: EngineProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<WorkshopBay["serviceType"] | null>(null);
  const [bayModal, setBayModal] = useState<"new" | WorkshopBay | null>(null);

  // re-sincroniza quando o servidor envia dados novos (router.refresh)
  const [lastSynced, setLastSynced] = useState(initialAppointments);
  if (lastSynced !== initialAppointments) {
    setLastSynced(initialAppointments);
    setAppointments(initialAppointments);
  }

  const visible = useMemo(
    () => appointments.filter((a) => a.status !== "cancelled"),
    [appointments]
  );

  // ── navegação ──────────────────────────────────────────────────────────────
  const move = (dir: number) => {
    if (view === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    } else if (view === "week") {
      setCursor(addDays(cursor, dir * 7));
    } else if (view === "day" || view === "mapa") {
      setCursor(addDays(cursor, dir));
    } else {
      setCursor(addDays(cursor, dir * 30));
    }
  };

  const periodLabel = useMemo(() => {
    if (view === "month") {
      return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (view === "week") {
      const s = startOfWeek(cursor);
      const e = addDays(s, 6);
      return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} — ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
    }
    if (view === "day" || view === "mapa") {
      return `${WEEKDAYS_SHORT[(cursor.getDay() + 6) % 7]}, ${cursor.getDate()} de ${MONTHS[cursor.getMonth()]}`;
    }
    return "Próximos 30 dias";
  }, [view, cursor]);

  const openCreate = (slot?: SlotInfo) => {
    setModal({ mode: "create", slot });
  };

  const openEdit = (appointment: Appointment) => {
    setModal({ mode: "edit", appointment });
  };

  const handleMove = async (
    appointmentId: string,
    newStart: Date,
    bayId?: string
  ) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;
    const duration = appt.startIso
      ? new Date(appt.endIso!).getTime() - new Date(appt.startIso!).getTime()
      : (appt.estimatedHours || 1) * 3600000;
    const newEnd = new Date(newStart.getTime() + duration);

    // otimista
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              date: newStart.toISOString().slice(0, 10),
              startTime: newStart.toTimeString().slice(0, 5),
              endTime: newEnd.toTimeString().slice(0, 5),
              startIso: newStart.toISOString(),
              endIso: newEnd.toISOString(),
              bayId: bayId ?? a.bayId,
            }
          : a
      )
    );

    const result = await moveAppointmentAction(
      appointmentId,
      newStart.toISOString(),
      newEnd.toISOString(),
      bayId
    );
    if (result.ok) router.refresh();
  };

  // ── intervalo de dias do currently view ────────────────────────────────────
  const weekDays = useMemo(() => {
    const s = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const s = addDays(first, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(s, i));
  }, [cursor]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = DAY_START_H; h < DAY_END_H; h++) list.push(h);
    return list;
  }, []);

  const appointmentsForDay = (day: Date) =>
    visible.filter((a) => a.date === fmtDay(day));

  const moveByDays = (appt: Appointment, targetDay: Date) => {
    const keep = appt.startIso ? new Date(appt.startIso) : new Date(`${appt.date}T09:00:00`);
    const newStart = new Date(targetDay);
    newStart.setHours(keep.getHours(), keep.getMinutes(), 0, 0);
    void handleMove(appt.id, newStart);
  };

  // ═ padded slot component helpers ═══════════════════════════════════════════
  const timeSlots: Array<{ hour: number; minutes: number }> = [];
  for (let hh = DAY_START_H; hh < DAY_END_H; hh++) {
    timeSlots.push({ hour: hh, minutes: 0 });
    timeSlots.push({ hour: hh, minutes: 30 });
  }

  const EventChip = ({ a, compact }: { a: Appointment; compact?: boolean }) => {
    const color = statusColor(a.status);
    return (
      <div
        draggable
        onDragStart={(e) => {
          setDraggedId(a.id);
          e.dataTransfer.setData("text/plain", a.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDraggedId(null)}
        onClick={(e) => {
          e.stopPropagation();
          openEdit(a);
        }}
        className={`cursor-pointer px-1.5 py-0.5 rounded-[6px] border ${color.bg} ${color.border} ${color.text} hover:brightness-125 transition-all text-[11px] leading-tight truncate ${a.status === "cancelled" ? "line-through" : ""}`}
        title={`${a.startTime} · ${a.vehicleModel} (${a.vehiclePlate}) · ${a.customerName} · ${a.bayName}`}
      >
        {!compact && <span className="font-mono font-bold mr-1">{a.startTime}</span>}
        {a.vehiclePlate} · {a.customerName}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-[#15191a]" onClick={() => setCursor(new Date())}>
            <span>Hoje</span>
          </Button>
          <button
            onClick={() => move(-1)}
            className="p-2 rounded-[8px] bg-[#15191a] text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => move(1)}
            className="p-2 rounded-[8px] bg-[#15191a] text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Seguinte"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm text-[#f1ede5] ml-1">{periodLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#101314] border border-white/[0.06] select-none">
          {(
            [
              ["month", "Mês"],
              ["week", "Semana"],
              ["day", "Dia"],
              ["mapa", "Mapa 3D"],
              ["agenda", "Agenda"],
            ] as Array<[ViewMode, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                view === id
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => openCreate({ date: cursor, hour: 9, minutes: 0 })}
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-sm text-xs font-bold bg-[#d3a548] text-[#050606] hover:bg-[#e7c77c] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Criar</span>
          </button>
        </div>
      </div>

      {/* ═══ VISTA MENSAL ═══ */}
      {view === "month" && (
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-7 bg-[#101314] border-b border-white/[0.06]">
            {WEEKDAYS_SHORT.map((d) => (
              <div key={d} className="p-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = fmtDay(day) === fmtDay(new Date());
              const dayAppointments = appointmentsForDay(day);
              return (
                <div
                  key={i}
                  onClick={() => openCreate({ date: day, hour: 9, minutes: 0 })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedId) {
                      const appt = appointments.find((a) => a.id === draggedId);
                      if (appt) moveByDays(appt, day);
                      setDraggedId(null);
                    }
                  }}
                  className={`min-h-[110px] p-1 border-b border-r border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors ${
                    !inMonth ? "opacity-40" : ""
                  } ${isToday ? "bg-[#1f1b14]/40" : ""}`}
                >
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isToday ? "bg-[#d3a548] text-[#050606]" : "text-[#a9adae]"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayAppointments.slice(0, 3).map((a) => (
                      <EventChip key={a.id} a={a} compact />
                    ))}
                    {dayAppointments.length > 3 && (
                      <span className="text-[10px] text-[#8a9092] px-1">
                        +{dayAppointments.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ VISTAS SEMANA / DIA (grelha temporal) ═══ */}
      {(view === "week" || view === "day") && (
        <div className="rounded-lg border border-white/[0.06] overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Cabeçalho dos dias */}
            <div
              className="grid bg-[#101314] border-b border-white/[0.06]"
              style={{ gridTemplateColumns: `60px repeat(${view === "week" ? 7 : bays.length}, 1fr)` }}
            >
              <div />
              {(view === "week"
                ? weekDays
                : bays.map(() => new Date(cursor))
              ).map((day, i) => (
                <div key={i} className="p-2 text-center border-l border-white/[0.04]">
                  {view === "week" ? (
                    <>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
                        {WEEKDAYS_SHORT[i]}
                      </div>
                      <div
                        className={`text-sm font-mono font-bold ${
                          fmtDay(day) === fmtDay(new Date()) ? "text-[#f7d46d]" : "text-[#f1ede5]"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-[#f1ede5]">{bays[i]?.name ?? "—"}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Grelha temporal */}
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `60px repeat(${view === "week" ? 7 : bays.length}, 1fr)`,
              }}
            >
              {/* Coluna de horas */}
              <div className="border-r border-white/[0.04]">
                {hours.map((h) => (
                  <div key={h} className="relative" style={{ height: PX_PER_HOUR }}>
                    <span className="absolute -top-1.5 right-1 text-[10px] font-mono text-[#8a9092]">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {(view === "week" ? weekDays : bays).map((col, colIdx) => {
                const day = view === "week" ? (col as Date) : cursor;
                const bay = view === "day" ? (col as WorkshopBay) : undefined;
                const dayAppointments = view === "week" ? appointmentsForDay(day) : visible.filter((a) => a.date === fmtDay(cursor) && a.bayId === bay?.id);

                return (
                  <div
                    key={colIdx}
                    className="relative border-r border-white/[0.04]"
                  onDragEnter={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedId) {
                        const appt = appointments.find((a) => a.id === draggedId);
                        if (appt) {
                          const keep = appt.startIso
                            ? new Date(appt.startIso)
                            : new Date(`${appt.date}T09:00:00`);
                          const newStart = new Date(day);
                          newStart.setHours(keep.getHours(), keep.getMinutes(), 0, 0);
                          void handleMove(appt.id, newStart, view === "day" ? bay?.id : undefined);
                        }
                        setDraggedId(null);
                      }
                    }}
                  >
                    {/* slots clicáveis */}
                    {timeSlots.map(({ hour, minutes }) => (
                      <div
                        key={`${hour}-${minutes}`}
                        onClick={() =>
                          openCreate({
                            date: day,
                            hour,
                            minutes,
                            bayId: view === "day" ? bay?.id : undefined,
                          })
                        }
                        className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer"
                        style={{ height: PX_PER_HOUR / 2 }}
                      />
                    ))}

                    {/* eventos posicionados */}
                    {dayAppointments.map((a) => {
                      const start = a.startIso
                        ? new Date(a.startIso)
                        : new Date(`${a.date}T${a.startTime}:00`);
                      const end = a.endIso ? new Date(a.endIso) : new Date(`${a.date}T${a.endTime}:00`);
                      const startMin = start.getHours() * 60 + start.getMinutes();
                      const endMin = end.getHours() * 60 + end.getMinutes();
                      const offset = startMin - DAY_START_H * 60;
                      const height = Math.max(endMin - startMin, 30);
                      const color = statusColor(a.status);
                      return (
                        <div
                          key={a.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedId(a.id);
                            e.dataTransfer.setData("text/plain", a.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => setDraggedId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(a);
                          }}
                          className={`absolute left-0.5 right-0.5 rounded-[8px] border px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-125 transition-all ${color.bg} ${color.border} ${color.text}`}
                          style={{ top: (offset / 60) * PX_PER_HOUR, height, minHeight: 24 }}
                          title={`${a.startTime}–${a.endTime} · ${a.vehicleModel} (${a.vehiclePlate}) · ${a.customerName}`}
                        >
                          <span className="text-[10px] font-mono font-bold block leading-tight">
                            {a.startTime}–{a.endTime}
                          </span>
                          <span className="text-[11px] font-semibold block truncate leading-tight">
                            {a.vehicleModel}
                          </span>
                          <span className="text-[10px] block truncate leading-tight opacity-80">
                            {a.customerName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ VISTA MAPA 3D DA OFICINA ═══ */}
      {view === "mapa" && (
        <WorkshopMap
          date={cursor}
          appointments={appointments.filter((a) => a.status !== "cancelled")}
          bays={bays}
          technicians={technicians}
          vehicles={vehicles}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          dragType={dragType}
          setDragType={setDragType}
          bayModal={bayModal}
          setBayModal={setBayModal}
          onOpenEditAppointment={openEdit}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* ═══ VISTA AGENDA ═══ */}
      {view === "agenda" && (
        <div className="flex flex-col gap-3">
          {(() => {
            const upcoming = visible
              .filter((a) => a.date >= fmtDay(new Date()))
              .sort((a, b) => (a.startIso ?? a.date).localeCompare(b.startIso ?? b.date));
            if (upcoming.length === 0) {
              return (
                <div className="p-10 rounded-lg bg-[#101314] border border-white/[0.06] text-center text-xs text-[#8a9092]">
                  Sem marcações futuras. Usa o botão Criar para agendar.
                </div>
              );
            }
            let lastDate = "";
            return upcoming.map((a) => {
              const showDate = a.date !== lastDate;
              lastDate = a.date;
              return (
                <React.Fragment key={a.id}>
                  {showDate && (
                    <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548] mt-2">
                      {WEEKDAYS_SHORT[(new Date(a.date).getDay() + 6) % 7]}, {a.date}
                    </span>
                  )}
                  <button
                    onClick={() => openEdit(a)}
                    className="flex items-center gap-3 p-3.5 rounded-[12px] bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all cursor-pointer text-left"
                  >
                    <span className="font-mono text-xs font-bold text-[#f7d46d]">{a.startTime}</span>
                    <span className="text-sm font-semibold text-[#f1ede5]">{a.vehicleModel}</span>
                    <span className="text-xs text-[#a9adae] truncate">{a.customerName}</span>
                    <Badge variant="outline" className="ml-auto text-[11px] shrink-0">
                      {a.bayName}
                    </Badge>
                  </button>
                </React.Fragment>
              );
            });
          })()}
        </div>
      )}

      {/* Modal de criação/edição */}
      {modal && (
        <AppointmentModal
          mode={modal.mode}
          appointment={modal.appointment}
          slot={modal.slot}
          bays={bays}
          technicians={technicians}
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSaved={(deleted) => {
            setModal(null);
            if (deleted) {
              setAppointments((prev) => prev.filter((a) => a.id !== deleted));
            }
            router.refresh();
          }}
        />
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-[11px] text-[#8a9092] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d3a548]/40 border border-[#d3a548]" /> Em curso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10 border border-white/20" /> Agendada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6e93b5]/30 border border-[#6e93b5]" /> Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#68a46b]/30 border border-[#68a46b]" /> Concluída
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" /> Clica num espaço vazio para criar · arrasta para mover
        </span>
        <Link href="/time-book" className="flex items-center gap-1.5 hover:text-[#f1ede5] ml-auto">
          <List className="h-3 w-3" /> Ver agenda em lista
        </Link>
      </div>
    </div>
  );
}

// ═══ Modal de marcação ═══════════════════════════════════════════════════════
interface ModalProps {
  mode: "create" | "edit";
  appointment?: Appointment;
  slot?: SlotInfo;
  bays: WorkshopBay[];
  technicians: { id: string; name: string }[];
  vehicles: { id: string; label: string; customerId: string | null }[];
  onClose: () => void;
  onSaved: (deletedId?: string) => void;
}

function AppointmentModal({
  mode,
  appointment,
  slot,
  bays,
  technicians,
  vehicles,
  onClose,
  onSaved,
}: ModalProps) {
  const initVehicle = appointment?.vehicleId ?? slot?.bayId ?? vehicles[0]?.id ?? "";
  const initDate = appointment?.date ?? (slot ? fmtDay(slot.date) : fmtDay(new Date()));
  const initHour = appointment?.startTime ?? (slot ? `${String(slot.hour).padStart(2, "0")}:${String(slot.minutes ?? 0).padStart(2, "0")}` : "09:00");
  const initBay = appointment?.bayId ?? slot?.bayId ?? bays[0]?.id ?? "";

  const [vehicleId, setVehicleId] = useState(initVehicle);
  const [customerId, setCustomerId] = useState(
    appointment?.customerId ?? vehicles.find((v) => v.id === initVehicle)?.customerId ?? ""
  );
  const [bayId, setBayId] = useState(initBay);
  const [technicianId, setTechnicianId] = useState(appointment ? "" : technicians[0]?.id ?? "");
  const [date, setDate] = useState(initDate);
  const [startTime, setStartTime] = useState(initHour);
  const [estimatedHours, setEstimatedHours] = useState(appointment?.estimatedHours?.toString() ?? "2");
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? "scheduled");
  const [notes, setNotes] = useState(appointment?.serviceTitle ?? appointment?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  const buildInput = () => {
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(start.getTime() + (parseFloat(estimatedHours) || 1) * 3600000);
    return {
      vehicleId,
      customerId,
      bayId,
      technicianId: technicianId || undefined,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      estimatedHours: parseFloat(estimatedHours) || 1,
      status,
      notes: notes || undefined,
    };
  };

  const handleSave = async (force = false) => {
    setSaving(true);
    setError(null);
    if (force) {
      const r = await forceSaveAppointmentAction(buildInput(), appointment?.id);
      if (!r.ok) {
        setError(r.error);
        setSaving(false);
        return;
      }
      onSaved(appointment?.id);
      setSaving(false);
      return;
    }
    const r = await saveAppointmentAction(buildInput(), appointment?.id);
    if (r.ok) {
      onSaved(appointment?.id);
    } else if (r.error === "CONFLICT" && r.conflicts) {
      setConflicts(r.conflicts.map((c) => `${c.label} (${c.resource})`));
    } else {
      setError(r.error ?? "Erro desconhecido.");
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!appointment) return;
    setSaving(true);
    await cancelAppointmentAction(appointment.id);
    setSaving(false);
    onSaved(appointment.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5] my-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold">
            {mode === "edit" ? "Editar Marcação" : "Nova Marcação"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer" aria-label="Fechar">
            <X className="h-5 w-5 text-[#a9adae]" />
          </button>
        </div>

        {conflicts && (
          <div className="mt-4 p-3.5 rounded-[12px] bg-[#f05a50]/10 border border-[#f05a50]/40 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f05a50]">
              <AlertTriangle className="h-4 w-4" />
              Conflito de recursos detetado
            </div>
            <ul className="text-[11px] text-[#a9adae] list-disc pl-4">
              {conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="text-[11px] text-[#8a9092]">
              Podes guardar mesmo assim se tiveres justificação (a ação fica registada).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3.5 mt-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Viatura
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                const v = vehicles.find((x) => x.id === e.target.value);
                if (v?.customerId) setCustomerId(v.customerId);
              }}
              className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Baia
              <select
                value={bayId}
                onChange={(e) => setBayId(e.target.value)}
                className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] cursor-pointer"
              >
                {bays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Técnico
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] cursor-pointer"
              >
                <option value="">Sem técnico</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Data
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Início
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Duração (h)
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] cursor-pointer"
            >
              <option value="scheduled">Agendada</option>
              <option value="confirmed">Confirmada</option>
              <option value="in_progress">Em Curso</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Serviço / Notas
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="px-3 py-2 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] resize-none"
              placeholder="Ex: Full PPF — prioridade entrega sexta..."
            />
          </label>

          {error && error !== "CONFLICT" && (
            <p className="text-xs font-semibold text-[#f05a50]">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          {mode === "edit" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              className="border-[#f05a50]/40 text-[#f05a50] hover:bg-[#f05a50]/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Cancelar Marcação</span>
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              <span>Fechar</span>
            </Button>
            {conflicts ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                <span>Guardar mesmo assim</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => handleSave(false)} disabled={saving}>
                <span>{mode === "edit" ? "Guardar Alterações" : "Criar Marcação"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
