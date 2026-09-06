import React from "react";
import Link from "next/link";
import {
  Car,
  User,
  Camera,
  FileText,
  Calendar,
  Fuel,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/domains/vehicles/types";
import { formatNumber } from "@/lib/formatting";

const COLOR_SWATCHES: Record<string, string> = {
  white: "#f8f9fa",
  black: "#1a1a1a",
  grey: "#7a8288",
  silver: "#c5c9cc",
  blue: "#1e40af",
  red: "#b91c1c",
  green: "#15803d",
  yellow: "#eab308",
  orange: "#ea580c",
  other: "#52525b",
};

interface VehiclePassportHeroProps {
  vehicle: Vehicle;
}

export function VehiclePassportHero({ vehicle }: VehiclePassportHeroProps) {
  const swatchColor = COLOR_SWATCHES[vehicle.originalColorFamily] || "#52525b";

  return (
    <div className="flex flex-col gap-6 p-6 rounded-[20px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Top row: License plate, Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* License Plate Style Frame */}
          <div className="inline-flex items-center rounded-sm border-2 border-white/20 bg-[#050606] px-3.5 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.6)] font-mono">
            <span className="text-[#6e93b5] mr-2 text-xs font-black font-sans">P</span>
            <span className="text-xl font-black tracking-widest text-[#f1ede5]">
              {vehicle.plateDisplay}
            </span>
          </div>

          {/* Vehicle Make & Model Title */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold text-[#f1ede5] tracking-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            <span className="text-xs text-[#a9adae]">
              Ano {vehicle.generationYear} · VIN: {vehicle.vin || "Não registado"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/checkins/new?vehicleId=${vehicle.id}`}>
            <Button variant="primary" size="sm" className="h-9 px-3.5 text-xs">
              <Camera className="h-4 w-4" />
              <span>Novo Check-in</span>
            </Button>
          </Link>
          <Link href={`/quotes/new?vehicleId=${vehicle.id}`}>
            <Button variant="outline" size="sm" className="h-9 px-3.5 text-xs bg-[#101314]">
              <FileText className="h-4 w-4 text-[#d3a548]" />
              <span>Orçamento</span>
            </Button>
          </Link>
          <Link href={`/calendar/new?vehicleId=${vehicle.id}`}>
            <Button variant="outline" size="sm" className="h-9 px-3.5 text-xs bg-[#101314]">
              <Calendar className="h-4 w-4 text-[#d3a548]" />
              <span>Marcar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Specs & Current Owner Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-white/[0.06] text-xs">
        {/* 1. Cor Original */}
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#101314] border border-white/[0.04]">
          <div
            className="h-4 w-4 rounded-full border border-white/30 shrink-0 shadow-sm"
            style={{ backgroundColor: swatchColor }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8a9092] uppercase">Cor Original</span>
            <span className="font-semibold text-[#f1ede5] truncate">{vehicle.originalColorName}</span>
          </div>
        </div>

        {/* 2. Carroçaria */}
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#101314] border border-white/[0.04]">
          <Car className="h-4 w-4 text-[#d3a548] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8a9092] uppercase">Carroçaria</span>
            <span className="font-semibold text-[#f1ede5] capitalize truncate">{vehicle.bodyType}</span>
          </div>
        </div>

        {/* 3. Quilometragem */}
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#101314] border border-white/[0.04]">
          <Gauge className="h-4 w-4 text-[#d3a548] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8a9092] uppercase">Quilometragem</span>
            <span className="font-semibold text-[#f1ede5] tabular-nums truncate">
              {vehicle.currentMileage !== undefined ? `${formatNumber(vehicle.currentMileage)} km` : "N/D"}
            </span>
          </div>
        </div>

        {/* 4. Combustível */}
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#101314] border border-white/[0.04]">
          <Fuel className="h-4 w-4 text-[#d3a548] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8a9092] uppercase">Combustível</span>
            <span className="font-semibold text-[#f1ede5] capitalize truncate">{vehicle.fuelType || "Gasolina"}</span>
          </div>
        </div>

        {/* 5. Proprietário Atual */}
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#101314] border border-white/[0.04] col-span-2 sm:col-span-1">
          <User className="h-4 w-4 text-[#d3a548] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8a9092] uppercase">Proprietário</span>
            {vehicle.currentOwner ? (
              <Link
                href={`/customers/${vehicle.currentOwner.customerId}`}
                className="font-semibold text-[#f7d46d] hover:underline truncate"
              >
                {vehicle.currentOwner.customerName}
              </Link>
            ) : (
              <span className="text-[#8a9092]">Sem registo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
