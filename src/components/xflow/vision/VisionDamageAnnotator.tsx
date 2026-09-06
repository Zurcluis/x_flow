"use client";

import React, { useState } from "react";
import { VisionDamageSuggestion } from "@/domains/intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, ShieldAlert } from "lucide-react";

interface VisionDamageAnnotatorProps {
  photoUrl: string;
  photoLabel: string;
  suggestions: VisionDamageSuggestion[];
  onUpdateStatus: (suggestionId: string, status: "confirmed" | "rejected") => void;
  isReadOnly?: boolean;
}

export function VisionDamageAnnotator({
  photoUrl,
  photoLabel,
  suggestions,
  onUpdateStatus,
  isReadOnly = false,
}: VisionDamageAnnotatorProps) {
  const [selectedDamageId, setSelectedDamageId] = useState<string | null>(
    suggestions[0]?.id || null
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Photo with Bounding Boxes Overlay */}
      <div className="relative w-full h-80 sm:h-96 rounded-lg overflow-hidden bg-[#080a0b] border border-white/[0.08] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={photoLabel}
          className="w-full h-full object-cover"
        />

        {/* Bounding Box Highlights */}
        {suggestions.map((item) => {
          const isSelected = item.id === selectedDamageId;
          const isConfirmed = item.status === "confirmed";
          const isRejected = item.status === "rejected";

          return (
            <div
              key={item.id}
              onClick={() => setSelectedDamageId(item.id)}
              style={{
                left: `${item.boundingBox.x}%`,
                top: `${item.boundingBox.y}%`,
                width: `${item.boundingBox.width}%`,
                height: `${item.boundingBox.height}%`,
              }}
              className={`absolute cursor-pointer transition-all rounded-[6px] border-2 flex items-start justify-end p-1 ${
                isSelected
                  ? "border-[#d3a548] bg-[#d3a548]/25 ring-2 ring-[#d3a548]/50 z-20"
                  : isConfirmed
                  ? "border-[#68a46b] bg-[#68a46b]/20 z-10"
                  : isRejected
                  ? "border-[#f05a50]/60 bg-[#f05a50]/10 opacity-50 z-0"
                  : "border-[#f7d46d] bg-[#f7d46d]/15 animate-pulse z-10"
              }`}
              title={`${item.bodyPart} - ${item.description}`}
            >
              <span className="text-[11px] font-mono font-bold px-1 rounded bg-[#050606]/80 text-[#f1ede5]">
                {Math.round(item.confidence * 100)}%
              </span>
            </div>
          );
        })}

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] text-xs font-bold text-[#f1ede5] flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-[#d3a548]" />
          <span>{photoLabel}</span>
          <span className="text-[#a9adae] font-normal">
            ({suggestions.length} anomalias detetadas por IA)
          </span>
        </div>
      </div>

      {/* Damage Findings Inspection Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((item) => {
          const isSelected = item.id === selectedDamageId;
          const isConfirmed = item.status === "confirmed";
          const isRejected = item.status === "rejected";

          return (
            <div
              key={item.id}
              onClick={() => setSelectedDamageId(item.id)}
              className={`p-4 rounded-md border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-[#141b17] border-[#d3a548] ring-1 ring-[#d3a548]/40"
                  : "bg-[#101314] border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#d3a548] shrink-0" />
                  <span className="font-bold text-xs text-[#f1ede5]">
                    {item.bodyPart}
                  </span>
                </div>

                <Badge
                  variant={isConfirmed ? "success" : isRejected ? "danger" : "gold"}
                  className="text-[11px] uppercase font-mono"
                >
                  {isConfirmed ? "Confirmado" : isRejected ? "Rejeitado" : `${Math.round(item.confidence * 100)}% Confiança`}
                </Badge>
              </div>

              <p className="text-xs text-[#a9adae] leading-relaxed">
                {item.description}
              </p>

              {!isReadOnly && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(item.id, "rejected");
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isRejected
                        ? "bg-[#f05a50]/20 text-[#f05a50] border border-[#f05a50]/40"
                        : "bg-white/[0.04] text-[#a9adae] hover:bg-white/[0.08]"
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Rejeitar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(item.id, "confirmed");
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isConfirmed
                        ? "bg-[#68a46b] text-[#050606]"
                        : "bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d]"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Confirmar Dano</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
