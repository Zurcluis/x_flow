import React from "react";
import Link from "next/link";
import { ArrowRight, Car } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkOrderItem {
  id: string;
  vehicle: string;
  service: string;
  status: "Em Curso" | "A Guardar Peças" | "Concluído";
  technician: string;
  startTime: string;
  progress: number;
}

interface ActiveWorksCardProps {
  works: WorkOrderItem[];
}

export function ActiveWorksCard({ works }: ActiveWorksCardProps) {
  return (
    <Card className="flex flex-col justify-between bg-[#101314] border border-white/[0.08] p-5 h-full">
      <div>
        <CardHeader className="p-0 pb-4">
          <CardTitle>
            Trabalhos em Curso
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-3.5">
          {works.map((work) => (
            <div
              key={work.id}
              className="flex items-center justify-between gap-3 p-3 rounded-md bg-[#15191a] border border-white/[0.04] hover:border-white/10 transition-colors"
            >
              {/* Vehicle info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white/[0.03] border border-white/[0.06] text-[#a9adae]">
                  <Car className="h-4 w-4 stroke-[1.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-[#f1ede5] whitespace-nowrap">
                      {work.vehicle}
                    </span>
                    <Badge
                      variant={
                        work.status === "Em Curso"
                          ? "in_progress"
                          : work.status === "A Guardar Peças"
                          ? "waiting_parts"
                          : "success"
                      }
                      className="text-[11px] px-1.5 py-0 h-4 shrink-0"
                    >
                      {work.status}
                    </Badge>
                  </div>
                  <span className="text-[12px] text-[#a9adae] truncate">
                    {work.service}
                  </span>
                </div>
              </div>

              {/* Technician & Progress */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Tech info */}
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-[#f1ede5] border border-white/10">
                    {work.technician
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[12px] font-medium text-[#f1ede5] leading-tight">
                      {work.technician}
                    </span>
                    <span className="text-[11px] text-[#8a9092] leading-tight">
                      {work.startTime}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1.5 w-20">
                  <div className="relative h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] transition-all duration-500"
                      style={{ width: `${work.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#f1ede5] tabular-nums w-6 text-right">
                    {work.progress}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </div>

      {/* Bottom Link */}
      <Link
        href="/production"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] transition-colors mt-4 pt-3 border-t border-white/[0.04] group"
      >
        <span>Ver todos os trabalhos</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}
