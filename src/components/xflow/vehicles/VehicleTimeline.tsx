import React from "react";
import {
  Camera,
  FileText,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VehicleTimelineEvent } from "@/domains/vehicles/types";

interface VehicleTimelineProps {
  events?: VehicleTimelineEvent[];
}

export function VehicleTimeline({ events }: VehicleTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
        <span className="text-sm font-medium text-[#a9adae]">
          Sem eventos registados no histórico desta viatura.
        </span>
        <span className="text-xs text-[#8a9092] mt-1">
          Os check-ins, orçamentos e intervenções concluídas aparecerão aqui cronologicamente.
        </span>
      </div>
    );
  }

  const getIcon = (type: VehicleTimelineEvent["type"]) => {
    switch (type) {
      case "checkin":
        return <Camera className="h-4 w-4 text-[#d3a548]" />;
      case "quote":
        return <FileText className="h-4 w-4 text-[#6e93b5]" />;
      case "work_order":
      case "service_completed":
        return <Wrench className="h-4 w-4 text-[#f7d46d]" />;
      case "qc_passed":
        return <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />;
      case "warranty_issued":
        return <ShieldCheck className="h-4 w-4 text-[#68a46b]" />;
      case "owner_changed":
        return <UserCheck className="h-4 w-4 text-[#d3a548]" />;
      case "note_added":
      default:
        return <StickyNote className="h-4 w-4 text-[#a9adae]" />;
    }
  };

  return (
    <div className="relative pl-6 flex flex-col gap-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-white/[0.08]">
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-4 text-xs">
          {/* Dot Icon */}
          <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#101314] border border-white/20 shadow-sm">
            {getIcon(event.type)}
          </div>

          {/* Event Content Box */}
          <div className="flex flex-col gap-1.5 p-4 rounded-md bg-[#101314] border border-white/[0.06] hover:border-white/15 transition-colors flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#f1ede5]">{event.title}</span>
                {event.badgeText && (
                  <Badge variant="gold" className="text-[11px] px-1.5 py-0 h-4">
                    {event.badgeText}
                  </Badge>
                )}
              </div>
              <span className="text-[12px] text-[#8a9092] tabular-nums font-mono">{event.date}</span>
            </div>

            <p className="text-xs text-[#a9adae] leading-relaxed">{event.description}</p>

            {event.authorName && (
              <span className="text-[11px] text-[#8a9092] mt-1 pt-1 border-t border-white/[0.02]">
                Registado por: <strong className="text-[#f1ede5] font-medium">{event.authorName}</strong>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
