"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Appointment, AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";
import {
  addCivilDays,
  civilDateFromKey,
  civilDateKey,
  civilToday,
  isoFromCivil,
  parseDateKey,
  parseTime,
  startOfCivilWeek,
  todayWorkshopDateKey,
  workshopDateKey,
  workshopIsoFromWallTime,
  workshopMinutes,
  workshopTime,
} from "@/domains/calendar/datetime";
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
  initialCreate?: { vehicleId?: string };
  canManageBays: boolean;
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
  vehicleId?: string;
}

interface Feedback {
  tone: "success" | "error";
  message: string;
}

const DAY_START_H = 7;
const DAY_END_H = 20;
const PX_PER_HOUR = 48;
const SNAP_MINUTES = 30;

const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const SERVICE_LABEL: Record<WorkshopBay["serviceType"], string> = {
  ppf: "PPF",
  wrap: "Wrap",
  detailing: "Detailing",
  tint: "Tint",
  general: "Geral",
};

const STATUS_OPTIONS: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "scheduled", label: "Agendada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "in_progress", label: "Em curso" },
  { value: "completed", label: "Concluída" },
  { value: "no_show", label: "Não compareceu" },
];

const dateHeadingFormatter = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
}

function formatShortDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function statusColor(status: AppointmentStatus): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case "in_progress":
      return {
        bg: "bg-[#d3a548]/20",
        border: "border-[#d3a548]/70",
        text: "text-[#f7d46d]",
        dot: "bg-[#d3a548]",
      };
    case "confirmed":
      return {
        bg: "bg-[#6e93b5]/15",
        border: "border-[#6e93b5]/60",
        text: "text-[#9fc0dd]",
        dot: "bg-[#6e93b5]",
      };
    case "completed":
      return {
        bg: "bg-[#68a46b]/15",
        border: "border-[#68a46b]/60",
        text: "text-[#8cc78f]",
        dot: "bg-[#68a46b]",
      };
    case "no_show":
      return {
        bg: "bg-[#f05a50]/10",
        border: "border-[#f05a50]/40",
        text: "text-[#f78e85]",
        dot: "bg-[#f05a50]",
      };
    case "cancelled":
      return {
        bg: "bg-white/[0.03]",
        border: "border-white/[0.08]",
        text: "text-[#8a9092]",
        dot: "bg-[#5a6062]",
      };
    default:
      return {
        bg: "bg-white/[0.05]",
        border: "border-white/20",
        text: "text-[#f1ede5]",
        dot: "bg-[#a9adae]",
      };
  }
}

function statusLabel(status: AppointmentStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Cancelada";
}

function badgeVariant(
  status: AppointmentStatus
): "default" | "in_progress" | "success" | "danger" | "outline" {
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "success";
  if (status === "no_show") return "danger";
  if (status === "confirmed") return "outline";
  return "default";
}

function appointmentStart(appointment: Appointment): Date {
  return appointment.startIso
    ? new Date(appointment.startIso)
    : new Date(`${appointment.date}T${appointment.startTime}:00`);
}

function appointmentDurationMs(appointment: Appointment): number {
  if (appointment.startIso && appointment.endIso) {
    const duration =
      new Date(appointment.endIso).getTime() - new Date(appointment.startIso).getTime();
    if (Number.isFinite(duration) && duration > 0) return duration;
  }
  return Math.max(1, appointment.estimatedHours || 1) * 3600000;
}

interface PositionedAppointment {
  appointment: Appointment;
  startMin: number;
  endMin: number;
  top: number;
  height: number;
  column: number;
  columns: number;
}

function layoutDayAppointments(appointments: Appointment[]): PositionedAppointment[] {
  const dayStart = DAY_START_H * 60;
  const dayEnd = DAY_END_H * 60;

  const intervals = appointments
    .map((appointment) => {
      const start = appointmentStart(appointment);
      if (Number.isNaN(start.getTime())) return null;
      const startMin = workshopMinutes(start);
      const durationMinutes = Math.max(30, Math.round(appointmentDurationMs(appointment) / 60000));
      const endMin = startMin + durationMinutes;
      if (startMin >= dayEnd || endMin <= dayStart) return null;
      return {
        appointment,
        startMin: Math.max(dayStart, startMin),
        endMin: Math.min(dayEnd, endMin),
      };
    })
    .filter((item): item is { appointment: Appointment; startMin: number; endMin: number } =>
      item !== null
    )
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const positioned: PositionedAppointment[] = [];
  let cluster: typeof intervals = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const placed = cluster.map((item) => {
      let column = columnEnds.findIndex((end) => end <= item.startMin);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(item.endMin);
      } else {
        columnEnds[column] = item.endMin;
      }
      return { ...item, column };
    });
    const columns = Math.max(1, columnEnds.length);
    for (const item of placed) {
      positioned.push({
        ...item,
        top: ((item.startMin - dayStart) / 60) * PX_PER_HOUR,
        height: Math.max(30, ((item.endMin - item.startMin) / 60) * PX_PER_HOUR),
        columns,
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const interval of intervals) {
    if (cluster.length > 0 && interval.startMin >= clusterEnd) flush();
    cluster.push(interval);
    clusterEnd = Math.max(clusterEnd, interval.endMin);
  }
  flush();

  return positioned;
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-white/[0.08] bg-[#101314] p-4">
      <div className="flex items-center justify-between text-xs text-[#a9adae]">
        <span>{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-black tracking-tight text-[#f1ede5] tabular-nums">
        {value}
      </span>
      <span className="text-[11px] text-[#8a9092]">{detail}</span>
      {children}
    </div>
  );
}

function MonthEventChip({
  appointment,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  appointment: Appointment;
  onOpen: (appointment: Appointment) => void;
  onDragStart: (appointment: Appointment, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  const color = statusColor(appointment.status);
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(appointment, event)}
      onDragEnd={onDragEnd}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(appointment);
      }}
      className={`w-full cursor-pointer truncate rounded-[6px] border px-1.5 py-0.5 text-left text-[11px] leading-tight ${color.bg} ${color.border} ${color.text} transition-all hover:brightness-125`}
      title={`${appointment.startTime} · ${appointment.vehicleModel} (${appointment.vehiclePlate}) · ${appointment.customerName} · ${appointment.bayName}`}
    >
      <span className="mr-1 font-mono font-bold">{appointment.startTime}</span>
      {appointment.vehiclePlate} · {appointment.customerName}
    </button>
  );
}

export function CalendarEngine({
  initialAppointments,
  bays,
  technicians,
  vehicles,
  initialCreate,
  canManageBays,
}: EngineProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(() => civilToday());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [modal, setModal] = useState<ModalState | null>(
    initialCreate
      ? {
          mode: "create",
          slot: { date: civilToday(), hour: 9, minutes: 0 },
          vehicleId: initialCreate.vehicleId,
        }
      : null
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<WorkshopBay["serviceType"] | null>(null);
  const [bayModal, setBayModal] = useState<"new" | WorkshopBay | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [movePending, setMovePending] = useState(false);

  const [lastSynced, setLastSynced] = useState(initialAppointments);
  if (lastSynced !== initialAppointments) {
    setLastSynced(initialAppointments);
    setAppointments(initialAppointments);
  }

  useEffect(() => {
    if (feedback?.tone !== "success") return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const visible = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "cancelled"),
    [appointments]
  );

  const todayKey = todayWorkshopDateKey();

  const todayAppointments = useMemo(
    () => visible.filter((appointment) => appointment.date === todayKey),
    [visible, todayKey]
  );
  const todayHours = todayAppointments.reduce(
    (total, appointment) => total + (appointment.estimatedHours || 0),
    0
  );

  const currentWeekStart = startOfCivilWeek(civilToday());
  const currentWeekStartKey = civilDateKey(currentWeekStart);
  const currentWeekEndKey = civilDateKey(addCivilDays(currentWeekStart, 6));
  const weekAppointments = visible.filter(
    (appointment) =>
      appointment.date >= currentWeekStartKey && appointment.date <= currentWeekEndKey
  );
  const weekHours = weekAppointments.reduce(
    (total, appointment) => total + (appointment.estimatedHours || 0),
    0
  );
  const weeklyCapacityHours = bays.length * 5 * 8;
  const occupancyPercentage =
    weeklyCapacityHours > 0
      ? Math.min(100, Math.round((weekHours / weeklyCapacityHours) * 100))
      : 0;

  const moveCursor = (direction: number) => {
    if (view === "month") {
      setCursor(
        new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + direction, 1, 12))
      );
    } else if (view === "week") {
      setCursor(addCivilDays(cursor, direction * 7));
    } else if (view === "day" || view === "mapa") {
      setCursor(addCivilDays(cursor, direction));
    } else {
      setCursor(addCivilDays(cursor, direction * 30));
    }
  };

  const periodLabel = useMemo(() => {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    if (view === "month") return `${MONTHS[month]} ${year}`;
    if (view === "week") {
      const start = startOfCivilWeek(cursor);
      const end = addCivilDays(start, 6);
      if (start.getUTCMonth() === end.getUTCMonth()) {
        return `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[month].slice(0, 3)} ${year}`;
      }
      return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()].slice(0, 3)} – ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()].slice(0, 3)} ${year}`;
    }
    if (view === "day" || view === "mapa") {
      return capitalize(fullDateFormatter.format(cursor));
    }
    return "Próximas marcações";
  }, [view, cursor]);

  const openCreate = (slot?: SlotInfo) => {
    setModal({ mode: "create", slot });
  };

  const openEdit = (appointment: Appointment) => {
    setModal({ mode: "edit", appointment });
  };

  const handleMove = async (appointmentId: string, newStart: Date, bayId?: string) => {
    if (movePending) return;
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    const durationMs = appointmentDurationMs(appointment);
    const newEnd = new Date(newStart.getTime() + durationMs);
    const optimistic: Appointment = {
      ...appointment,
      date: workshopDateKey(newStart),
      startTime: workshopTime(newStart),
      endTime: workshopTime(newEnd),
      startIso: newStart.toISOString(),
      endIso: newEnd.toISOString(),
      bayId: bayId ?? appointment.bayId,
      bayName: bayId
        ? bays.find((bay) => bay.id === bayId)?.name ?? appointment.bayName
        : appointment.bayName,
    };

    setMovePending(true);
    setFeedback(null);
    setAppointments((current) =>
      current.map((item) => (item.id === appointmentId ? optimistic : item))
    );

    const rollback = () =>
      setAppointments((current) =>
        current.map((item) => (item.id === appointmentId ? appointment : item))
      );

    let result: Awaited<ReturnType<typeof moveAppointmentAction>>;
    try {
      result = await moveAppointmentAction(
        appointmentId,
        newStart.toISOString(),
        newEnd.toISOString(),
        bayId
      );
    } catch (moveError) {
      rollback();
      setFeedback({
        tone: "error",
        message:
          moveError instanceof Error
            ? moveError.message
            : "Não foi possível mover a marcação.",
      });
      return;
    } finally {
      setMovePending(false);
    }

    if (!result.ok) {
      rollback();
      if (result.error === "CONFLICT" && result.conflicts?.length) {
        const detail = result.conflicts
          .slice(0, 3)
          .map((conflict) => `${conflict.label} (${conflict.resource})`)
          .join(" · ");
        setFeedback({
          tone: "error",
          message: `Movimento cancelado: conflito com ${detail}.`,
        });
      } else {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível mover a marcação.",
        });
      }
      return;
    }

    setFeedback({ tone: "success", message: "Marcação movida." });
    router.refresh();
  };

  const moveByDays = (appointment: Appointment, targetDay: Date) => {
    const keepTime = appointment.startIso
      ? workshopTime(new Date(appointment.startIso))
      : appointment.startTime;
    const iso = isoFromCivil(targetDay, keepTime);
    if (!iso) {
      setFeedback({ tone: "error", message: "Hora inválida." });
      return;
    }
    void handleMove(appointment.id, new Date(iso));
  };

  const handleGridDrop = (
    event: React.DragEvent<HTMLDivElement>,
    day: Date,
    bayId?: string
  ) => {
    event.preventDefault();
    const appointmentId = draggedId;
    setDraggedId(null);
    if (!appointmentId) return;
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = Math.max(0, event.clientY - rect.top);
    const rawMinutes = DAY_START_H * 60 + (offsetY / PX_PER_HOUR) * 60;
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const clampedMinutes = Math.min(
      DAY_END_H * 60 - SNAP_MINUTES,
      Math.max(DAY_START_H * 60, snappedMinutes)
    );
    const hour = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;
    const iso = isoFromCivil(day, `${pad(hour)}:${pad(minutes)}`);
    if (!iso) {
      setFeedback({ tone: "error", message: "Hora inválida." });
      return;
    }
    void handleMove(appointment.id, new Date(iso), bayId);
  };

  const weekDays = useMemo(() => {
    const start = startOfCivilWeek(cursor);
    return Array.from({ length: 7 }, (_, index) => addCivilDays(start, index));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1, 12));
    const lead = (first.getUTCDay() + 6) % 7;
    const start = addCivilDays(first, -lead);
    return Array.from({ length: 42 }, (_, index) => addCivilDays(start, index));
  }, [cursor]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = DAY_START_H; hour < DAY_END_H; hour++) list.push(hour);
    return list;
  }, []);

  const timeSlots: Array<{ hour: number; minutes: number }> = [];
  for (let hour = DAY_START_H; hour < DAY_END_H; hour++) {
    timeSlots.push({ hour, minutes: 0 });
    timeSlots.push({ hour, minutes: 30 });
  }

  const cursorKey = civilDateKey(cursor);

  const appointmentsForDay = (day: Date) =>
    visible.filter((appointment) => appointment.date === civilDateKey(day));

  const upcoming = useMemo(
    () =>
      visible
        .filter((appointment) => appointment.date >= todayKey)
        .sort((a, b) => (a.startIso ?? a.date).localeCompare(b.startIso ?? b.date)),
    [visible, todayKey]
  );

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Resumo da agenda"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <SummaryCard
          label="Hoje"
          value={`${todayAppointments.length}`}
          detail={`${formatHours(todayHours)} planeadas`}
          icon={<CalendarDays className="h-4 w-4 text-[#d3a548]" />}
        />
        <SummaryCard
          label="Esta semana"
          value={`${weekAppointments.length}`}
          detail={`${formatHours(weekHours)} planeadas`}
          icon={<Clock className="h-4 w-4 text-[#6e93b5]" />}
        />
        <SummaryCard
          label="Equipa"
          value={`${technicians.length}`}
          detail={technicians.length === 1 ? "técnico ativo" : "técnicos ativos"}
          icon={<Users className="h-4 w-4 text-[#68a46b]" />}
        />
        <SummaryCard
          label="Ocupação semanal"
          value={`${occupancyPercentage}%`}
          detail={`${formatHours(weekHours)} de ${formatHours(weeklyCapacityHours)}`}
          icon={<Car className="h-4 w-4 text-[#d3a548]" />}
        >
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-label="Ocupação semanal das baias"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={occupancyPercentage}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] transition-all duration-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </SummaryCard>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {view !== "agenda" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-[#15191a]"
                onClick={() => setCursor(civilToday())}
              >
                <span>Hoje</span>
              </Button>
              <button
                type="button"
                onClick={() => moveCursor(-1)}
                className="cursor-pointer rounded-sm bg-[#15191a] p-2 text-[#a9adae] transition-colors hover:bg-white/10 hover:text-[#f1ede5]"
                aria-label="Período anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveCursor(1)}
                className="cursor-pointer rounded-sm bg-[#15191a] p-2 text-[#a9adae] transition-colors hover:bg-white/10 hover:text-[#f1ede5]"
                aria-label="Período seguinte"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <span className="ml-1 text-sm font-bold text-[#f1ede5]" aria-live="polite">
            {periodLabel}
          </span>
          {movePending && (
            <span className="text-[11px] text-[#8a9092]">a atualizar…</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 overflow-x-auto rounded-md border border-white/[0.06] bg-[#101314] p-1 select-none"
            role="group"
            aria-label="Vista da agenda"
          >
            {(
              [
                ["month", "Mês"],
                ["week", "Semana"],
                ["day", "Dia"],
                ["mapa", "Mapa"],
                ["agenda", "Agenda"],
              ] as Array<[ViewMode, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`cursor-pointer rounded-sm px-3 py-1.5 text-xs font-medium transition-all ${
                  view === id
                    ? "border border-[#d3a548]/40 bg-[#1f1b14] text-[#f7d46d]"
                    : "text-[#a9adae] hover:text-[#f1ede5]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openCreate({ date: cursor, hour: 9, minutes: 0 })}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova marcação</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-xs font-medium ${
            feedback.tone === "error"
              ? "border-[#f05a50]/40 bg-[#f05a50]/10 text-[#f78e85]"
              : "border-[#68a46b]/40 bg-[#68a46b]/10 text-[#8cc78f]"
          }`}
        >
          {feedback.tone === "error" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Fechar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {bays.length === 0 && (
        <div className="flex flex-col gap-3 rounded-md border border-[#d3a548]/30 bg-[#1f1b14]/60 p-4 text-xs text-[#a9adae] sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d3a548]" />
            <span>
              Ainda não há baias configuradas. Cria a primeira baia no mapa para
              poderes agendar marcações.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView("mapa")}
          >
            Configurar baias
          </Button>
        </div>
      )}

      {view === "month" && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-7 border-b border-white/[0.06] bg-[#101314]">
            {WEEKDAYS_SHORT.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#8a9092]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dayKey = civilDateKey(day);
              const inMonth = day.getUTCMonth() === cursor.getUTCMonth();
              const isToday = dayKey === todayKey;
              const dayAppointments = appointmentsForDay(day);
              return (
                <div
                  key={dayKey}
                  onClick={() => openCreate({ date: day, hour: 9, minutes: 0 })}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggedId) return;
                    const appointment = appointments.find(
                      (item) => item.id === draggedId
                    );
                    if (appointment) moveByDays(appointment, day);
                    setDraggedId(null);
                  }}
                  aria-label={`${formatShortDate(dayKey)}, ${dayAppointments.length} marcações`}
                  className={`min-h-[100px] cursor-pointer border-b border-r border-white/[0.04] p-1 transition-colors hover:bg-white/[0.02] sm:min-h-[110px] ${
                    inMonth ? "" : "opacity-40"
                  } ${isToday ? "bg-[#1f1b14]/40" : ""}`}
                >
                  <span
                    className={`inline-block rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      isToday
                        ? "bg-[#d3a548] text-[#050606]"
                        : "text-[#a9adae]"
                    }`}
                  >
                    {day.getUTCDate()}
                  </span>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <MonthEventChip
                        key={appointment.id}
                        appointment={appointment}
                        onOpen={openEdit}
                        onDragStart={(item, event) => {
                          setDraggedId(item.id);
                          event.dataTransfer.setData("text/plain", item.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggedId(null)}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCursor(day);
                          setView("day");
                        }}
                        className="cursor-pointer px-1 text-left text-[10px] text-[#8a9092] hover:text-[#f1ede5]"
                      >
                        +{dayAppointments.length - 3} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {(view === "week" || (view === "day" && bays.length > 0)) && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <div className={view === "week" ? "min-w-[900px]" : "min-w-[640px]"}>
            <div
              className="grid border-b border-white/[0.06] bg-[#101314]"
              style={{
                gridTemplateColumns: `60px repeat(${
                  view === "week" ? 7 : Math.max(1, bays.length)
                }, 1fr)`,
              }}
            >
              <div />
              {(view === "week" ? weekDays : bays).map((column, index) => {
                const day = view === "week" ? (column as Date) : cursor;
                const bay = view === "day" ? (column as WorkshopBay) : undefined;
                const isToday = civilDateKey(day) === todayKey;
                return (
                  <div
                    key={bay?.id ?? index}
                    className={`border-l border-white/[0.04] p-2 text-center ${
                      isToday ? "bg-[#1f1b14]/40" : ""
                    }`}
                  >
                    {view === "week" ? (
                      <>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
                          {WEEKDAYS_SHORT[(day.getUTCDay() + 6) % 7]}
                        </div>
                        <div
                          className={`font-mono text-sm font-bold ${
                            isToday ? "text-[#f7d46d]" : "text-[#f1ede5]"
                          }`}
                        >
                          {day.getUTCDate()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="truncate text-xs font-bold text-[#f1ede5]">
                          {bay?.name ?? "—"}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-[#8a9092]">
                          {bay ? SERVICE_LABEL[bay.serviceType] : ""}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `60px repeat(${
                  view === "week" ? 7 : Math.max(1, bays.length)
                }, 1fr)`,
              }}
            >
              <div className="border-r border-white/[0.04]">
                {hours.map((hour) => (
                  <div key={hour} className="relative" style={{ height: PX_PER_HOUR }}>
                    <span className="absolute -top-1.5 right-1 font-mono text-[10px] text-[#8a9092]">
                      {pad(hour)}:00
                    </span>
                  </div>
                ))}
              </div>

              {(view === "week" ? weekDays : bays).map((column, columnIndex) => {
                const day = view === "week" ? (column as Date) : cursor;
                const bay = view === "day" ? (column as WorkshopBay) : undefined;
                const dayAppointments =
                  view === "week"
                    ? appointmentsForDay(day)
                    : visible.filter(
                        (appointment) =>
                          appointment.date === cursorKey && appointment.bayId === bay?.id
                      );
                const positioned = layoutDayAppointments(dayAppointments);
                const isToday = civilDateKey(day) === todayKey;

                return (
                  <div
                    key={bay?.id ?? columnIndex}
                    className={`relative border-r border-white/[0.04] ${
                      isToday ? "bg-[#d3a548]/[0.02]" : ""
                    }`}
                    onDragEnter={(event) => event.preventDefault()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleGridDrop(event, day, bay?.id)}
                  >
                    {timeSlots.map(({ hour, minutes }) => (
                      <button
                        type="button"
                        key={`${hour}-${minutes}`}
                        onClick={() =>
                          openCreate({
                            date: day,
                            hour,
                            minutes,
                            bayId: bay?.id,
                          })
                        }
                        aria-label={`Criar marcação em ${formatShortDate(
                          civilDateKey(day)
                        )} às ${pad(hour)}:${pad(minutes)}`}
                        className="block w-full cursor-pointer border-b border-white/[0.03] hover:bg-white/[0.03]"
                        style={{ height: PX_PER_HOUR / 2 }}
                      />
                    ))}

                    {positioned.map(({ appointment, top, height, column, columns }) => {
                      const color = statusColor(appointment.status);
                      const width = 100 / columns;
                      return (
                        <button
                          type="button"
                          key={appointment.id}
                          draggable
                          onDragStart={(event) => {
                            setDraggedId(appointment.id);
                            event.dataTransfer.setData("text/plain", appointment.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => setDraggedId(null)}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(appointment);
                          }}
                          className={`absolute overflow-hidden rounded-sm border px-1.5 py-1 text-left transition-all hover:brightness-125 ${color.bg} ${color.border} ${color.text}`}
                          style={{
                            top,
                            height,
                            minHeight: 24,
                            left: `calc(${column * width}% + 2px)`,
                            width: `calc(${width}% - 4px)`,
                          }}
                          title={`${appointment.startTime}–${appointment.endTime} · ${appointment.vehicleModel} (${appointment.vehiclePlate}) · ${appointment.customerName} · ${appointment.bayName}`}
                        >
                          <span className="block font-mono text-[10px] font-bold leading-tight">
                            {appointment.startTime}–{appointment.endTime}
                          </span>
                          <span className="block truncate text-[11px] font-semibold leading-tight">
                            {appointment.vehicleModel}
                          </span>
                          {height > 48 && (
                            <span className="block truncate text-[10px] leading-tight opacity-80">
                              {appointment.customerName}
                            </span>
                          )}
                          {height > 64 && (
                            <span className="block truncate text-[10px] leading-tight opacity-70">
                              {appointment.bayName}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "mapa" && (
        <WorkshopMap
          date={cursor}
          appointments={visible}
          bays={bays}
          technicians={technicians}
          vehicles={vehicles}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          dragType={dragType}
          setDragType={setDragType}
          bayModal={bayModal}
          setBayModal={setBayModal}
          canManageBays={canManageBays}
          onOpenEditAppointment={openEdit}
          onRefresh={() => router.refresh()}
        />
      )}

      {view === "agenda" && (
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-white/[0.06] bg-[#101314] p-10 text-center">
              <CalendarDays className="h-8 w-8 text-[#5a6062]" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#f1ede5]">
                  Sem marcações futuras
                </span>
                <span className="text-xs text-[#8a9092]">
                  Cria a próxima marcação para começar a preencher a agenda.
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => openCreate({ date: civilToday(), hour: 9, minutes: 0 })}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova marcação</span>
              </Button>
            </div>
          ) : (
            (() => {
              let lastDate = "";
              return upcoming.map((appointment) => {
                const showDate = appointment.date !== lastDate;
                lastDate = appointment.date;
                return (
                  <React.Fragment key={appointment.id}>
                    {showDate && (
                      <span className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {capitalize(dateHeadingFormatter.format(civilDateFromKey(appointment.date)))}
                        <span className="font-mono text-[10px] font-medium text-[#8a9092]">
                          {formatShortDate(appointment.date)}
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(appointment)}
                      className="flex w-full cursor-pointer flex-col gap-3 rounded-md border border-white/[0.06] bg-[#101314] p-3.5 text-left transition-all hover:border-[#d3a548]/40 sm:flex-row sm:items-center"
                    >
                      <span className="flex shrink-0 items-center gap-2 sm:w-32">
                        <span className="font-mono text-xs font-bold text-[#f7d46d]">
                          {appointment.startTime}
                        </span>
                        <span className="text-[11px] text-[#8a9092]">
                          → {appointment.endTime}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${statusColor(appointment.status).dot}`}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-[#f1ede5]">
                            {appointment.vehicleModel}
                          </span>
                          <span className="rounded border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#f1ede5]">
                            {appointment.vehiclePlate}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#a9adae]">
                          {appointment.customerName} · {appointment.bayName} ·{" "}
                          {appointment.technicianName}
                        </span>
                      </span>
                      <Badge
                        variant={badgeVariant(appointment.status)}
                        className="shrink-0 self-start text-[11px] sm:self-center"
                      >
                        {statusLabel(appointment.status)}
                      </Badge>
                    </button>
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>
      )}

      {modal && (
        <AppointmentModal
          mode={modal.mode}
          appointment={modal.appointment}
          slot={modal.slot}
          initialVehicleId={modal.vehicleId}
          bays={bays}
          technicians={technicians}
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSaved={(deleted) => {
            const wasEdit = modal.mode === "edit";
            setModal(null);
            if (deleted) {
              setAppointments((current) =>
                current.filter((appointment) => appointment.id !== deleted)
              );
              setFeedback({ tone: "success", message: "Marcação cancelada." });
            } else {
              setFeedback({
                tone: "success",
                message: wasEdit ? "Marcação atualizada." : "Marcação criada.",
              });
            }
            router.refresh();
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8a9092]">
        {STATUS_OPTIONS.map((status) => {
          const color = statusColor(status.value);
          return (
            <span key={status.value} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full border ${color.bg} ${color.border}`}
              />
              {status.label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" />
          Clica num espaço vazio para criar · arrasta para mover
        </span>
        <button
          type="button"
          onClick={() => setView("agenda")}
          className="ml-auto flex cursor-pointer items-center gap-1.5 hover:text-[#f1ede5]"
        >
          <List className="h-3 w-3" />
          Ver em lista
        </button>
      </div>
    </div>
  );
}

interface ModalProps {
  mode: "create" | "edit";
  appointment?: Appointment;
  slot?: SlotInfo;
  initialVehicleId?: string;
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
  initialVehicleId,
  bays,
  technicians,
  vehicles,
  onClose,
  onSaved,
}: ModalProps) {
  const todayKey = todayWorkshopDateKey();
  const initVehicle =
    appointment?.vehicleId ?? initialVehicleId ?? vehicles[0]?.id ?? "";
  const initDate = appointment?.date ?? (slot ? civilDateKey(slot.date) : todayKey);
  const initHour = appointment?.startTime
    ? appointment.startTime
    : slot
      ? `${pad(slot.hour)}:${pad(slot.minutes ?? 0)}`
      : "09:00";
  const initBay = appointment?.bayId ?? slot?.bayId ?? bays[0]?.id ?? "";
  const initialVehicle = vehicles.find((vehicle) => vehicle.id === initVehicle);

  const [vehicleId, setVehicleId] = useState(initVehicle);
  const [customerId, setCustomerId] = useState(
    appointment?.customerId ?? initialVehicle?.customerId ?? ""
  );
  const [bayId, setBayId] = useState(initBay);
  const [technicianId, setTechnicianId] = useState(
    appointment ? appointment.technicianId ?? "" : technicians[0]?.id ?? ""
  );
  const [date, setDate] = useState(initDate);
  const [startTime, setStartTime] = useState(initHour);
  const [estimatedHours, setEstimatedHours] = useState(
    appointment?.estimatedHours?.toString() ?? "2"
  );
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? "scheduled"
  );
  const [notes, setNotes] = useState(appointment?.notes ?? appointment?.serviceTitle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );

    const firstFocusable =
      node.querySelector<HTMLElement>("select, input, textarea") ?? getFocusable()[0];
    window.setTimeout(() => firstFocusable?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
  const selectedVehicleHasOwner = Boolean(selectedVehicle?.customerId);
  const statusOptions =
    appointment?.status === "cancelled"
      ? [{ value: "cancelled" as AppointmentStatus, label: "Cancelada" }, ...STATUS_OPTIONS]
      : STATUS_OPTIONS;

  const validate = (): string | null => {
    if (vehicles.length === 0) return "Não há viaturas disponíveis para agendar.";
    if (!vehicleId) return "Seleciona uma viatura.";
    if (!selectedVehicleHasOwner) {
      return "A viatura selecionada não tem proprietário associado.";
    }
    if (bays.length === 0) return "Cria uma baia antes de agendar uma marcação.";
    if (!bayId) return "Seleciona uma baia.";
    if (!date || !parseDateKey(date)) return "Data inválida.";
    if (!parseTime(startTime)) return "Hora de início inválida.";
    const hours = Number(estimatedHours);
    if (!Number.isFinite(hours) || hours < 0.5) {
      return "A duração mínima é de 30 minutos.";
    }
    if (hours > 24 * 7) {
      return "A duração não pode exceder 7 dias.";
    }
    return null;
  };

  const buildInput = () => {
    const startIso = workshopIsoFromWallTime(date, startTime);
    if (!startIso) throw new Error("Data ou hora inválida.");
    const hours = Number(estimatedHours);
    const endIso = new Date(new Date(startIso).getTime() + hours * 3600000).toISOString();
    return {
      vehicleId,
      customerId,
      bayId,
      technicianId: technicianId || null,
      quoteId: appointment?.quoteId ?? null,
      startTime: startIso,
      endTime: endIso,
      estimatedHours: hours,
      status,
      notes: notes.trim() || undefined,
    };
  };

  const handleSave = async (force = false) => {
    if (saving) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setConflicts(null);
      return;
    }
    let input: ReturnType<typeof buildInput>;
    try {
      input = buildInput();
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : "Dados inválidos.");
      return;
    }

    setSaving(true);
    setError(null);
    setConflicts(null);
    try {
      if (force) {
        const result = await forceSaveAppointmentAction(input, appointment?.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved();
        return;
      }

      const result = await saveAppointmentAction(input, appointment?.id);
      if (result.ok) {
        onSaved();
        return;
      }
      if (result.error === "CONFLICT" && result.conflicts?.length) {
        setConflicts(
          result.conflicts.map(
            (conflict) => `${conflict.label} (${conflict.resource})`
          )
        );
        return;
      }
      setError(result.error || "Erro ao guardar a marcação.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Erro ao guardar a marcação."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await cancelAppointmentAction(appointment.id);
      if (!result.ok) {
        setError(result.error || "Erro ao cancelar a marcação.");
        return;
      }
      onSaved(appointment.id);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Erro ao cancelar a marcação."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-sm border border-white/[0.08] bg-[#15191a] px-3 text-sm text-[#f1ede5] transition-colors focus:border-[#d3a548]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050606]/85 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="relative my-8 w-full max-w-xl rounded-[18px] border border-white/[0.12] bg-[#101314] p-6 text-[#f1ede5] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex flex-col gap-1">
            <h2 id="appointment-modal-title" className="text-lg font-bold">
              {mode === "edit" ? "Editar marcação" : "Nova marcação"}
            </h2>
            <span className="text-[11px] text-[#8a9092]">
              {formatShortDate(date)} · hora de Lisboa
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-[#a9adae]" />
          </button>
        </div>

        {conflicts && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-2 rounded-md border border-[#f05a50]/40 bg-[#f05a50]/10 p-3.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#f05a50]">
              <AlertTriangle className="h-4 w-4" />
              Conflito de recursos detetado
            </div>
            <ul className="list-disc pl-4 text-[11px] text-[#a9adae]">
              {conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
            </ul>
            <p className="text-[11px] text-[#8a9092]">
              Se guardares mesmo assim, vais criar uma sobreposição de baia,
              técnico ou viatura. Ajusta os campos e volta a guardar para validar
              de novo.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Viatura
            <select
              value={vehicleId}
              onChange={(event) => {
                const nextVehicleId = event.target.value;
                setVehicleId(nextVehicleId);
                setCustomerId(
                  vehicles.find((vehicle) => vehicle.id === nextVehicleId)?.customerId ?? ""
                );
              }}
              className={`${inputClass} cursor-pointer`}
              disabled={vehicles.length === 0}
            >
              {vehicles.length === 0 && <option value="">Sem viaturas</option>}
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </label>

          {vehicles.length > 0 && !selectedVehicleHasOwner && (
            <p className="rounded-sm border border-[#f05a50]/40 bg-[#2a1210] p-3 text-[11px] font-semibold text-[#f78e85]">
              Esta viatura não tem proprietário associado. Associa um cliente no
              CRM (Viaturas) antes de agendar.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Baia
              <select
                value={bayId}
                onChange={(event) => setBayId(event.target.value)}
                className={`${inputClass} cursor-pointer`}
                disabled={bays.length === 0}
              >
                {bays.length === 0 && <option value="">Sem baias</option>}
                {bays.map((bay) => (
                  <option key={bay.id} value={bay.id}>
                    {bay.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Técnico
              <select
                value={technicianId}
                onChange={(event) => setTechnicianId(event.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Sem técnico</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Data
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Início
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-[#a9adae] sm:col-span-1">
              Duração (h)
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={estimatedHours}
                onChange={(event) => setEstimatedHours(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Estado
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AppointmentStatus)}
                className={`${inputClass} cursor-pointer`}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {appointment?.quoteNumber && (
              <div className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
                Orçamento
                <span className="flex h-10 items-center rounded-sm border border-white/[0.08] bg-[#0d0f10] px-3 font-mono text-sm text-[#f1ede5]">
                  {appointment.quoteNumber}
                </span>
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Serviço / Notas
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-sm border border-white/[0.08] bg-[#15191a] px-3 py-2 text-sm text-[#f1ede5] transition-colors focus:border-[#d3a548]"
              placeholder="Ex: Full PPF — prioridade entrega sexta"
            />
          </label>

          {error && (
            <p role="alert" className="text-xs font-semibold text-[#f05a50]">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
          {mode === "edit" ? (
            <div className="flex flex-wrap items-center gap-2">
              {confirmCancel ? (
                <>
                  <span className="text-[11px] font-semibold text-[#f78e85]">
                    Cancelar esta marcação?
                  </span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <span>Confirmar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmCancel(false)}
                    disabled={saving}
                  >
                    <span>Voltar</span>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmCancel(true)}
                  disabled={saving}
                  className="border-[#f05a50]/40 text-[#f05a50] hover:bg-[#f05a50]/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Cancelar marcação</span>
                </Button>
              )}
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              <span>Fechar</span>
            </Button>
            {conflicts && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                <span>Guardar com sobreposição</span>
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || vehicles.length === 0 || bays.length === 0}
            >
              <span>{saving ? "A guardar…" : mode === "edit" ? "Guardar alterações" : "Criar marcação"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
