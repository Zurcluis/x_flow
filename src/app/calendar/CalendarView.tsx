"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeeklyCapacityGrid } from "@/components/xflow/calendar/WeeklyCapacityGrid";
import { Appointment, WorkshopBay } from "@/domains/calendar/types";
import { calculateWeeklyCapacity } from "@/domains/calendar/capacity-calculator";

interface CalendarViewProps {
  bays: WorkshopBay[];
  appointments: Appointment[];
  selectedDate: string;
  dayLabel: string;
}

export function CalendarView({ bays, appointments, selectedDate, dayLabel }: CalendarViewProps) {
  const todayAppointments = appointments.filter((a) => a.date === selectedDate);

  // Calculate deterministic capacity metrics
  const capacity = calculateWeeklyCapacity(appointments, bays.length, 40);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Planeamento Operacional & Baias
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Agenda & Capacidade da Oficina
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/checkins/new">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              <span>Novo Check-in / Entrada</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Workshop Capacity Top Panel (76% Occupancy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity Meter */}
        <div className="flex flex-col justify-between p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/40 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#d3a548]">
            <span className="font-bold">Taxa de Ocupação Semanal</span>
            <TrendingUp className="h-4 w-4 text-[#d3a548]" />
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#f7d46d] tabular-nums">
              {capacity.occupancyPercentage}%
            </span>
            <span className="text-xs text-[#a9adae]">
              ({capacity.allocatedHours}h de {capacity.totalCapacityHours}h)
            </span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-white/[0.08] overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] transition-all duration-500"
              style={{ width: `${capacity.occupancyPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Baias Ativas Hoje</span>
            <Wrench className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {bays.length} Baias
          </span>
          <span className="text-[12px] text-[#68a46b] font-medium">
            100% de capacidade operacional
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Marcações Hoje</span>
            <CalendarIcon className="h-4 w-4 text-[#d3a548]" />
          </div>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {todayAppointments.length} Viaturas
          </span>
          <span className="text-[12px] text-[#8a9092]">
            4 em produção · 2 agendadas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-[#a9adae]">
            <span>Entregas Previstas Hoje</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <span className="text-2xl font-black text-[#68a46b] tabular-nums">
            2 Concluídas
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Ferrari 488 GTB & BMW M4
          </span>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-[#101314] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-[8px] bg-[#15191a] text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#15191a] border border-white/[0.04]">
            <CalendarIcon className="h-4 w-4 text-[#d3a548]" />
            <span className="font-bold text-sm text-[#f1ede5]">
              {dayLabel}
            </span>
          </div>
          <button
            type="button"
            className="p-2 rounded-[8px] bg-[#15191a] text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-[#15191a]">
            <span>Hoje</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-[#15191a]">
            <span>Vista Semanal</span>
          </Button>
        </div>
      </div>

      {/* Weekly Bays Schedule Grid */}
      <WeeklyCapacityGrid
        bays={bays}
        appointments={appointments}
        selectedDate={selectedDate}
      />
    </div>
  );
}
