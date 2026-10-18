"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type WarrantyStatus = "active" | "expired" | "revoked";

export interface WarrantyRecord {
  id: string;
  token: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerName: string;
  serviceName: string;
  materialUsed: string;
  batchNumber: string;
  yearsWarranty: number;
  certificateNumber: string;
  qcCertificateNumber: string;
  issuedAt: string;
  expiresAt: string;
  status: WarrantyStatus;
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

function statusLabel(status: WarrantyStatus): string {
  switch (status) {
    case "active":
      return "Ativa";
    case "expired":
      return "Expirada";
    case "revoked":
      return "Revogada";
  }
}

function statusVariant(status: WarrantyStatus): "success" | "danger" | "outline" {
  if (status === "active") return "success";
  if (status === "revoked") return "danger";
  return "outline";
}

export function WarrantiesView({
  initialWarranties,
}: {
  initialWarranties: WarrantyRecord[];
}) {
  const [warranties] = useState<WarrantyRecord[]>(initialWarranties);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const filtered = warranties.filter(
    (w) =>
      w.vehiclePlate.toLowerCase().includes(normalizedSearch) ||
      w.vehicleModel.toLowerCase().includes(normalizedSearch) ||
      w.customerName.toLowerCase().includes(normalizedSearch) ||
      w.certificateNumber.toLowerCase().includes(normalizedSearch) ||
      w.serviceName.toLowerCase().includes(normalizedSearch)
  );

  const activeCount = warranties.filter((w) => w.status === "active").length;
  const expiredCount = warranties.filter((w) => w.status === "expired").length;
  const averageYears =
    warranties.length > 0
      ? warranties.reduce((acc, w) => acc + w.yearsWarranty, 0) / warranties.length
      : 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Garantias & Certificados de Qualidade
          </h1>
          <p className="text-xs text-[#a9adae]">
            Registo de garantias emitidas após controlo de qualidade, com lote de material e certificado associado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Garantias Ativas</span>
            <Award className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {activeCount} Viaturas
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              {expiredCount} expiradas de {warranties.length} registos
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Garantia Média</span>
            <ShieldCheck className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              {averageYears.toFixed(1)} Anos
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Média das garantias registadas
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Certificados Emitidos</span>
            <CheckCircle2 className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {warranties.length}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Certificados digitais com link público
            </span>
          </div>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por matrícula, modelo, cliente ou n.º de certificado..."
          className="h-10 w-full pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
        />
      </div>

      <div role="status" className="sr-only">
        {filtered.length} garantias visíveis de {warranties.length}.
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <ShieldCheck className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            {warranties.length === 0
              ? "Ainda não existem garantias registadas"
              : "Nenhuma garantia corresponde à pesquisa"}
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            {warranties.length === 0
              ? "As garantias são criadas depois de uma ordem de trabalho aprovada em controlo de qualidade."
              : "Tenta ajustar os termos de pesquisa."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <Card
              key={w.id}
              className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5]">
                    <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                    <span>{w.vehiclePlate || "Sem matrícula"}</span>
                  </div>
                  <Badge variant={statusVariant(w.status)} className="text-[11px]">
                    {statusLabel(w.status)} · {w.yearsWarranty} anos
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#f1ede5]">
                    {w.vehicleModel}
                  </h3>
                  <span className="text-xs text-[#a9adae]">{w.customerName}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-sm bg-[#15191a] border border-white/[0.03] text-xs">
                  <span className="text-[#a9adae]">
                    Serviço: <strong className="text-[#f1ede5]">{w.serviceName}</strong>
                  </span>
                  <span className="text-[#a9adae]">
                    Película: <strong className="text-[#f1ede5]">{w.materialUsed}</strong>
                  </span>
                  <span className="text-[12px] text-[#8a9092] font-mono">
                    Lote: {w.batchNumber}
                  </span>
                  <span className="text-[12px] text-[#d3a548] font-mono font-bold mt-1">
                    Certificado: {w.certificateNumber}
                  </span>
                  <span className="text-[11px] text-[#8a9092]">
                    QC: {w.qcCertificateNumber}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-white/[0.04]">
                <span className="text-[11px] text-[#8a9092]">
                  Válida de {formatDate(w.issuedAt)} a {formatDate(w.expiresAt)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/warranties/${w.id}`}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Ver detalhe
                  </Link>
                  <Link
                    href={`/warranties/certificate/${w.token}`}
                    target="_blank"
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Certificado</span>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
