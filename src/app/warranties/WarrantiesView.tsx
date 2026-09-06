"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface WarrantyRecord {
  id: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerName: string;
  serviceName: string;
  materialUsed: string;
  batchNumber: string;
  yearsWarranty: number;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string;
  status: "active" | "pending_qc" | "expired";
}



export function WarrantiesView({ initialWarranties }: { initialWarranties: WarrantyRecord[] }) {
  const [warranties] = useState<WarrantyRecord[]>(initialWarranties);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = warranties.filter(
    (w) =>
      w.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Garantias & Certificados de Qualidade
          </h1>
          <p className="text-xs text-[#a9adae]">
            Registo oficial de conformidade técnica, lotes de película e garantias de fábrica emitidas pós-QC.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Garantias Ativas</span>
            <Award className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {warranties.length} Viaturas
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
              100% de conformidade com QC
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
              8.3 Anos
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Proteção contra amarelecimento e descolamento
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Taxa de Reclamação</span>
            <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              0.0%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Zero retrabalhos pós-entrega
            </span>
          </div>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por matrícula, modelo, cliente ou nº de certificado..."
          className="h-10 w-full pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
        />
      </div>

      {/* Warranties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <Card
            key={w.id}
            className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
          >
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                  <span>{w.vehiclePlate}</span>
                </div>

                <Badge variant="success" className="text-[11px]">
                  {w.yearsWarranty} Anos de Garantia
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#f1ede5]">
                  {w.vehicleModel}
                </h3>
                <span className="text-xs text-[#a9adae]">
                  {w.customerName}
                </span>
              </div>

              {/* Technical Details */}
              <div className="flex flex-col gap-1 p-3 rounded-sm bg-[#15191a] border border-white/[0.03] text-xs">
                <span className="text-[#a9adae]">Película: <strong className="text-[#f1ede5]">{w.materialUsed}</strong></span>
                <span className="text-[12px] text-[#8a9092] font-mono">Lote: {w.batchNumber}</span>
                <span className="text-[12px] text-[#d3a548] font-mono font-bold mt-1">
                  Certificado: {w.certificateNumber}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04]">
              <span className="text-[11px] text-[#8a9092]">
                Válida até {w.expiresAt}
              </span>

              <Link href={`/qc/certificate/${w.certificateNumber}`} target="_blank">
                <Button variant="outline" size="sm" className="bg-[#15191a] text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver Certificado</span>
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
