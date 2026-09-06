"use client";

import React from "react";
import { Check } from "lucide-react";
import { MASTER_BODY_PARTS, PREDEFINED_PACKAGES } from "@/domains/catalog/parts-catalog";
import { VehicleBodyPart } from "@/domains/catalog/types";
import { formatCurrency } from "@/lib/formatting";

interface QuotePartsMatrixProps {
  selectedPartCodes: string[];
  onChangeParts: (codes: string[]) => void;
  segmentMultiplier?: number;
}

export function QuotePartsMatrix({
  selectedPartCodes,
  onChangeParts,
  segmentMultiplier = 1.0,
}: QuotePartsMatrixProps) {
  const togglePart = (code: string) => {
    if (selectedPartCodes.includes(code)) {
      onChangeParts(selectedPartCodes.filter((c) => c !== code));
    } else {
      onChangeParts([...selectedPartCodes, code]);
    }
  };

  const applyPackage = (pkgCodes: string[]) => {
    onChangeParts(pkgCodes);
  };

  const zones: { id: string; label: string; parts: VehicleBodyPart[] }[] = [
    {
      id: "front",
      label: "Zona Frontal",
      parts: MASTER_BODY_PARTS.filter((p) => p.category === "front"),
    },
    {
      id: "side",
      label: "Laterais & Pilares",
      parts: MASTER_BODY_PARTS.filter((p) => p.category === "side"),
    },
    {
      id: "roof_rear",
      label: "Tejadilho & Traseira",
      parts: MASTER_BODY_PARTS.filter((p) => p.category === "roof" || p.category === "rear"),
    },
    {
      id: "interior",
      label: "Soleiras & Interior",
      parts: MASTER_BODY_PARTS.filter((p) => p.category === "interior"),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Quick Package Selector Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#d3a548]">
          Atalhos de Pacotes Pré-configurados:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PREDEFINED_PACKAGES.map((pkg) => {
            const isMatch =
              pkg.partCodes.length === selectedPartCodes.length &&
              pkg.partCodes.every((c) => selectedPartCodes.includes(c));

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => applyPackage(pkg.partCodes)}
                className={`flex flex-col items-start p-3 rounded-md border text-left transition-all cursor-pointer ${
                  isMatch
                    ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d] shadow-sm"
                    : "bg-[#15191a] border-white/[0.06] text-[#a9adae] hover:border-white/20 hover:text-[#f1ede5]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">{pkg.name}</span>
                  {isMatch && <Check className="h-3.5 w-3.5 text-[#d3a548]" />}
                </div>
                <span className="text-[11px] text-[#8a9092] mt-1 line-clamp-1">
                  {pkg.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Matrix by Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex flex-col gap-2.5 p-4 rounded-lg bg-[#101314] border border-white/[0.06]"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
              {zone.label}
            </span>

            <div className="flex flex-col gap-1.5">
              {zone.parts.map((part) => {
                const isSelected = selectedPartCodes.includes(part.code);
                const estimatedPrice = Math.round(part.basePrice * segmentMultiplier);

                return (
                  <label
                    key={part.code}
                    onClick={() => togglePart(part.code)}
                    className={`flex items-center justify-between p-2.5 rounded-sm border transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#1f1b14]/70 border-[#d3a548]/50 text-[#f1ede5]"
                        : "bg-[#15191a]/40 border-white/[0.03] text-[#8a9092] hover:text-[#a9adae]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                          isSelected
                            ? "bg-[#d3a548] border-[#d3a548] text-[#050606]"
                            : "border-white/20 bg-[#080a0b]"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold ${isSelected ? "text-[#f1ede5]" : "text-[#a9adae]"}`}>
                          {part.namePt}
                        </span>
                        <span className="text-[11px] text-[#8a9092]">
                          {part.defaultAreaM2} m² · {part.baseLaborHours}h de aplicação
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#f7d46d] tabular-nums shrink-0">
                      {formatCurrency(estimatedPrice)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
