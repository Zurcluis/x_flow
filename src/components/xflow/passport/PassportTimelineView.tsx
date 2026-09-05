import React from "react";
import Link from "next/link";
import {
  Camera,
  FileText,
  Wrench,
  ShieldCheck,
  CreditCard,
  Key,
  Award,
  ExternalLink,
} from "lucide-react";
import { PassportEvent } from "@/domains/finance/types";
import { Badge } from "@/components/ui/badge";

interface PassportTimelineViewProps {
  events: PassportEvent[];
}

export function PassportTimelineView({ events }: PassportTimelineViewProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "checkin":
        return Camera;
      case "quote":
        return FileText;
      case "work_order":
        return Wrench;
      case "qc_pass":
        return ShieldCheck;
      case "invoice":
        return CreditCard;
      case "delivery":
        return Key;
      case "warranty":
        return Award;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="relative flex flex-col gap-6 pl-4 sm:pl-6 before:absolute before:left-[21px] sm:before:left-[29px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#d3a548] before:via-[#68a46b] before:to-[#d3a548]/30">
      {events.map((event) => {
        const Icon = getEventIcon(event.type);

        return (
          <div key={event.id} className="relative flex items-start gap-4 sm:gap-6">
            {/* Timeline Node Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#101314] border-2 border-[#d3a548] text-[#f7d46d] shadow-lg z-10">
              <Icon className="h-5 w-5" />
            </div>

            {/* Event Card Content */}
            <div className="flex flex-1 flex-col gap-2 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] hover:border-[#d3a548]/40 transition-all duration-200 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-[#f1ede5]">
                    {event.title}
                  </h3>
                  {event.documentNumber && (
                    <span className="font-mono text-xs text-[#8a9092] bg-[#15191a] px-2 py-0.5 rounded-[6px] border border-white/[0.04]">
                      {event.documentNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {event.badgeText && (
                    <Badge variant={event.badgeVariant || "gold"} className="text-[11px]">
                      {event.badgeText}
                    </Badge>
                  )}
                  <span className="font-mono text-[12px] text-[#8a9092]">
                    {event.date}
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold text-[#f7d46d]">
                {event.subtitle}
              </span>

              <p className="text-xs text-[#a9adae] leading-relaxed">
                {event.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-1 border-t border-white/[0.04] text-[12px] text-[#8a9092]">
                <span>
                  Responsável: <strong className="text-[#f1ede5]">{event.actorName}</strong>
                </span>

                {event.linkHref && (
                  <Link
                    href={event.linkHref}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-semibold text-[#d3a548] hover:underline"
                  >
                    <span>Consultar Documento</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
