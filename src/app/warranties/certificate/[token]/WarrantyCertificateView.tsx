"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import type { WarrantyCertificate } from "@/domains/finance/types";

interface WarrantyCertificateViewProps {
  warranty: WarrantyCertificate;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  if (!value) return "Data indisponível";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return DATE_FORMATTER.format(date);
}

function statusLabel(status: WarrantyCertificate["status"]): string {
  switch (status) {
    case "active":
      return "Certificado digital ativo e rastreável";
    case "expired":
      return "Certificado expirado";
    case "revoked":
      return "Certificado revogado";
  }
}

export function WarrantyCertificateView({ warranty }: WarrantyCertificateViewProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="print-light min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="no-print flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-[#101314] text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link Copiado" : "Partilhar Certificado"}</span>
            </Button>
            <span role="status" className="sr-only">
              {copied ? "Link do certificado copiado." : ""}
            </span>
          </div>
        </header>

        <div className="relative p-8 rounded-[24px] bg-gradient-to-b from-[#161c18] to-[#0c100e] border-2 border-[#68a46b]/40 shadow-[0_20px_60px_rgba(104,164,107,0.15)] flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#d3a548]/20 text-[#f7d46d] shadow-md border border-[#d3a548]/40">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#d3a548]">
                  Garantia Oficial X-Motion
                </span>
                <h1 className="text-2xl font-black text-[#f1ede5]">
                  Certificado de Garantia Digital
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#68a46b]/15 text-[#68a46b] border border-[#68a46b]/40 font-black text-sm">
              <ShieldCheck className="h-5 w-5" />
              <span>{warranty.warrantyYears} Anos de Cobertura</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-[#050606]/60 border border-white/[0.04] text-xs">
            <div className="flex flex-col">
              <span className="text-[#8a9092]">Viatura & Matrícula</span>
              <strong className="text-sm text-[#f1ede5] mt-0.5">
                {warranty.vehicleModel}
              </strong>
              <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] self-start mt-1">
                <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                <span>{warranty.vehiclePlate || "Sem matrícula"}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Película & Lote de Produção</span>
              <strong className="text-sm text-[#f7d46d] mt-0.5">
                {warranty.materialName}
              </strong>
              <span className="text-[12px] font-mono text-[#a9adae] mt-1">
                Lote: {warranty.batchNumber}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Período de Validade</span>
              <strong className="text-sm text-[#68a46b] mt-0.5">
                {formatDate(warranty.startsAt)} até {formatDate(warranty.expiresAt)}
              </strong>
              <span className="text-[11px] text-[#8a9092] mt-1">
                Registo de QC: {warranty.qcCertificateNumber}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-md bg-[#101314] border border-white/[0.04] text-xs text-[#a9adae] leading-relaxed">
            <strong className="text-[#f1ede5] block mb-1">Termos de Cobertura da Garantia:</strong>
            {warranty.termsText || "Sem termos registados para esta garantia."}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Guia de Cuidados & Manutenção Pós-Aplicação:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {warranty.maintenanceRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-md bg-[#101314] border border-white/[0.04] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-[#f1ede5] text-xs">{rule.title}</strong>
                    {rule.isCritical && (
                      <span className="text-[11px] uppercase font-black text-[#f05a50] bg-[#3a1515] px-1.5 py-0.5 rounded">
                        Importante
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#a9adae] leading-relaxed mt-0.5">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs text-[#a9adae]">
            <span>Certificado emitido por X-Motion Performance Detailing Center</span>
            <div className="p-2.5 rounded-sm bg-[#0c0f10] border border-[#68a46b]/40 font-mono text-[12px] text-[#68a46b] font-bold text-center uppercase">
              {statusLabel(warranty.status)}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-center gap-2 pt-6 pb-12 text-xs text-[#8a9092] text-center">
          <span>X-Flow by X-Motion · Operating System Automóvel · Barcelos, Portugal</span>
        </footer>
      </div>
    </div>
  );
}
