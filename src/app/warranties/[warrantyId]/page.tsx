"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { initialWarrantiesData } from "@/lib/demo-data/finance-deliveries-data";

export default function WarrantyDetailPage() {
  const params = useParams();
  const warrantyId = params?.warrantyId as string;

  const [warranties] = useState(initialWarrantiesData);
  const warranty =
    warranties.find((w) => w.id === warrantyId) || warranties[0];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/warranties"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Garantias</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#d3a548]/15 text-[#f7d46d]">
              <Award className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              Garantia Oficial de Fábrica
            </h1>
            <Badge variant="gold" className="text-xs">
              {warranty.warrantyYears} Anos Ativa
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{warranty.vehiclePlate}</span>
            </div>
            <span className="font-bold text-[#f1ede5]">{warranty.vehicleModel}</span>
            <span>·</span>
            <span>Cliente: {warranty.customerName}</span>
            <span>·</span>
            <span>Válida até: {warranty.expiresAt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/warranties/certificate/${warranty.token}`}
            target="_blank"
          >
            <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-bold">
              <ExternalLink className="h-4 w-4" />
              <span>Certificado Público & Guia</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Terms & Care Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Material & Terms */}
        <Card className="lg:col-span-6 p-6 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              Material Aplicado & Termos
            </span>
            <span className="font-mono text-xs text-[#68a46b]">
              {warranty.status.toUpperCase()}
            </span>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#0c0f10] border border-white/[0.04] flex flex-col gap-1">
            <span className="text-[#8a9092]">Película Certificada:</span>
            <strong className="text-sm text-[#f1ede5]">{warranty.materialName}</strong>
            <span className="text-[12px] font-mono text-[#d3a548]">
              Lote de Produção: {warranty.batchNumber}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-[#a9adae]">Termos da Cobertura:</span>
            <p className="text-[#f1ede5] leading-relaxed p-3.5 rounded-[12px] bg-[#15191a] border border-white/[0.03]">
              {warranty.termsText}
            </p>
          </div>
        </Card>

        {/* Right: Maintenance Rules */}
        <Card className="lg:col-span-6 p-6 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              Guia de Cuidados Pós-Aplicação
            </span>
            <span className="text-[12px] text-[#8a9092]">
              {warranty.maintenanceRules.length} Regras
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {warranty.maintenanceRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-[12px] bg-[#15191a] border border-white/[0.03] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#f1ede5]">{rule.title}</strong>
                  {rule.isCritical && (
                    <span className="text-[11px] uppercase font-black text-[#f05a50] bg-[#3a1515] px-1.5 py-0.5 rounded">
                      Crítico
                    </span>
                  )}
                </div>
                <p className="text-[#a9adae] text-[12px] leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
