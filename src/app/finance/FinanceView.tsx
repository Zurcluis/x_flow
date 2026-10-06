"use client";

import React from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Repeat,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatting";
import type {
  Invoice,
  RecurringRule,
  Transaction,
  TreasurySummary,
} from "@/domains/finance/types";

const SOURCE_LABELS: Record<Transaction["sourceType"], string> = {
  manual: "Manual",
  invoice_payment: "Cobrança",
  recurring: "Recorrente",
  import: "Importado",
  tax_payment: "Imposto",
};

export function FinanceSubNav({ active }: { active: "dashboard" | "invoices" | "movements" | "recurring" }) {
  const items: Array<{ id: string; label: string; href: string }> = [
    { id: "dashboard", label: "Dashboard", href: "/finance" },
    { id: "invoices", label: "Faturação", href: "/invoices" },
    { id: "movements", label: "Movimentos", href: "/finance/movements" },
    { id: "recurring", label: "Recorrentes", href: "/finance/recurring" },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0c0f10] border border-white/[0.06] self-start overflow-x-auto">
      {items.map((i) => (
        <Link
          key={i.id}
          href={i.href}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            active === i.id
              ? "bg-[#1f1b14] text-[#f7d46d]"
              : "text-[#8a9092] hover:text-[#f1ede5]"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function FinanceView({
  summary,
  recentTransactions,
  recurring,
  invoices,
  generatedCount,
}: {
  summary: TreasurySummary;
  recentTransactions: Transaction[];
  recurring: RecurringRule[];
  invoices: Invoice[];
  generatedCount: number;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const monthBilled = invoices
    .filter((i) => i.paymentStatus !== "cancelled" && i.issuedAt.slice(0, 7) === currentMonth)
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const breakEven = summary.recurringMonthlyTotal;
  const gap = monthBilled - breakEven;
  const overdue = invoices.filter(
    (i) => i.paymentStatus === "pending" && i.dueAt.slice(0, 10) < today
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">Finanças</h1>
          <p className="text-xs text-[#a9adae]">
            Gestão financeira da empresa — tesouraria, faturação, despesas e impostos. Controlo gerencial; a fatura oficial nasce no weoInvoice.
          </p>
        </div>
        <FinanceSubNav active="dashboard" />
      </div>

      {generatedCount > 0 && (
        <div className="rounded-md bg-[#142618] border border-[#68a46b]/30 px-4 py-2.5 text-xs text-[#68a46b] flex items-center gap-2">
          <Repeat className="h-3.5 w-3.5" />
          <span>
            {generatedCount} rubrica(s) recorrente(s) lançada(s) automaticamente neste acesso.
          </span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Saldo Estimado</span>
            <Wallet className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {formatCurrency(summary.currentBalance)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              contas configuradas + movimentos
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Entradas (Mês)</span>
            <TrendingUp className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              {formatCurrency(summary.monthIncome)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              faturado no mês: {formatCurrency(monthBilled)}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Saídas (Mês)</span>
            <TrendingDown className="h-4 w-4 text-[#c96a6a]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#c96a6a]">
              {formatCurrency(summary.monthExpense)}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              net: {formatCurrency(summary.monthNet)}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Break-even Mensal</span>
            <Repeat className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {formatCurrency(breakEven)}
            </span>
            <span className={"block text-[12px] mt-0.5 " + (gap >= 0 ? "text-[#68a46b]" : "text-[#c96a6a] font-semibold")}>
              {gap >= 0 ? "+" : ""}
              {formatCurrency(gap)} face ao faturado no mês
            </span>
          </div>
        </Card>
      </div>

      {/* Pendências + Últimos movimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#f1ede5]">Cobranças por receber</span>
            <Link
              href="/invoices"
              className="text-[11px] font-semibold text-[#d3a548] hover:text-[#f7d46d] inline-flex items-center gap-1"
            >
              Ver faturação <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center justify-between rounded-md bg-[#0c0f10] border border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[#a9adae]">
              <Clock className="h-4 w-4 text-[#f7d46d]" />
              <span>Pendente</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#f7d46d]">
              {formatCurrency(summary.pendingInvoiceTotal)} ({summary.pendingInvoiceCount})
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-[#0c0f10] border border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[#a9adae]">
              <AlertTriangle className="h-4 w-4 text-[#c96a6a]" />
              <span>Vencido</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#c96a6a]">
              {formatCurrency(summary.overdueInvoiceTotal)} ({summary.overdueInvoiceCount})
            </span>
          </div>
          {overdue.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {overdue.slice(0, 3).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 bg-[#2b1616]/60 border border-[#c96a6a]/20 hover:border-[#c96a6a]/40 transition-colors"
                >
                  <span className="font-mono text-xs text-[#f1ede5]">{inv.invoiceNumber}</span>
                  <span className="text-[11px] text-[#a9adae]">{inv.customerName}</span>
                  <span className="font-mono text-xs text-[#c96a6a]">
                    {formatCurrency(inv.totalAmount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#f1ede5]">Últimos movimentos</span>
            <Link
              href="/finance/movements"
              className="text-[11px] font-semibold text-[#d3a548] hover:text-[#f7d46d] inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentTransactions.length === 0 && (
            <div className="rounded-md bg-[#0c0f10] border border-white/[0.06] px-4 py-6 text-center text-xs text-[#8a9092]">
              Ainda não há movimentos. Regista a primeira despesa em Movimentos.
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md px-3 py-2 bg-[#0c0f10] border border-white/[0.05]"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#f1ede5] truncate">
                    {t.description ?? t.categoryName ?? "Movimento"}
                  </span>
                  <span className="text-[10px] text-[#8a9092]">
                    {t.occurredAt.slice(0, 10)} · {SOURCE_LABELS[t.sourceType]}
                    {t.categoryName ? ` · ${t.categoryName}` : ""}
                  </span>
                </div>
                <span
                  className={
                    "font-mono text-xs font-bold shrink-0 " +
                    (t.type === "income" ? "text-[#68a46b]" : "text-[#c96a6a]")
                  }
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recorrentes resumo */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#f1ede5]">Rubricas recorrentes ativas</span>
          <Link
            href="/finance/recurring"
            className="text-[11px] font-semibold text-[#d3a548] hover:text-[#f7d46d] inline-flex items-center gap-1"
          >
            Gerir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {recurring
            .filter((r) => r.active)
            .slice(0, 6)
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md bg-[#0c0f10] border border-white/[0.05] px-3 py-2"
              >
                <span className="text-xs text-[#a9adae] truncate pr-2">{r.name}</span>
                <span className="font-mono text-xs text-[#c96a6a] shrink-0">
                  −{formatCurrency(r.amount)}
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* Nota fiscal */}
      <div className="rounded-md bg-[#101314] border border-white/[0.06] px-4 py-3 flex items-start gap-2.5 text-[11px] text-[#8a9092]">
        <Receipt className="h-3.5 w-3.5 mt-0.5 text-[#d3a548] shrink-0" />
        <span>
          O X-Flow é um sistema de controlo gerencial: não emite faturas fiscais nem submete declarações à AT.
          As faturas oficiais são emitidas no weoInvoice (Certificado AT nº 1137/AT) e registadas aqui como espelho.
        </span>
      </div>
    </div>
  );
}
