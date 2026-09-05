import React from "react";
import Link from "next/link";
import { User, ArrowRight, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const swatchColor = COLOR_SWATCHES[vehicle.originalColorFamily] || "#52525b";

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150 group">
      <div>
        {/* Top bar: License Plate Badge & Body Type */}
        <div className="flex items-center justify-between gap-2">
          {/* Portuguese License Plate Style Badge */}
          <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-1 text-xs font-bold tracking-widest text-[#f1ede5] shadow-inner font-mono">
            <span className="text-[#6e93b5] mr-1.5 text-[11px] font-sans font-black">P</span>
            <span>{vehicle.plateDisplay}</span>
          </div>

          <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
            {vehicle.bodyType}
          </Badge>
        </div>

        {/* Vehicle Make, Model & Year */}
        <div className="mt-4">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="font-bold text-base text-[#f1ede5] hover:text-[#f7d46d] transition-colors line-clamp-1"
          >
            {vehicle.make} {vehicle.model}
          </Link>
          <span className="text-xs text-[#8a9092]">
            Ano {vehicle.generationYear} {vehicle.vin ? `· VIN: ...${vehicle.vin.slice(-6)}` : ""}
          </span>
        </div>

        {/* Color details */}
        <div className="flex items-center gap-2 mt-3 p-2 rounded-[8px] bg-[#15191a] border border-white/[0.04] text-xs">
          <div
            className="h-3.5 w-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
            style={{ backgroundColor: swatchColor }}
            title={vehicle.originalColorName}
          />
          <span className="text-xs text-[#a9adae] truncate">
            Cor Original: <strong className="text-[#f1ede5]">{vehicle.originalColorName}</strong>
          </span>
        </div>

        {/* Current Owner pill */}
        {vehicle.currentOwner && (
          <div className="flex items-center gap-2 mt-2.5 text-xs text-[#a9adae]">
            <User className="h-3.5 w-3.5 text-[#d3a548] shrink-0" />
            <span className="truncate">
              Proprietário:{" "}
              <Link
                href={`/customers/${vehicle.currentOwner.customerId}`}
                className="text-[#f1ede5] hover:text-[#f7d46d] hover:underline font-medium"
              >
                {vehicle.currentOwner.customerName}
              </Link>
            </span>
          </div>
        )}
      </div>

      {/* Footer: Mileage & Link to Passport */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/[0.04] text-xs">
        <div className="flex items-center gap-1.5 text-[#8a9092]">
          <Gauge className="h-3.5 w-3.5" />
          <span>
            {vehicle.currentMileage !== undefined
              ? `${formatNumber(vehicle.currentMileage)} km`
              : "Sem registo"}
          </span>
        </div>

        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[#d3a548] hover:text-[#f7d46d] transition-colors group-hover:translate-x-0.5"
        >
          <span>Passaporte</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
