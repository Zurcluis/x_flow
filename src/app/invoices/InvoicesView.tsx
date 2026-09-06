"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Euro,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatting";
import { markInvoicePaidAction } from "@/app/actions/deliveries";

import { Invoice } from "@/domains/finance/types";

const PAYMENT_LABELS: Record<Invoice["paymentStatus"], { label: string; variant: "success" | "gold" | "danger" }> = {
  paid: { label: "Liquidada", variant: "success" },
  pending: { label: "Pendente", variant: "gold" },
  overdue: { label: "Em incumprimento", variant: "danger" },
  cancelled: { label: "Anulada", variant: "danger" },
};

export function InvoicesView({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalVat = invoices.reduce((acc, inv) => acc + inv.vatAmount, 0);
  const unpaid = invoices.filter((i) => i.paymentStatus !== "paid").length;

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerNif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Faturação & Gestão Financeira
          </h1>
          <p className="text-xs text-[#a9adae]">
            Documentos fiscais emitidos, apuramento de IVA a 23% e controlo de liquidações por método de pagamento.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Faturação Total (Mês)</span>
            <TrendingUp className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {formatCurrency(totalBilled)}
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
              +18.4% face ao mês anterior
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">IVA Liquidado (23%)</span>
            <DollarSign className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              {formatCurrency(totalVat)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Declarado à Autoridade Tributária
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Taxa de Cobrança</span>
            <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {invoices.length > 0
                ? Math.round(((invoices.length - unpaid) / invoices.length) * 100)
                : 100}
              %
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              {unpaid === 0 ? "0 faturas em incumprimento" : `${unpaid} fatura(s) por liquidar`}
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
          placeholder="Pesquisar por nº fatura, NIF, cliente ou matrícula..."
          className="h-10 w-full pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
        />
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-3">
        {filtered.map((inv) => (
          <Card
            key={inv.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-150"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#d3a548]/15 text-[#f7d46d]">
                <FileText className="h-5 w-5" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-[#f7d46d]">
                    {inv.invoiceNumber}
                  </span>
                  <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[11px] text-[#f1ede5]">
                    <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                    <span>{inv.vehiclePlate}</span>
                  </div>
                  <Badge
                    variant={PAYMENT_LABELS[inv.paymentStatus].variant}
                    className="text-[11px]"
                  >
                    {PAYMENT_LABELS[inv.paymentStatus].label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#a9adae]">
                  <strong className="text-[#f1ede5]">{inv.customerName}</strong>
                  <span>·</span>
                  <span className="font-mono text-[12px] text-[#8a9092]">NIF: {inv.customerNif}</span>
                  <span>·</span>
                  <span>{inv.vehicleModel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
              <div className="flex flex-col sm:items-end">
                <span className="font-mono font-black text-base text-[#f1ede5]">
                  {formatCurrency(inv.totalAmount)}
                </span>
                <span className="text-[11px] text-[#8a9092]">
                  c/ IVA 23% ({formatCurrency(inv.vatAmount)})
                </span>
              </div>

              {inv.paymentStatus !== "paid" && inv.paymentStatus !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={payingId === inv.id}
                  className="bg-[#142618] border-[#68a46b]/40 text-[#68a46b]"
                  onClick={() => {
                    setPayingId(inv.id);
                    startTransition(async () => {
                      const res = await markInvoicePaidAction(inv.id);
                      if (res.ok) {
                        setInvoices((prev) =>
                          prev.map((i) =>
                            i.id === inv.id ? { ...i, paymentStatus: "paid" as const } : i
                          )
                        );
                      }
                      setPayingId(null);
                    });
                  }}
                >
                  <Euro className="h-3.5 w-3.5 mr-1" />
                  <span>{payingId === inv.id ? "A registar…" : "Registar Pagamento"}</span>
                </Button>
              )}

              <Link href={`/invoices/${inv.id}`}>
                <Button variant="outline" size="sm" className="bg-[#15191a]">
                  <span>Ver Fatura</span>
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
