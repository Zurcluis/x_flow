import React from "react";
import { ArrowUp, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardBaseProps {
  title: string;
  value: string;
  change: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  change,
  subtitle,
  className,
  children,
}: MetricCardBaseProps) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] min-h-[140px]",
        className
      )}
    >
      <div>
        <span className="text-xs font-medium text-[#a9adae] tracking-wide">
          {title}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5] tabular-nums">
            {value}
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-full bg-[#68a46b]/15 px-2 py-0.5 text-xs font-semibold text-[#68a46b] border border-[#68a46b]/30">
            <ArrowUp className="h-3 w-3 stroke-[2.5]" />
            <span>{change}</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 mt-3">
        <span className="text-xs text-[#8a9092] font-medium">{subtitle}</span>
        <div className="shrink-0">{children}</div>
      </div>
    </Card>
  );
}

/* Custom SVG Smooth Wave Sparkline */
export function SparklineWave({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;

  const pts = data.map((val, idx) => ({
    x: (idx / (data.length - 1)) * (width - 10) + 5,
    y: height - ((val - min) / range) * (height - 12) - 6,
  }));

  // Build smooth bezier curve
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;
    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="gold-wave-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d3a548" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#f7d46d" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d3a548" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="url(#gold-wave-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Custom SVG Bar Chart */
export function BarChartSparkline({ data }: { data: number[] }) {
  if (!data) return null;
  const max = Math.max(...data, 100);
  const height = 36;
  const barWidth = 4;

  return (
    <div className="flex items-end gap-[3px] h-9" aria-hidden="true">
      {data.map((val, idx) => {
        const barHeight = Math.max(4, (val / max) * height);
        return (
          <div
            key={idx}
            className="rounded-t-[2px] bg-gradient-to-t from-[#d3a548]/70 to-[#f7d46d]"
            style={{ width: `${barWidth}px`, height: `${barHeight}px` }}
          />
        );
      })}
    </div>
  );
}

/* 5 Gold Stars Rating */
export function StarRating({ stars = 5 }: { stars?: number }) {
  return (
    <div className="flex items-center gap-1 text-[#d3a548]" aria-hidden="true">
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current stroke-none" />
      ))}
    </div>
  );
}
