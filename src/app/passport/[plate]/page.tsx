"use client";

import React, { useState } from "react";
import {
  Share2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/xflow/Logo";
import { PassportBadgeRow } from "@/components/xflow/passport/PassportBadgeRow";
import { PassportTimelineView } from "@/components/xflow/passport/PassportTimelineView";
import { initialBMWPassport } from "@/lib/demo-data/finance-deliveries-data";

export default function VehiclePassportPublicPage() {
  const [copied, setCopied] = useState(false);

  const passport = initialBMWPassport;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Public Header */}
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
              <span>{copied ? "Link Copiado!" : "Partilhar Passaporte"}</span>
            </Button>
          </div>
        </header>

        {/* Hero Passport Header Card */}
        <div className="relative p-8 rounded-[24px] bg-gradient-to-b from-[#14191b] to-[#0c0f10] border-2 border-[#d3a548]/40 shadow-[0_20px_60px_rgba(211,165,72,0.15)] flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {/* Metallic Plate */}
                <div className="inline-flex items-center rounded-[6px] border border-white/30 bg-[#080a0b] px-3.5 py-1 font-mono font-black text-base text-[#f1ede5] shadow-lg">
                  <span className="text-[#6e93b5] mr-1.5 text-xs font-sans">P</span>
                  <span>{passport.plate}</span>
                </div>

                <Badge variant="gold" className="text-xs">
                  Passaporte Digital Certificado
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#f1ede5] mt-1">
                {passport.make} {passport.model} ({passport.generationYear})
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#a9adae]">
                <span>Cor: <strong className="text-[#f1ede5]">{passport.colorName}</strong></span>
                <span>·</span>
                <span className="font-mono">VIN: {passport.vin}</span>
                <span>·</span>
                <span>Odómetro: <strong className="text-[#f7d46d] font-mono">{passport.currentMileage.toLocaleString("pt-PT")} km</strong></span>
              </div>
            </div>

            {/* Current Owner Badge */}
            <div className="flex flex-col sm:items-end p-3.5 rounded-[14px] bg-[#050606]/80 border border-white/[0.04] text-xs">
              <span className="text-[#8a9092]">Proprietário Registado:</span>
              <strong className="text-sm text-[#f1ede5] mt-0.5">
                {passport.ownerName}
              </strong>
              <span className="text-[11px] text-[#68a46b] mt-0.5">
                ✓ Registo Validado na Oficina
              </span>
            </div>
          </div>

          {/* Row of Security Badges */}
          <PassportBadgeRow />
        </div>

        {/* 360-Degree Lifecycle Timeline Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                Rastreabilidade Imutável de Fábrica
              </span>
              <h2 className="text-xl font-bold text-[#f1ede5]">
                Linha Temporal de Vida do Veículo (7 Marcos)
              </h2>
            </div>
            <span className="text-xs text-[#8a9092] font-mono">
              7/7 Marcos Validados
            </span>
          </div>

          <PassportTimelineView events={passport.events} />
        </div>

        {/* Footer Seal */}
        <div className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#a9adae]">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[#d3a548]" />
            <div className="flex flex-col">
              <span className="font-bold text-[#f1ede5]">
                Registo Criptograficamente Seguro & Auditável
              </span>
              <span className="text-[12px] text-[#8a9092]">
                Todos os registos fotográficos, ordens de trabalho e certificados de garantia são permanentes.
              </span>
            </div>
          </div>

          <span className="font-mono text-[12px] text-[#d3a548] shrink-0 font-bold">
            X-FLOW CERTIFIED V1.0
          </span>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-2 pt-4 pb-12 text-xs text-[#8a9092] text-center">
          <span>X-Motion Performance Detailing · Barcelos, Portugal</span>
        </footer>
      </div>
    </div>
  );
}
