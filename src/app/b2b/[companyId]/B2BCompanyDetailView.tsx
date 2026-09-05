"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Car,
  ChevronLeft,
  Phone,
  Download,
  CheckCircle2,
  Clock,
  User,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { B2BAccount } from "@/domains/timebook/types";

export function B2BCompanyDetailView({ account }: { account: B2BAccount }) {


  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/b2b"
          className="inline-flex items-center gap-1.5 text-xs text-[#a9adae] hover:text-[#f1ede5] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Voltar ao Portal B2B</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="h-8 px-3 text-xs bg-[#101314] border-white/[0.08] text-[#f1ede5]"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-[#d3a548]" />
          <span>Exportar Resumo Mensal</span>
        </Button>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-[18px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-[12px] bg-[#d3a548]/10 text-[#d3a548] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
                  {account.tradeName}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30 text-xs font-bold"
                >
                  {account.discountRate}% Desconto Frota
                </Badge>
              </div>
              <span className="text-xs text-[#a9adae]">{account.companyName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#a9adae]">
            <span className="font-mono">NIF: {account.nif}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#d3a548]" />
              {account.contactPerson}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
              {account.contactPhone}
            </span>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 gap-3 self-start md:self-auto">
          <div className="p-3 rounded-[12px] bg-[#101314] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold block mb-1">
              Faturação Total
            </span>
            <span className="font-mono font-bold text-base text-[#f1ede5]">
              €{(account.totalBilledCents / 100).toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-[#101314] border border-[#d3a548]/30">
            <span className="text-[11px] text-[#f7d46d] uppercase font-bold block mb-1">
              Saldo em Conta
            </span>
            <span className="font-mono font-bold text-base text-[#f7d46d]">
              €{(account.currentBalanceCents / 100).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Vehicles Table */}
      <Card className="p-6 bg-[#101314] border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-[#d3a548]" />
            <h2 className="text-base font-bold text-[#f1ede5]">
              Viaturas de Frota ({account.fleetVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-[#8a9092]">Condições de pagamento: {account.paymentTermsDays} dias</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-[#8a9092]">
              <tr>
                <th className="pb-3 font-semibold">Matrícula & Viatura</th>
                <th className="pb-3 font-semibold">Serviço Pretendido</th>
                <th className="pb-3 font-semibold">Técnico</th>
                <th className="pb-3 font-semibold">Data Prometida</th>
                <th className="pb-3 font-semibold text-right">Valor c/ Desconto</th>
                <th className="pb-3 font-semibold text-center">Estado</th>
                <th className="pb-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {account.fleetVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-sm text-[#f1ede5]">
                        {vehicle.plate}
                      </span>
                      <span className="text-[12px] text-[#a9adae]">
                        {vehicle.make} {vehicle.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-[#f1ede5] font-medium">
                    {vehicle.service}
                  </td>
                  <td className="py-3.5 pr-3 text-[#a9adae]">
                    {vehicle.assignedTechnician}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[#a9adae]">
                    {vehicle.deliveryDueDate}
                  </td>
                  <td className="py-3.5 pr-3 font-mono font-bold text-right text-[#f7d46d]">
                    €{(vehicle.amountCents / 100).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[11px] px-2 py-0.5 ${
                        vehicle.status === "delivered"
                          ? "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30"
                          : "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30"
                      }`}
                    >
                      {vehicle.status === "delivered" ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Entregue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Em Produção
                        </span>
                      )}
                    </Badge>
                  </td>
                  <td className="py-3.5 pl-3 text-right">
                    <Link href={`/passport/${vehicle.plate}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[12px] bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]"
                      >
                        <span>Passaporte 360°</span>
                        <ArrowUpRight className="h-3 w-3 ml-1 text-[#d3a548]" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
