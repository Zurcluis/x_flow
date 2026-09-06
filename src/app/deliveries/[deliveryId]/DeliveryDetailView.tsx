"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BelongingsChecklist } from "@/components/xflow/deliveries/BelongingsChecklist";

import { Delivery } from "@/domains/finance/types";

export function DeliveryDetailView({ delivery }: { delivery: Delivery }) {


  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Entregas</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#68a46b]/20 text-[#68a46b]">
              <Key className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              Ficha de Levantamento & Entrega
            </h1>
            <Badge variant="success" className="text-xs">
              Entrega Concluída
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{delivery.vehiclePlate}</span>
            </div>
            <span className="font-bold text-[#f1ede5]">{delivery.vehicleModel}</span>
            <span>·</span>
            <span>Cliente: {delivery.customerName}</span>
            <span>·</span>
            <span>Data: {delivery.deliveredAt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href="/invoices/inv-1">
            <Button variant="outline" size="sm" className="bg-[#15191a]">
              <CreditCard className="h-4 w-4 text-[#d3a548]" />
              <span>Ver Fatura FT 2026/042</span>
            </Button>
          </Link>

          <Link href={`/passport/${delivery.vehiclePlate}`} target="_blank">
            <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-bold">
              <ExternalLink className="h-4 w-4" />
              <span>Passaporte Digital</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Delivery Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Receiver details & Signature */}
        <Card className="p-6 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              Dados de Quem Levantou a Viatura
            </span>
            <Badge variant="gold" className="text-[11px]">
              Assinatura Válida
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Nome do Responsável:</span>
              <strong className="text-[#f1ede5]">{delivery.receiverName}</strong>
            </div>

            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Documento de Identificação:</span>
              <span className="font-mono text-[#f1ede5]">{delivery.receiverIdDocument || "CC Verificado"}</span>
            </div>

            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Entregue pelo Técnico:</span>
              <span className="text-[#f1ede5]">{delivery.deliveredByName}</span>
            </div>
          </div>

          {/* Signature representation */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-white/[0.04]">
            <span className="font-semibold text-[#a9adae]">Assinatura Recolhida no Levantamento:</span>
            <div className="p-4 rounded-md bg-[#0c0f10] border border-[#d3a548]/30 flex items-center justify-center">
              <span className="font-mono text-sm font-bold text-[#f7d46d] italic">
                {delivery.receiverName}
              </span>
            </div>
          </div>

          {delivery.notes && (
            <div className="p-3 rounded-sm bg-[#15191a] border border-white/[0.04] text-[12px] text-[#a9adae]">
              <strong>Notas:</strong> {delivery.notes}
            </div>
          )}
        </Card>

        {/* Right: Belongings checklist (read only) */}
        <BelongingsChecklist
          belongings={delivery.belongings}
          onToggleBelonging={() => {}}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
