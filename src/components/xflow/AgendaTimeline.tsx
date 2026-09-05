import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AgendaEvent {
  id: string;
  time: string;
  vehicle: string;
  service: string;
  technician: string;
  status: "completed" | "in_progress" | "scheduled";
}

interface AgendaTimelineProps {
  events: AgendaEvent[];
}

export function AgendaTimeline({ events }: AgendaTimelineProps) {
  return (
    <Card className="flex flex-col justify-between bg-[#101314] border border-white/[0.08] p-5 h-full">
      <div>
        <CardHeader className="p-0 pb-4">
          <CardTitle>
            Agenda de Hoje
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative pl-6 flex flex-col gap-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/[0.08]">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 text-xs">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-0.5 flex items-center justify-center">
                  {event.status === "completed" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#68a46b] text-[#050606] shadow-[0_0_10px_rgba(104,164,107,0.4)]">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : event.status === "in_progress" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#101314] border-2 border-[#d3a548]">
                      <div className="h-2 w-2 rounded-full bg-[#d3a548]" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#101314] border-2 border-white/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    </div>
                  )}
                </div>

                {/* Event Time */}
                <span className="font-semibold text-[#a9adae] tabular-nums shrink-0 w-10">
                  {event.time}
                </span>

                {/* Event Content */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-[#f1ede5]">
                    <span className="truncate">{event.vehicle}</span>
                    <span className="text-[#8a9092]">—</span>
                    <span className="text-[#a9adae] truncate">{event.service}</span>
                  </div>
                  {event.technician && (
                    <span className="text-[12px] text-[#8a9092] mt-0.5">
                      {event.technician}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Bottom Link */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] transition-colors mt-4 pt-3 border-t border-white/[0.04] group"
      >
        <span>Ver agenda completa</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}
