"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Car,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import { VehicleDamageMapper } from "@/components/xflow/checkins/VehicleDamageMapper";
import { PhotoInspectionGrid } from "@/components/xflow/checkins/PhotoInspectionGrid";
import { initialCheckinsData } from "@/lib/demo-data/checkins-data";

export default function PublicCheckinReportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [checkins] = useState(initialCheckinsData);
  const checkin = checkins.find((c) => c.token === token) || checkins[0];

  if (!checkin) {
    return (
      <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center justify-center p-6 text-center">
        <Logo variant="full" className="mb-6" />
        <h1 className="text-2xl font-bold text-[#f1ede5]">Relatório de Check-in não encontrado</h1>
        <p className="text-xs text-[#a9adae] mt-2 max-w-sm">
          Por favor, contacta a X-Motion para obter um novo link seguro de receção.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Public Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-[#a9adae]">Certificado de Receção Oficial</span>
            <span className="font-mono font-bold text-sm text-[#f7d46d]">
              CHK-{checkin.vehiclePlate.replace(/-/g, "")}
            </span>
          </div>
        </header>

        {/* Hero Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#15191a] border border-white/[0.08] text-[#d3a548]">
              <Car className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#8a9092]">Viatura rececionada para:</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f1ede5]">
                {checkin.customerName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#a9adae]">
                {/* Plate Badge */}
                <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono font-bold text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                  <span>{checkin.vehiclePlate}</span>
                </div>
                <span className="font-semibold text-[#f1ede5]">{checkin.vehicleModel} ({checkin.vehicleYear})</span>
                <span>·</span>
                <span>{checkin.vehicleColor}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end">
            <div className="flex items-center gap-1.5 text-xs text-[#68a46b] font-bold bg-[#68a46b]/10 px-3 py-1 rounded-full border border-[#68a46b]/20">
              <ShieldCheck className="h-4 w-4" />
              <span>Receção Validada & Tejadilho Inspecionado</span>
            </div>
            <span className="text-[12px] text-[#8a9092] mt-2">
              Entrada em: {checkin.createdAt} por {checkin.technicianName}
            </span>
          </div>
        </div>

        {/* Reception Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#101314] border border-white/[0.08] flex flex-col gap-1">
            <span className="text-xs text-[#a9adae]">Quilometragem de Entrada</span>
            <span className="text-2xl font-black text-[#f1ede5] font-mono tabular-nums">
              {checkin.mileage.toLocaleString("pt-PT")} km
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#101314] border border-white/[0.08] flex flex-col gap-1">
            <span className="text-xs text-[#a9adae]">Nível de Combustível</span>
            <span className="text-2xl font-black text-[#f7d46d]">
              {checkin.fuelLevel === "full"
                ? "100% Cheio"
                : checkin.fuelLevel === "three_quarters"
                ? "3/4 Depósito"
                : "1/2 Depósito"}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#101314] border border-white/[0.08] flex flex-col gap-1">
            <span className="text-xs text-[#a9adae]">Danos Pré-existentes</span>
            <span className="text-2xl font-black text-[#f1ede5]">
              {checkin.damages.length} Identificados
            </span>
          </div>
        </div>

        {/* 2D Damage Mapper */}
        <div className="p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] flex flex-col gap-4">
          <h3 className="font-bold text-base text-[#f1ede5]">
            Mapeamento de Danos e Estado da Pintura
          </h3>
          <VehicleDamageMapper
            damages={checkin.damages}
            onChangeDamages={() => {}}
            isReadOnly={true}
          />
        </div>

        {/* High-res Photos Grid */}
        <div className="p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] flex flex-col gap-4">
          <h3 className="font-bold text-base text-[#f1ede5]">
            Galeria Fotográfica de Entrada
          </h3>
          <PhotoInspectionGrid
            photos={checkin.photos}
            onChangePhotos={() => {}}
            isReadOnly={true}
          />
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-12 border-t border-white/[0.06] text-xs text-[#8a9092]">
          <span>X-Motion Performance Detailing & PPF · Ficha Certificada de Entrada</span>
          <a
            href="https://wa.me/351912345678"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <MessageCircle className="h-4 w-4 text-[#68a46b]" />
              <span>Contactar Oficina</span>
            </Button>
          </a>
        </footer>
      </div>
    </div>
  );
}
