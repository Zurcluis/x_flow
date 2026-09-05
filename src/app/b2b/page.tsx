"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialB2BAccounts } from "@/lib/demo-data/timebook-b2b-data";

export default function B2BPortalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const accounts = initialB2BAccounts;

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.nif.includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#d3a548]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              Portal Corporativo B2B
            </h1>
          </div>
          <p className="text-xs text-[#a9adae] mt-1">
            Gestão de frotas, stands automóveis e concessionários com condições comerciais acordadas.
          </p>
        </div>

        <Link href="/vehicles">
          <Button variant="primary" size="sm" className="bg-[#d3a548] text-[#050606] font-semibold text-xs h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Associar Nova Viatura</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Faturação B2B Acumulada
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f1ede5]">€62 900,00</span>
            <Badge variant="outline" className="bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30 text-[11px]">
              +18%
            </Badge>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            3 parceiros ativos em Barcelos e Minho
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Viaturas de Frota
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f7d46d]">3</span>
            <span className="text-xs text-[#a9adae]">em oficina / entregues</span>
          </div>
          <span className="text-[11px] text-[#68a46b] mt-1 block font-medium">
            100% de entregas no prazo acordado
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Saldo Pendente em Conta
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#f1ede5]">€7 626,00</span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            Prazos de pagamento a 30 dias
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08]">
          <span className="text-[12px] font-semibold text-[#8a9092] uppercase tracking-wider block mb-1">
            Desconto Médio Acordado
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#d3a548]">15,0%</span>
            <span className="text-xs text-[#a9adae]">em mão de obra/PPF</span>
          </div>
          <span className="text-[11px] text-[#a9adae] mt-1 block">
            Base horária ajustada a volume
          </span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar parceiro por nome comercial, razão social ou NIF..."
            className="w-full h-10 pl-9 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] text-xs text-[#f1ede5] placeholder-[#8a9092] focus:border-[#d3a548] outline-none"
          />
        </div>
      </div>

      {/* B2B Partners List */}
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
                    NIF: {account.nif}
                  </span>
                </div>

                <Link href={`/b2b/${account.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]"
                  >
                    <span>Ficha B2B</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 text-[#d3a548]" />
                  </Button>
                </Link>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-xs text-[#a9adae]">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
                  <span>{account.contactPhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#d3a548]" />
                  <span className="truncate">{account.contactEmail}</span>
                </div>
              </div>
            </div>

            {/* Fleet Summary inside card */}
            <div className="p-3 rounded-[12px] bg-[#15191a] border border-white/[0.04]">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#8a9092] block mb-2">
                Viaturas Ativas / Concluídas ({account.fleetVehicles.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {account.fleetVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-[8px] bg-[#101314] border border-white/[0.02]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#f1ede5]">
                        {v.plate}
                      </span>
                      <span className="text-[#a9adae] text-[12px]">
                        {v.make} {v.model}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[11px] px-1.5 py-0 ${
                        v.status === "delivered"
                          ? "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30"
                          : "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30"
                      }`}
                    >
                      {v.status === "delivered" ? "Entregue" : "Em Produção"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
