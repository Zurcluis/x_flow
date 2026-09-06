import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BaseKpiCardProps {
  title: string;
  value: number | string;
  label?: string;
  linkText: string;
  href: string;
  className?: string;
  isDanger?: boolean;
}

export function KpiCard({
  title,
  value,
  label,
  linkText,
  href,
  className,
  isDanger = false,
  children,
}: BaseKpiCardProps & { children?: React.ReactNode }) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/15 transition-all duration-200 group relative min-h-[148px]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae] tracking-wide">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={cn(
                "text-3xl lg:text-4xl font-bold tracking-tight tabular-nums",
                isDanger ? "text-[#f05a50]" : "text-[#f1ede5]"
              )}
            >
              {value}
            </span>
            {label && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isDanger ? "text-[#f05a50]/80" : "text-[#8a9092]"
                )}
              >
                {label}
              </span>
            )}
          </div>
        </div>

        {/* Visual Graphic Element */}
        <div className="shrink-0">{children}</div>
      </div>

      {/* Bottom Link */}
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] transition-colors mt-3 pt-2 border-t border-white/[0.03] group-hover:underline"
      >
        <span>{linkText}</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}

/* Specific Graphic Components for the KPI Cards */

export function VehicleRenderSilhouette() {
  return (
    <svg
      viewBox="0 0 140 70"
      className="w-24 h-12 text-[#d3a548] opacity-80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Viatura"
    >
      <path
        d="M10 48 C 20 48, 25 35, 45 28 C 60 22, 90 22, 105 28 C 120 33, 128 42, 134 48 C 138 52, 135 56, 125 56 L 15 56 C 8 56, 5 52, 10 48 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="35" cy="52" r="7" fill="#080a0b" stroke="currentColor" strokeWidth="2" />
      <circle cx="108" cy="52" r="7" fill="#080a0b" stroke="currentColor" strokeWidth="2" />
      {/* Front Light */}
      <path d="M124 38 L134 43" stroke="#f7d46d" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CoveredCarSilhouette() {
  return (
    <svg
      viewBox="0 0 140 70"
      className="w-24 h-12 text-[#a9adae] opacity-70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Viatura Pronta para Entrega"
    >
      <path
        d="M12 55 C 18 45, 28 30, 50 25 C 70 20, 95 20, 110 26 C 125 32, 132 45, 135 55 Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <path d="M8 55 L138 55" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CapacityRing({ percentage }: { percentage: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 54 54">
        <circle
          cx="27"
          cy="27"
          r={radius}
          fill="none"
          stroke="#1b2021"
          strokeWidth="4.5"
        />
        <circle
          cx="27"
          cy="27"
          r={radius}
          fill="none"
          stroke="url(#cap-gold)"
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="cap-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7d46d" />
            <stop offset="100%" stopColor="#d3a548" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function PendingQuotesIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.08] text-[#f1ede5]">
      <FileText className="h-5 w-5 stroke-[1.75] text-[#a9adae]" />
    </div>
  );
}

export function StockDangerIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#f05a50]/10 border border-[#f05a50]/20 text-[#f05a50]">
      <AlertTriangle className="h-6 w-6 stroke-[1.75]" />
    </div>
  );
}
