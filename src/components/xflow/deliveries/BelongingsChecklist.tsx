"use client";

import React from "react";
import { Check, PackageCheck } from "lucide-react";
import { DeliveryCheckinBelonging } from "@/domains/finance/types";
import { Badge } from "@/components/ui/badge";

interface BelongingsChecklistProps {
  belongings: DeliveryCheckinBelonging[];
  onToggleBelonging: (id: string) => void;
  isReadOnly?: boolean;
}

export function BelongingsChecklist({
  belongings,
  onToggleBelonging,
  isReadOnly = false,
}: BelongingsChecklistProps) {
  const allReturned = belongings.every((b) => b.isReturned);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08]">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#d3a548]/15 text-[#f7d46d]">
            <PackageCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              Conferência de Pertences do Veículo
            </span>
            <span className="font-bold text-sm text-[#f1ede5]">
              Devolução de Chaves & Documentos
            </span>
          </div>
        </div>

        <Badge variant={allReturned ? "success" : "outline"} className="text-[11px]">
          {allReturned ? "100% Devolvido" : "Pendente de Conferência"}
        </Badge>
      </div>

      <p className="text-xs text-[#a9adae]">
        Confirma a entrega em mão de todos os objetos e chaves registados no momento da receção:
      </p>

      <div className="flex flex-col gap-2">
        {belongings.map((b) => (
          <label
            key={b.id}
            onClick={() => !isReadOnly && onToggleBelonging(b.id)}
            className={`flex items-center justify-between p-3 rounded-md border transition-all select-none ${
              isReadOnly ? "cursor-default" : "cursor-pointer"
            } ${
              b.isReturned
                ? "bg-[#141b17] border-[#68a46b]/40 text-[#f1ede5]"
                : "bg-[#15191a]/50 border-white/[0.04] text-[#a9adae] hover:border-white/15"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                  b.isReturned
                    ? "bg-[#68a46b] border-[#68a46b] text-[#050606]"
                    : "border-white/20 bg-[#080a0b]"
                }`}
              >
                {b.isReturned && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-semibold text-[#f1ede5]">
                {b.name}
              </span>
            </div>

            {b.isReturned && (
              <span className="text-[11px] text-[#68a46b] font-mono">
                ✓ Entregue ao Cliente
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
