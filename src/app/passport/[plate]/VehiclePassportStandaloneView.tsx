"use client";

import React, { useState } from "react";
import {
  Award,
  Camera,
  Fingerprint,
  Lock,
  Share2,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/xflow/Logo";
import { PassportTimelineView } from "@/components/xflow/passport/PassportTimelineView";
import { countPassportLifecycleMilestones } from "@/domains/finance/passport-builder";
import type { PassportFullRecord } from "@/domains/finance/types";

function formatDatePt(value: string): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function VehiclePassportStandaloneView({
  passport,
}: {
  passport: PassportFullRecord;
}) {
  const [copied, setCopied] = useState(false);

  const hasOwner =
    Boolean(passport.ownerName) &&
    passport.ownerName !== "Sem proprietário registado";
  const hasQc = passport.events.some((event) => event.type === "qc_pass");
  const hasWarranty =
    Boolean(passport.activeWarranty) ||
    passport.events.some((event) => event.type === "warranty");
  const hasCheckin = passport.events.some((event) => event.type === "checkin");
  const hasVin = passport.vin.trim().length > 0;
  const milestones = countPassportLifecycleMilestones(passport.events);

  const badges = [
    {
      icon: User,
      title: hasOwner ? "Proprietário registado" : "Sem proprietário",
      desc: hasOwner ? passport.ownerName : "Sem proprietário associado",
      color: hasOwner
        ? "from-[#1a3822] to-[#0f1f14] text-[#68a46b] border-[#68a46b]/40"
        : "from-[#1a2228] to-[#0f1418] text-[#8a9092] border-white/15",
    },
    {
      icon: ShieldCheck,
      title: hasQc ? "QC aprovado" : "Sem QC registado",
      desc: hasQc ? "Certificado de qualidade emitido" : "Sem inspeção aprovada",
      color: hasQc
        ? "from-[#1a3822] to-[#0f1f14] text-[#68a46b] border-[#68a46b]/40"
        : "from-[#1a2228] to-[#0f1418] text-[#8a9092] border-white/15",
    },
    {
      icon: Award,
      title: passport.activeWarranty
        ? `Garantia ${passport.activeWarranty.warrantyYears} anos`
        : hasWarranty
          ? "Garantia registada"
          : "Sem garantia ativa",
      desc: passport.activeWarranty
        ? `Até ${formatDatePt(passport.activeWarranty.expiresAt)}`
        : hasWarranty
          ? "Certificado emitido"
          : "Sem garantia registada",
      color: hasWarranty
        ? "from-[#382d14] to-[#1f190a] text-[#f7d46d] border-[#d3a548]/40"
        : "from-[#1a2228] to-[#0f1418] text-[#8a9092] border-white/15",
    },
    {
      icon: Fingerprint,
      title: hasVin ? "VIN registado" : "VIN não registado",
      desc: hasVin ? passport.vin : "Não disponível",
      color: "from-[#1a2228] to-[#0f1418] text-[#86abcf] border-[#6e93b5]/40",
    },
    {
      icon: Camera,
      title: hasCheckin ? "Check-in registado" : "Sem check-in",
      desc: hasCheckin ? "Inspeção fotográfica registada" : "Sem registos fotográficos",
      color: hasCheckin
        ? "from-[#1a3822] to-[#0f1f14] text-[#68a46b] border-[#68a46b]/40"
        : "from-[#1a2228] to-[#0f1418] text-[#8a9092] border-white/15",
    },
  ];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-[#101314] text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link copiado" : "Partilhar passaporte"}</span>
            </Button>
          </div>
        </header>
        <p role="status" className="sr-only">
          {copied ? "Link do passaporte copiado." : ""}
        </p>

        {/* Hero */}
        <div className="relative p-8 rounded-[24px] bg-gradient-to-b from-[#14191b] to-[#0c0f10] border-2 border-[#d3a548]/40 shadow-[0_20px_60px_rgba(211,165,72,0.15)] flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-[6px] border border-white/30 bg-[#080a0b] px-3.5 py-1 font-mono font-black text-base text-[#f1ede5] shadow-lg">
                  <span className="text-[#6e93b5] mr-1.5 text-xs font-sans">P</span>
                  <span>{passport.plate}</span>
                </div>

                <Badge variant="gold" className="text-xs">
                  Passaporte Digital
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#f1ede5] mt-1">
                {passport.make} {passport.model} ({passport.generationYear})
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#a9adae]">
                <span>
                  Cor: <strong className="text-[#f1ede5]">{passport.colorName}</strong>
                </span>
                <span>·</span>
                <span className="font-mono">VIN: {passport.vin || "Não registado"}</span>
                <span>·</span>
                <span>
                  Odómetro:{" "}
                  <strong className="text-[#f7d46d] font-mono">
                    {passport.currentMileage > 0
                      ? `${passport.currentMileage.toLocaleString("pt-PT")} km`
                      : "Não registado"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end p-3.5 rounded-md bg-[#050606]/80 border border-white/[0.04] text-xs">
              <span className="text-[#8a9092]">Proprietário registado:</span>
              <strong className="text-sm text-[#f1ede5] mt-0.5">
                {hasOwner ? passport.ownerName : "Sem proprietário associado"}
              </strong>
              <span
                className={`text-[11px] mt-0.5 ${
                  hasOwner ? "text-[#68a46b]" : "text-[#8a9092]"
                }`}
              >
                {hasOwner ? "Associação atual registada" : "Sem associação atual"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.title}
                  className={`flex flex-col items-center text-center p-3.5 rounded-lg bg-gradient-to-b ${badge.color} border shadow-lg`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] mb-1.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs leading-tight text-[#f1ede5]">
                    {badge.title}
                  </span>
                  <span className="text-[11px] text-[#a9adae] mt-0.5 break-all">
                    {badge.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                Rastreabilidade registada
              </span>
              <h2 className="text-xl font-bold text-[#f1ede5]">
                Linha Temporal de Vida do Veículo
              </h2>
            </div>
            <span className="text-xs text-[#8a9092] font-mono">
              {milestones.completedMilestonesCount}/7 marcos registados
            </span>
          </div>

          {passport.events.length === 0 ? (
            <div className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.08]">
              <p className="text-sm font-semibold text-[#f1ede5]">
                Sem eventos registados para esta viatura.
              </p>
              <p className="text-xs text-[#a9adae] mt-1">
                Check-ins, orçamentos, produção, QC, faturas e garantias aparecem
                aqui quando forem registados nesta organização.
              </p>
            </div>
          ) : (
            <PassportTimelineView events={passport.events} />
          )}
        </div>

        {/* Footer seal */}
        <div className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#a9adae]">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[#d3a548]" />
            <div className="flex flex-col">
              <span className="font-bold text-[#f1ede5]">
                Registo digital auditável
              </span>
              <span className="text-[12px] text-[#8a9092]">
                Os eventos apresentados correspondem aos registos existentes na
                base de dados desta organização.
              </span>
            </div>
          </div>

          <span className="font-mono text-[12px] text-[#d3a548] shrink-0 font-bold">
            X-FLOW · REGISTO DIGITAL
          </span>
        </div>

        <footer className="flex items-center justify-center gap-2 pt-4 pb-12 text-xs text-[#8a9092] text-center">
          <span>X-Motion Performance Detailing · Barcelos, Portugal</span>
        </footer>
      </div>
    </div>
  );
}
