"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VehicleDamageMapper } from "@/components/xflow/checkins/VehicleDamageMapper";
import { Checkin } from "@/domains/checkins/types";
import { PhotoInspectionGrid } from "@/components/xflow/checkins/PhotoInspectionGrid";

export function CheckinDetailView({ checkin }: { checkin: Checkin }) {

  const [copied, setCopied] = useState(false);


  const handleCopyLink = () => {
    const url = `${window.location.origin}/checkins/report/${checkin.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/checkins"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Check-ins</span>
        </Link>
      </div>

      {/* Copy Alert Toast */}
      {copied && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-[12px] bg-[#1b2021] border border-[#d3a548] text-xs font-semibold text-[#f7d46d] shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          <span>Link do relatório copiado para a área de transferência!</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono text-sm font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1.5 text-[11px] font-sans">P</span>
              <span>{checkin.vehiclePlate}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              {checkin.vehicleModel} ({checkin.vehicleYear})
            </h1>
            <Badge variant="success" className="text-xs">
              Check-in de Entrada Concluído
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <span>Cliente: <strong className="text-[#f1ede5]">{checkin.customerName}</strong></span>
            <span>·</span>
            <span>Técnico Responsável: <strong className="text-[#f1ede5]">{checkin.technicianName}</strong></span>
            <span>·</span>
            <span>Data: {checkin.createdAt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="bg-[#15191a]">
            <Share2 className="h-4 w-4 text-[#d3a548]" />
            <span>Partilhar WhatsApp</span>
          </Button>

          <Link href={`/checkins/report/${checkin.token}`} target="_blank">
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <ExternalLink className="h-4 w-4 text-[#d3a548]" />
              <span>Ver como Cliente</span>
            </Button>
          </Link>

          <Link href="/production">
            <Button variant="primary" size="sm">
              <FileCheck className="h-4 w-4" />
              <span>Ver Ordem de Trabalho</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Details, Damages, Photos & Signature */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Damages Silhouette & Photos */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Damages 2D Blueprint */}
          <Card className="p-5 flex flex-col gap-3">
            <h2 className="text-base font-bold text-[#f1ede5]">
              Registo de Danos Pré-existentes na Receção
            </h2>
            <VehicleDamageMapper
              damages={checkin.damages}
              onChangeDamages={() => {}}
              isReadOnly={true}
            />
          </Card>

          {/* Photos Grid */}
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Galeria Fotográfica de Entrada ({checkin.photos.length})
              </h2>
              {checkin.hasRoofPhoto && (
                <div className="flex items-center gap-1.5 text-xs text-[#68a46b] font-semibold bg-[#68a46b]/10 px-2.5 py-1 rounded-full border border-[#68a46b]/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Tejadilho Inspecionado e Aprovado</span>
                </div>
              )}
            </div>

            <PhotoInspectionGrid
              photos={checkin.photos}
              onChangePhotos={() => {}}
              isReadOnly={true}
            />
          </Card>
        </div>

        {/* Right Column: Reception Data, Belongings & Signature */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Odometer & Fuel */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Dados de Receção
            </span>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Quilometragem (Odómetro)</span>
                <span className="font-bold text-[#f1ede5] tabular-nums font-mono">
                  {checkin.mileage.toLocaleString("pt-PT")} km
                </span>
              </div>

              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Nível de Combustível</span>
                <span className="font-semibold text-[#f1ede5]">
                  {checkin.fuelLevel === "full"
                    ? "100% Cheio"
                    : checkin.fuelLevel === "three_quarters"
                    ? "3/4 Depósito"
                    : "1/2 Depósito"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Estado de Limpeza</span>
                <span className="font-semibold text-[#f1ede5] capitalize">
                  {checkin.cleanlinessStatus === "clean" ? "Limpa" : checkin.cleanlinessStatus}
                </span>
              </div>
            </div>
          </Card>

          {/* Belongings List */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Pertences a Bordo ({checkin.belongings.filter((b) => b.isPresent).length})
            </span>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
              {checkin.belongings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2 rounded-[8px] bg-[#15191a] text-xs text-[#f1ede5]"
                >
                  <span>{b.itemName}</span>
                  <Badge variant={b.isPresent ? "success" : "outline"} className="text-[11px]">
                    {b.isPresent ? "Presente" : "Não a bordo"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Signature Box */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Validação & Assinatura
            </span>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Assinado por:</span>
                <span className="font-bold text-[#f1ede5]">{checkin.signedByName}</span>
              </div>
              <div className="flex items-center justify-between text-[#8a9092]">
                <span>Data e Hora:</span>
                <span>{checkin.completedAt}</span>
              </div>

              <div className="mt-2 p-3 rounded-[10px] bg-[#0c0f10] border border-white/[0.06] text-center font-mono text-xs text-[#d3a548]">
                Assinatura Digital Validada em Ficha Oficial
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
