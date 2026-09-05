"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initialDeliveriesData } from "@/lib/demo-data/finance-deliveries-data";

export default function DeliveriesPage() {
  const [deliveries] = useState(initialDeliveriesData);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = deliveries.filter(
    (d) =>
      d.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Entregas de Viaturas
          </h1>
          <p className="text-xs text-[#a9adae]">
            Registo de levantamentos com assinatura digital de receção do cliente e conferência de pertences a bordo.
          </p>
        </div>

        <Link href="/deliveries/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" />
            <span>Nova Entrega ao Cliente</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Entregas Concluídas</span>
            <Key className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {deliveries.length} Viaturas
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
              100% com assinatura digital
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Garantias Ativadas</span>
            <ShieldCheck className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              100%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Passaportes digitais gerados no ato de entrega
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Satisfação na Entrega</span>
            <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              5.0 / 5.0
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Avaliação média de entrega
            </span>
          </div>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por matrícula, modelo, cliente ou levantador..."
          className="h-10 w-full pl-10 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
        />
      </div>

      {/* Deliveries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((del) => (
          <Card
            key={del.id}
            className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                  <span>{del.vehiclePlate}</span>
                </div>

                <Badge variant="success" className="text-[11px]">
                  Levantamento Concluído
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#f1ede5]">
                  {del.vehicleModel}
                </h3>
                <span className="text-xs text-[#a9adae]">
                  Cliente: {del.customerName}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-3 rounded-[10px] bg-[#15191a] border border-white/[0.03] text-xs">
                <span className="text-[#a9adae]">
                  Levantado por: <strong className="text-[#f1ede5]">{del.receiverName}</strong> {del.receiverIdDocument && `(${del.receiverIdDocument})`}
                </span>
                <span className="text-[12px] text-[#8a9092]">
                  Entregue por: {del.deliveredByName}
                </span>
                <span className="text-[12px] text-[#68a46b] font-medium mt-0.5">
                  ✓ Pertences e chaves devolvidos ({del.belongings.length} itens)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04] text-xs">
              <span className="text-[11px] text-[#8a9092]">
                {del.deliveredAt}
              </span>

              <div className="flex items-center gap-2">
                <Link href={`/deliveries/${del.id}`}>
                  <Button variant="outline" size="sm" className="bg-[#15191a]">
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Ver Ficha</span>
                  </Button>
                </Link>
                <Link href={`/passport/${del.vehiclePlate}`} target="_blank">
                  <Button variant="primary" size="sm" className="bg-[#d3a548] text-[#050606] font-bold">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Passaporte</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
