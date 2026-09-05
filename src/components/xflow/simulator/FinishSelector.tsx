"use client";

import React from "react";
import { FinishPreset } from "@/domains/intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Tag } from "lucide-react";

interface FinishSelectorProps {
  presets: FinishPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: FinishPreset) => void;
}

export function FinishSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
}: FinishSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {presets.map((preset) => {
        const isSelected = preset.id === selectedPresetId;

        return (
          <div
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              isSelected
                ? "bg-[#141b17] border-[#d3a548] shadow-[0_0_20px_rgba(211,165,72,0.15)] ring-1 ring-[#d3a548]"
                : "bg-[#101314] border-white/[0.06] hover:border-white/[0.15]"
            }`}
          >
            {/* Color Swatch & Title */}
            <div className="flex items-start gap-3">
              <div
                style={{ backgroundColor: preset.colorHex }}
                className="h-10 w-10 shrink-0 rounded-full border border-white/20 shadow-inner flex items-center justify-center"
              >
                {isSelected && (
                  <Check className="h-5 w-5 text-[#f1ede5] drop-shadow-md" />
                )}
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-sm text-[#f1ede5]">
                  {preset.name}
                </span>
                <span className="text-[12px] text-[#a9adae]">
                  {preset.brand}
                </span>
              </div>
            </div>

            {/* Badges & Metrics */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-xs text-[#d3a548] font-bold">
                <Tag className="h-3.5 w-3.5" />
                <span>
                  {(preset.costPerMeterCents / 100).toLocaleString("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  })}
                  /m
                </span>
              </div>

              <Badge
                variant="outline"
                className="text-[11px] bg-white/[0.04] border-white/[0.1] text-[#a9adae] flex items-center gap-1"
              >
                <Shield className="h-3 w-3 text-[#68a46b]" />
                <span>{preset.warrantyYears} Anos Garantia</span>
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
