"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  buildMonthlyCalendarMatrix,
  computeMonthlyPlanStats,
} from "@/domains/marketing/rules";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_STATUS_LABELS,
  type SocialFormat,
  type SocialPostRecord,
  type SocialPostStatus,
} from "@/domains/marketing/types";
import { cn } from "@/lib/utils";

interface MonthlyCalendarProps {
  posts: SocialPostRecord[];
  initialYear: number;
  initialMonthZeroBased: number;
  onSelectPost: (post: SocialPostRecord) => void;
  onCreateForDate: (dateKey: string) => void;
}

const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const FORMAT_PILL_CLASSES: Record<SocialFormat, string> = {
  reel: "border-[#d3a548]/45 bg-[#1f1b14] text-[#f7d46d]",
  carousel: "border-sky-400/35 bg-sky-950/50 text-sky-200",
  static: "border-zinc-500/40 bg-zinc-900/70 text-zinc-200",
  story: "border-purple-400/35 bg-purple-950/40 text-purple-200",
};

const STATUS_DOT_CLASSES: Record<SocialPostStatus, string> = {
  idea: "bg-zinc-400",
  production: "bg-sky-400",
  ready: "bg-emerald-400",
  scheduled: "bg-[#f7d46d]",
  published: "bg-white",
};

function FormatIcon({ format }: { format: SocialFormat }) {
  if (format === "reel") return <Film className="h-3 w-3 shrink-0" />;
  if (format === "carousel") return <Layers className="h-3 w-3 shrink-0" />;
  if (format === "story") return <MessageCircle className="h-3 w-3 shrink-0" />;
  return <ImageIcon className="h-3 w-3 shrink-0" />;
}

export function MonthlyCalendar({
  posts,
  initialYear,
  initialMonthZeroBased,
  onSelectPost,
  onCreateForDate,
}: MonthlyCalendarProps) {
  const [cursor, setCursor] = useState({
    year: initialYear,
    month: initialMonthZeroBased,
  });

  const cells = useMemo(
    () => buildMonthlyCalendarMatrix(cursor.year, cursor.month, posts),
    [cursor.year, cursor.month, posts]
  );

  const stats = useMemo(
    () => computeMonthlyPlanStats(posts, cursor.year, cursor.month),
    [posts, cursor.year, cursor.month]
  );

  const currentMonthCells = useMemo(
    () => cells.filter((c) => c.inCurrentMonth && c.posts.length > 0),
    [cells]
  );

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return {
        year: next.getUTCFullYear(),
        month: next.getUTCMonth(),
      };
    });
  };

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-white/[0.1] bg-[#0b0d0e] p-2 text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-[#f1ede5] min-w-[170px] text-center">
            {MONTH_NAMES_PT[cursor.month]} {cursor.year}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-white/[0.1] bg-[#0b0d0e] p-2 text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor({ year: 2026, month: 11 })}
            className="rounded-lg border border-[#d3a548]/30 bg-[#1f1b14] px-3 py-1.5 text-xs font-semibold text-[#f7d46d] hover:bg-[#2a2419] cursor-pointer"
          >
            Dez 2026
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#8a9092]">Peças no mês</p>
            <p className="text-base font-bold text-[#f1ede5]">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#8a9092]">Reels</p>
            <p className="text-base font-bold text-[#f7d46d]">{stats.byFormat.reel}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#8a9092]">Carrosséis</p>
            <p className="text-base font-bold text-sky-300">{stats.byFormat.carousel}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#8a9092]">Com CTA</p>
            <p className="text-base font-bold text-[#f1ede5]">{stats.withCtaCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#8a9092]">Autorizados</p>
            <p className="text-base font-bold text-emerald-300">{stats.withConsentCount}</p>
          </div>
        </div>
      </div>

      {/* Desktop 7-Column Matrix */}
      <div className="hidden md:block rounded-2xl border border-white/[0.08] bg-[#0b0d0e] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/[0.08] bg-[#080a0b]">
          {WEEKDAYS_PT.map((day) => (
            <div
              key={day}
              className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#8a9092]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => (
            <div
              key={cell.dateKey}
              className={cn(
                "min-h-[126px] border-r border-b border-white/[0.06] p-2 flex flex-col gap-1.5",
                cell.inCurrentMonth ? "bg-[#0b0d0e]" : "bg-[#060708] opacity-45"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#a9adae] tabular-nums">
                  {cell.dayNumber}
                </span>
                {cell.inCurrentMonth ? (
                  <button
                    type="button"
                    onClick={() => onCreateForDate(cell.dateKey)}
                    className="rounded p-1 text-[#8a9092] hover:bg-white/[0.06] hover:text-[#f7d46d] cursor-pointer"
                    aria-label={`Agendar publicação para ${cell.dateKey}`}
                    title={`Agendar para ${cell.dateKey}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="space-y-1">
                {cell.posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className={cn(
                      "w-full text-left rounded-md border px-2 py-1.5 text-[11px] transition-colors hover:brightness-110 cursor-pointer space-y-0.5",
                      FORMAT_PILL_CLASSES[post.format]
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <FormatIcon format={post.format} />
                        {SOCIAL_FORMAT_LABELS[post.format]}
                      </span>
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT_CLASSES[post.status])}
                        title={SOCIAL_STATUS_LABELS[post.status]}
                      />
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-tight text-[#f1ede5]">
                      {post.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Clean Agenda List */}
      <div className="md:hidden space-y-2.5">
        {currentMonthCells.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] p-5 text-center space-y-2">
            <p className="text-sm text-[#f1ede5]">Sem publicações agendadas neste mês.</p>
            <button
              type="button"
              onClick={() =>
                onCreateForDate(
                  `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-01`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#d3a548] px-3 py-2 text-xs font-semibold text-[#050606] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Agendar primeira publicação
            </button>
          </div>
        ) : (
          currentMonthCells.map((cell) => (
            <div
              key={cell.dateKey}
              className="rounded-xl border border-white/[0.08] bg-[#0b0d0e] p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f7d46d]">{cell.dateKey}</span>
                <button
                  type="button"
                  onClick={() => onCreateForDate(cell.dateKey)}
                  className="inline-flex items-center gap-1 text-xs text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {cell.posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className={cn(
                      "w-full text-left rounded-lg border p-2.5 space-y-1 cursor-pointer",
                      FORMAT_PILL_CLASSES[post.format]
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <FormatIcon format={post.format} />
                        {SOCIAL_FORMAT_LABELS[post.format]}
                        {post.scheduledTime ? ` · ${post.scheduledTime}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        {post.ownerConsent ? (
                          <ShieldCheck className="h-3 w-3 text-emerald-300" />
                        ) : null}
                        {SOCIAL_STATUS_LABELS[post.status]}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#f1ede5]">{post.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
