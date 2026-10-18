"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Car,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Phone,
  Printer,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatting";
import type { B2BAccount, B2BVehicleEntry } from "@/domains/timebook/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const STATUS_LABEL: Record<B2BVehicleEntry["status"], string> = {
  scheduled: "Agendado",
  in_production: "Em produção",
  qc: "Controlo de qualidade",
  ready: "Pronto",
  delivered: "Entregue",
};

const STATUS_CLASS: Record<B2BVehicleEntry["status"], string> = {
  scheduled: "bg-[#1b2021] text-[#a9adae] border-white/10",
  in_production: "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30",
  qc: "bg-[#c8b5ef]/15 text-[#c8b5ef] border-[#c8b5ef]/30",
  ready: "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30",
  delivered: "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30",
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

export function B2BCompanyDetailView({ account }: { account: B2BAccount }) {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
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
          <Printer className="h-3.5 w-3.5 mr-1.5 text-[#d3a548]" />
          <span>Imprimir ficha</span>
        </Button>
      </div>

      <div className="p-6 rounded-[18px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-md bg-[#d3a548]/10 text-[#d3a548] flex items-center justify-center">
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
            <span className="font-mono">NIF: {account.nif || "Não registado"}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#d3a548]" />
              {account.contactPerson || "Sem contacto"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
              {account.contactPhone || "Sem telefone"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 self-start md:self-auto">
          <div className="p-3 rounded-md bg-[#101314] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold block mb-1">
              Faturação Total
            </span>
            <span className="font-mono font-bold text-base text-[#f1ede5]">
              {formatCurrency(account.totalBilledCents / 100)}
            </span>
          </div>
          <div className="p-3 rounded-md bg-[#101314] border border-[#d3a548]/30">
            <span className="text-[11px] text-[#f7d46d] uppercase font-bold block mb-1">
              Saldo em Conta
            </span>
            <span className="font-mono font-bold text-base text-[#f7d46d]">
              {formatCurrency(account.currentBalanceCents / 100)}
            </span>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-[#101314] border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-[#d3a548]" />
            <h2 className="text-base font-bold text-[#f1ede5]">
              Viaturas de Frota ({account.fleetVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-[#8a9092]">
            Condições de pagamento: {account.paymentTermsDays} dias
          </span>
        </div>

        {account.fleetVehicles.length === 0 ? (
          <p className="text-sm text-[#8a9092] py-8 text-center">
            Sem viaturas associadas a este parceiro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-[#8a9092]">
                <tr>
                  <th className="pb-3 font-semibold">Matrícula & Viatura</th>
                  <th className="pb-3 font-semibold">Serviço</th>
                  <th className="pb-3 font-semibold">Técnico</th>
                  <th className="pb-3 font-semibold">Concluída em</th>
                  <th className="pb-3 font-semibold text-right">Valor faturado</th>
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
                      {vehicle.service || "Sem serviço registado"}
                    </td>
                    <td className="py-3.5 pr-3 text-[#a9adae]">
                      {vehicle.assignedTechnician || "Sem técnico"}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-[#a9adae]">
                      {formatDate(vehicle.deliveryDueDate)}
                    </td>
                    <td className="py-3.5 pr-3 font-mono font-bold text-right text-[#f7d46d]">
                      {formatCurrency(vehicle.amountCents / 100)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 ${STATUS_CLASS[vehicle.status]}`}
                      >
                        {vehicle.status === "delivered" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {STATUS_LABEL[vehicle.status]}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {STATUS_LABEL[vehicle.status]}
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <Link
                        href={`/passport/${vehicle.plate}`}
                        className={buttonStyles({
                          variant: "outline",
                          size: "sm",
                          className:
                            "h-7 px-2.5 text-[12px] bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]",
                        })}
                      >
                        <span>Passaporte 360</span>
                        <ArrowUpRight className="h-3 w-3 ml-1 text-[#d3a548]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
