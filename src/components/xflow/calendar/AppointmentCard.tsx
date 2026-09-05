import React from "react";
import { Clock, User, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/domains/calendar/types";

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <Card className="flex flex-col justify-between p-4 bg-[#15191a] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-150">
      <div>
        {/* Time and Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#d3a548]">
            <Clock className="h-3.5 w-3.5 text-[#d3a548]" />
            <span>
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>

          <Badge
            variant={
              appointment.status === "in_progress"
                ? "in_progress"
                : appointment.status === "confirmed"
                ? "success"
                : appointment.status === "scheduled"
                ? "outline"
                : "default"
            }
            className="text-[11px]"
          >
            {appointment.status === "in_progress"
              ? "Na Oficina"
              : appointment.status === "confirmed"
              ? "Confirmado"
              : appointment.status === "scheduled"
              ? "Agendado"
              : "Concluído"}
          </Badge>
        </div>

        {/* Vehicle & Plate */}
        <div className="flex items-center gap-2 mt-3">
          {/* Plate Badge */}
          <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f1ede5] shrink-0">
            <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
            <span>{appointment.vehiclePlate}</span>
          </div>

          <span className="text-xs font-bold text-[#f1ede5] truncate">
            {appointment.vehicleModel}
          </span>
        </div>

        {/* Service Title */}
        <p className="text-xs text-[#a9adae] font-medium mt-1 line-clamp-1">
          {appointment.serviceTitle}
        </p>

        {/* Customer & Technician */}
        <div className="flex items-center justify-between text-[12px] text-[#8a9092] mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1 truncate pr-2">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{appointment.customerName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-medium text-[#a9adae]">
            <Wrench className="h-3 w-3 text-[#d3a548]" />
            <span>{appointment.technicianName}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
