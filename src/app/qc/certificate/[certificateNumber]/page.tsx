"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Logo } from "@/components/xflow/Logo";
import { initialBMWQCInspection } from "@/lib/demo-data/production-phases-data";

export default function QCCertificatePage() {
  const params = useParams();
  const certNum = params?.certificateNumber as string;

  return (
    <div className="print-light min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Public Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-[#a9adae]">Certificado Oficial de Controlo de Qualidade</span>
            <span className="font-mono font-black text-sm text-[#f7d46d]">
              {certNum || "QC-2026-44TX88-PASS"}
            </span>
          </div>
        </header>

        {/* Hero Certificate Card */}
        <div className="relative p-8 rounded-[24px] bg-gradient-to-b from-[#141819] to-[#0c0f10] border-2 border-[#d3a548]/40 shadow-[0_20px_60px_rgba(211,165,72,0.15)] flex flex-col gap-6 overflow-hidden">
          {/* Top Gold Ribbon Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#d3a548]/20 text-[#f7d46d] shadow-md border border-[#d3a548]/40">
                <Award className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#d3a548]">
                  Certificação de Qualidade X-Motion
                </span>
                <h1 className="text-2xl font-black text-[#f1ede5]">
                  Certificado de Conformidade Técnica
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#68a46b]/15 text-[#68a46b] border border-[#68a46b]/30 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>QC 100% Aprovado</span>
            </div>
          </div>

          {/* Vehicle Presentation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-[#050606]/60 border border-white/[0.04] text-xs">
            <div className="flex flex-col">
              <span className="text-[#8a9092]">Viatura Certificada</span>
              <span className="font-bold text-sm text-[#f1ede5] mt-0.5">
                BMW M4 Competition Coupe
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Matrícula Oficial</span>
              <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] self-start mt-0.5">
                <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                <span>44-TX-88</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Película & Lote</span>
              <span className="font-bold text-[#f7d46d] mt-0.5">
                Stek DYNOshield Gloss
              </span>
              <span className="text-[11px] font-mono text-[#a9adae]">
                Lote: STEK-DS-2026-04
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Garantia de Fábrica</span>
              <span className="font-bold text-[#68a46b] mt-0.5">
                10 Anos de Garantia
              </span>
            </div>
          </div>

          {/* 10 Verified Points */}
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Inspeção de 10 Pontos Críticos Validada:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {initialBMWQCInspection.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[#15191a]/60 border border-white/[0.04]"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#68a46b]/20 text-[#68a46b]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[#f1ede5] font-medium text-[12px] truncate">
                    {item.criterionName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Stamp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs text-[#a9adae]">
            <div className="flex flex-col">
              <span>Inspeção realizada por:</span>
              <strong className="text-[#f1ede5]">João Martins (Lead Detailer & QC Manager)</strong>
              <span className="text-[11px] text-[#8a9092]">Data de Aprovação: 28 de Agosto de 2026</span>
            </div>

            <div className="p-3 rounded-[12px] bg-[#15191a] border border-[#d3a548]/30 font-mono text-[12px] text-[#f7d46d] text-center">
              CERTIFICADO DIGITAL VÁLIDO · X-MOTION PERFORMANCE
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-2 pt-6 pb-12 text-xs text-[#8a9092] text-center">
          <span>X-Motion Performance Detailing & PPF · Barcelos, Portugal</span>
        </footer>
      </div>
    </div>
  );
}
