import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IntelligenceAlert {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  subtitle: string;
  href: string;
}

interface XFlowIntelligenceCardProps {
  alerts: IntelligenceAlert[];
}

export function XFlowIntelligenceCard({ alerts }: XFlowIntelligenceCardProps) {
  return (
    <Card className="flex flex-col justify-between bg-[#101314] border border-white/[0.08] p-5 h-full">
      <div>
        <CardHeader className="p-0 pb-4">
          <CardTitle>
            X-Flow Intelligence
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-3">
          {alerts.map((alert) => {
            const isDanger = alert.severity === "danger";

            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-md border transition-all duration-150 group",
                  isDanger
                    ? "bg-[#251515]/60 border-[#f05a50]/20 hover:border-[#f05a50]/40"
                    : "bg-[#1f1b14]/60 border-[#d3a548]/20 hover:border-[#d3a548]/40"
                )}
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm mt-0.5",
                      isDanger
                        ? "bg-[#f05a50]/15 text-[#f05a50]"
                        : "bg-[#d3a548]/15 text-[#f7d46d]"
                    )}
                  >
                    {isDanger ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#f1ede5] leading-snug line-clamp-2">
                      {alert.title}
                    </span>
                    <span
                      className={cn(
                        "text-[12px] mt-0.5",
                        isDanger ? "text-[#f05a50]/90" : "text-[#a9adae]"
                      )}
                    >
                      {alert.subtitle}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#8a9092] group-hover:text-[#f1ede5] transition-transform group-hover:translate-x-0.5 shrink-0" />
              </Link>
            );
          })}
        </CardContent>
      </div>

      {/* Bottom Link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] transition-colors mt-4 pt-3 border-t border-white/[0.04] group"
      >
        <span>Ver todos os alertas</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}
