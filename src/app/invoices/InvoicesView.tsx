"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  TrendingUp,
  FileText,
  Euro,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatting";
import { markInvoicePaidAction } from "@/app/actions/finance";

import { Invoice, PaymentMethod } from "@/domains/finance/types";

const PAYMENT_LABELS: Record<Invoice["paymentStatus"], { label: string; variant: "success" | "gold" | "danger" }> = {
  paid: { label: "Liquidada", variant: "success" },
  pending: { label: "Pendente", variant: "gold" },
  overdue: { label: "Em incumprimento", variant: "danger" },
  cancelled: { label: "Anulada", variant: "danger" },
};

const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "bank_transfer", label: "Transferência Bancária (Millennium BCP)" },
  { value: "mbway", label: "MB WAY" },
  { value: "multibanco", label: "Terminal Multibanco" },
  { value: "cash", label: "Dinheiro" },
];

type TabId = "all" | "pending" | "overdue" | "paid";

function isOverdue(inv: Invoice): boolean {
  return inv.paymentStatus === "pending" && inv.dueAt.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function InvoicesView({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("bank_transfer");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payReference, setPayReference] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const active = invoices.filter((i) => i.paymentStatus !== "cancelled");
    const monthBilled = active
      .filter((i) => monthOf(i.issuedAt) === currentMonth)
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const pending = active.filter((i) => i.paymentStatus === "pending");
    const overdue = pending.filter(isOverdue);
    const paidTotal = active
      .filter((i) => i.paymentStatus === "paid")
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const emittedTotal = active.reduce((acc, inv) => acc + inv.totalAmount, 0);
    return {
      monthBilled,
      pending,
      overdue,
      pendingTotal: pending.reduce((acc, inv) => acc + inv.totalAmount, 0),
      overdueTotal: overdue.reduce((acc, inv) => acc + inv.totalAmount, 0),
      collectionRate:
        emittedTotal > 0 ? Math.round((paidTotal / emittedTotal) * 100) : 100,
    };
  }, [invoices, currentMonth]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return invoices
      .filter((inv) => {
        if (tab === "pending") return inv.paymentStatus === "pending";
        if (tab === "overdue") return isOverdue(inv);
        if (tab === "paid") return inv.paymentStatus === "paid";
        return true;
      })
      .filter(
        (inv) =>
          !term ||
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term) ||
          inv.customerNif.toLowerCase().includes(term) ||
          inv.vehiclePlate.toLowerCase().includes(term)
      );
  }, [invoices, searchTerm, tab]);

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "all", label: "Todas" },
    { id: "pending", label: "Pendentes", count: stats.pending.length },
    { id: "overdue", label: "Vencidas", count: stats.overdue.length },
    { id: "paid", label: "Liquidadas" },
  ];

  const openPaymentModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayMethod((inv.paymentMethod as PaymentMethod) ?? "bank_transfer");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayReference("");
    setPayError(null);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setSubmitting(true);
    setPayError(null);
    const res = await markInvoicePaidAction(payingInvoice.id, {
      method: payMethod,
      occurredAt: `${payDate}T12:00:00`,
      reference: payReference.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === payingInvoice.id
            ? { ...i, paymentStatus: "paid" as const, paidAt: `${payDate}T12:00:00` }
            : i
        )
      );
      setPayingInvoice(null);
    } else {
      setPayError(res.error ?? "Erro ao registar o pagamento.");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Faturação
          </h1>
          <p className="text-xs text-[#a9adae]">
            Documentos registados (espelho do weoInvoice), cobranças e controlo de liquidações. IVA 23%.
          </p>
        </div>
        <Link href="/finance">
          <Button variant="outline" size="sm" className="bg-[#15191a]">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            <span>Ir para Finanças</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Faturação do Mês</span>
            <TrendingUp className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {formatCurrency(stats.monthBilled)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Total emitido no mês corrente
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Pendente de Cobrança</span>
            <Clock className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {formatCurrency(stats.pendingTotal)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              {stats.pending.length} fatura(s) por liquidar
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Em Incumprimento</span>
            <AlertTriangle className="h-4 w-4 text-[#c96a6a]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#c96a6a]">
              {formatCurrency(stats.overdueTotal)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              {stats.overdue.length} fatura(s) vencidas
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Taxa de Cobrança</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              {stats.collectionRate}%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              ponderada por valor cobrado
            </span>
          </div>
        </Card>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nº fatura, NIF, cliente ou matrícula..."
            className="h-10 w-full pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0c0f10] border border-white/[0.06] self-start">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-[#1f1b14] text-[#f7d46d]"
                  : "text-[#8a9092] hover:text-[#f1ede5]"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-mono">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-xs text-[#8a9092]">
            Sem faturas para o filtro atual.
          </Card>
        )}
        {filtered.map((inv) => {
          const invOverdue = isOverdue(inv);
          const statusLabel = invOverdue ? "Vencida" : PAYMENT_LABELS[inv.paymentStatus].label;
          const statusVariant = invOverdue ? "danger" : PAYMENT_LABELS[inv.paymentStatus].variant;
          return (
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
                    {inv.vehiclePlate && (
                      <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[11px] text-[#f1ede5]">
                        <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                        <span>{inv.vehiclePlate}</span>
                      </div>
                    )}
                    <Badge variant={statusVariant} className="text-[11px]">
                      {statusLabel}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#a9adae]">
                    <strong className="text-[#f1ede5]">{inv.customerName}</strong>
                    {inv.customerNif && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[12px] text-[#8a9092]">
                          NIF: {inv.customerNif}
                        </span>
                      </>
                    )}
                    {inv.vehicleModel && (
                      <>
                        <span>·</span>
                        <span>{inv.vehicleModel}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8a9092]">
                    <span>Emissão: {inv.issuedAt.slice(0, 10)}</span>
                    <span>·</span>
                    <span className={invOverdue ? "text-[#c96a6a] font-semibold" : ""}>
                      Vencimento: {inv.dueAt.slice(0, 10)}
                    </span>
                    {inv.paidAt && (
                      <>
                        <span>·</span>
                        <span className="text-[#68a46b]">Liquidado: {inv.paidAt.slice(0, 10)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                <div className="flex flex-col sm:items-end">
                  <span className="font-mono font-black text-base text-[#f1ede5]">
                    {formatCurrency(inv.totalAmount)}
                  </span>
                  <span className="text-[11px] text-[#8a9092]">
                    c/ IVA {inv.vatRate}% ({formatCurrency(inv.vatAmount)})
                  </span>
                </div>

                {inv.paymentStatus === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={invOverdue ? "bg-[#2b1616] border-[#c96a6a]/40 text-[#c96a6a]" : "bg-[#142618] border-[#68a46b]/40 text-[#68a46b]"}
                    onClick={() => openPaymentModal(inv)}
                  >
                    <Euro className="h-3.5 w-3.5 mr-1" />
                    <span>Registar Pagamento</span>
                  </Button>
                )}

                <Link href={`/invoices/${inv.id}`}>
                  <Button variant="outline" size="sm" className="bg-[#15191a]">
                    <span>Ver Fatura</span>
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] bg-[#101314] border border-white/[0.1] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#f1ede5]">Registar Pagamento</span>
                <span className="text-xs text-[#a9adae] font-mono">
                  {payingInvoice.invoiceNumber} · {payingInvoice.customerName}
                </span>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 rounded-md text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.06]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitPayment} className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between rounded-md bg-[#0c0f10] border border-white/[0.06] px-4 py-3">
                <span className="text-xs text-[#a9adae]">Total a liquidar</span>
                <span className="font-mono font-black text-base text-[#f7d46d]">
                  {formatCurrency(payingInvoice.totalAmount)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pay-method" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Método
                </label>
                <select
                  id="pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pay-date" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Data efetiva
                </label>
                <input
                  id="pay-date"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pay-ref" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Referência / Comprovativo
                </label>
                <input
                  id="pay-ref"
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Ex.: MB 000123456 / Transferência 12 Out"
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3"
                />
              </div>

              {payError && (
                <div className="rounded-md bg-[#2b1616] border border-[#c96a6a]/40 px-3 py-2 text-xs text-[#c96a6a]">
                  {payError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayingInvoice(null)}>
                  <span>Cancelar</span>
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  <span>{submitting ? "A registar…" : "Confirmar Liquidação"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
