"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatting";
import type { B2BAccount, B2BVehicleEntry } from "@/domains/timebook/types";

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

export function B2BPortalView({ initialAccounts }: { initialAccounts: B2BAccount[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const accounts = initialAccounts;

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.companyName.toLowerCase().includes(normalizedSearch) ||
      acc.tradeName.toLowerCase().includes(normalizedSearch) ||
      acc.nif.includes(normalizedSearch)
  );

  const totalBilled = accounts.reduce((acc, a) => acc + a.totalBilledCents, 0);
  const totalPending = accounts.reduce((acc, a) => acc + a.currentBalanceCents, 0);
  const fleetCount = accounts.reduce((acc, a) => acc + a.fleetVehicles.length, 0);
  const averageDiscount =
    accounts.length > 0
      ? accounts.reduce((acc, a) => acc + a.discountRate, 0) / accounts.length
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#d3a548]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              Portal Corporativo B2B
            </h1>
          </div>
          <p className="text-xs text-[#a9adae] mt-1">
            Gestão de frotas, stands e concessionários com condições comerciais acordadas.
          </p>
        </div>

        <Link
          href="/vehicles"
          className={buttonStyles({
            variant: "primary",
            size: "sm",
            className: "bg-[#d3a548] text-[#050606] font-semibold text-xs h-9",
          })}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Associar Nova Viatura</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Faturação B2B Acumulada
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f1ede5]">
              {formatCurrency(totalBilled / 100)}
            </span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            {accounts.length} parceiros registados
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Viaturas de Frota
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f7d46d]">{fleetCount}</span>
            <span className="text-xs text-[#a9adae]">em oficina / entregues</span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            Associadas aos parceiros B2B
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Saldo Pendente em Conta
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f1ede5]">
              {formatCurrency(totalPending / 100)}
            </span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            Faturas pendentes ou vencidas
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Desconto Médio Acordado
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#d3a548]">
              {averageDiscount.toFixed(1)}%
            </span>
            <span className="text-xs text-[#a9adae]">em mão de obra/PPF</span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            Média simples das condições registadas
          </span>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar parceiro por nome comercial, razão social ou NIF..."
            className="w-full h-10 pl-9 pr-4 rounded-md bg-[#101314] border border-white/[0.08] text-xs text-[#f1ede5] placeholder-[#8a9092] focus:border-[#d3a548] outline-none"
          />
        </div>
      </div>

      <div role="status" className="sr-only">
        {filteredAccounts.length} parceiros visíveis de {accounts.length}.
      </div>

      {filteredAccounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Building2 className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            {accounts.length === 0
              ? "Ainda não existem parceiros B2B"
              : "Nenhum parceiro corresponde à pesquisa"}
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            {accounts.length === 0
              ? "Cria uma conta B2B associada a um cliente empresarial para começar."
              : "Tenta ajustar os termos de pesquisa."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((account) => (
            <Card
              key={account.id}
              className="p-5 bg-[#101314] border-white/[0.08] hover:border-[#d3a548]/50 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#f1ede5]">
                        {account.tradeName}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-[#d3a548]/10 text-[#f7d46d] border-[#d3a548]/30 text-[11px]"
                      >
                        {account.discountRate}% Desconto
                      </Badge>
                    </div>
                    <span className="text-xs text-[#a9adae] mt-0.5">
                      {account.companyName}
                    </span>
                    <span className="text-[12px] font-mono text-[#8a9092]">
                      NIF: {account.nif || "Não registado"}
                    </span>
                  </div>

                  <Link
                    href={`/b2b/${account.id}`}
                    className={buttonStyles({
                      variant: "outline",
                      size: "sm",
                      className:
                        "h-8 px-3 text-xs bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]",
                    })}
                  >
                    <span>Ficha B2B</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 text-[#d3a548]" />
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-xs text-[#a9adae]">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
                    <span>{account.contactPhone || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#d3a548]" />
                    <span className="truncate">{account.contactEmail || "Sem email"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#15191a] border border-white/[0.04]">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#8a9092] block mb-2">
                  Viaturas de Frota ({account.fleetVehicles.length})
                </span>
                {account.fleetVehicles.length === 0 ? (
                  <span className="text-[12px] text-[#8a9092]">
                    Sem viaturas associadas.
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {account.fleetVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-sm bg-[#101314] border border-white/[0.02]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#f1ede5]">
                            {vehicle.plate}
                          </span>
                          <span className="text-[#a9adae] text-[12px]">
                            {vehicle.make} {vehicle.model}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-1.5 py-0 ${STATUS_CLASS[vehicle.status]}`}
                        >
                          {STATUS_LABEL[vehicle.status]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
