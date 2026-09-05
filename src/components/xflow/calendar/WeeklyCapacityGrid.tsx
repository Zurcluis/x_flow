import React from "react";
import { Appointment, WorkshopBay } from "@/domains/calendar/types";
import { AppointmentCard } from "./AppointmentCard";
import { Wrench } from "lucide-react";

interface WeeklyCapacityGridProps {
  bays: WorkshopBay[];
  appointments: Appointment[];
  selectedDate?: string;
}

export function WeeklyCapacityGrid({
  bays,
  appointments,
}: WeeklyCapacityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {bays.map((bay) => {
        const bayAppointments = appointments.filter((app) => app.bayId === bay.id);
        const totalHours = bayAppointments.reduce(
          (acc, a) => acc + a.estimatedHours,
          0
        );

        return (
          <div
            key={bay.id}
            className="flex flex-col gap-3 p-4 rounded-[18px] bg-[#101314] border border-white/[0.08]"
          >
            {/* Bay Header */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  {bay.code}
                </span>
                <h3 className="font-bold text-sm text-[#f1ede5] line-clamp-1">
                  {bay.name.replace(/Baia \d — /, "")}
                </h3>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#a9adae] bg-[#15191a] px-2 py-0.5 rounded-full border border-white/[0.06] shrink-0">
                <Wrench className="h-3 w-3 text-[#d3a548]" />
                <span>{bay.defaultTechnicianName.split(" ")[0]}</span>
              </div>
            </div>

            {/* Total Allocated Hours Badge */}
            <div className="flex items-center justify-between text-xs text-[#8a9092] px-1">
              <span>{bayAppointments.length} marcações</span>
              <span className="font-bold text-[#f1ede5] tabular-nums">
                {totalHours}h / 8.0h dia
              </span>
            </div>

            {/* Appointments in Bay */}
            <div className="flex flex-col gap-2.5 min-h-[360px]">
              {bayAppointments.length > 0 ? (
                bayAppointments.map((app) => (
                  <AppointmentCard key={app.id} appointment={app} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 rounded-[12px] border border-dashed border-white/[0.06] p-6 text-center text-xs text-[#8a9092]">
                  <span>Sem marcações para esta baia</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
