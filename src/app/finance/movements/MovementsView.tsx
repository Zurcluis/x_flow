"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatting";
import { createTransactionAction } from "@/app/actions/finance";
import { FinanceSubNav } from "../FinanceView";
import type {
  BankAccount,
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@/domains/finance/types";

const SOURCE_LABELS: Record<Transaction["sourceType"], string> = {
  manual: "Manual",
  invoice_payment: "Cobrança",
  recurring: "Recorrente",
  import: "Importado",
  tax_payment: "Imposto",
};

const METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Transferência (BCP)" },
  { value: "mbway", label: "MB WAY" },
  { value: "multibanco", label: "Multibanco" },
  { value: "cash", label: "Dinheiro" },
];

export function MovementsView({
  initialTransactions,
  categories,
  accounts,
}: {
  initialTransactions: Transaction[];
  categories: TransactionCategory[];
  accounts: BankAccount[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [vatAmount, setVatAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(
    () => transactions.filter((t) => typeFilter === "all" || t.type === typeFilter),
    [transactions, typeFilter]
  );

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const vatDeductible = filtered
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + t.vatAmount, 0);
    return { income, expense, vatDeductible };
  }, [filtered]);

  const openForm = () => {
    setType("expense");
    setAmount("");
    setCategoryId(categories.find((c) => c.kind !== "other")?.id ?? "");
    setDescription("");
    setAccountId(accounts[0]?.id ?? "");
    setMethod("bank_transfer");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setVatAmount("");
    setError(null);
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Introduz um valor superior a zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createTransactionAction({
      type: type as Exclude<TransactionType, "transfer">,
      occurredAt: `${occurredAt}T12:00:00`,
      amount: value,
      categoryId: categoryId || undefined,
      bankAccountId: accountId || undefined,
      description: description || undefined,
      paymentMethod: method,
      vatAmount: Number(vatAmount.replace(",", ".")) || 0,
    });
    setSubmitting(false);
    if (res.ok) {
      const optimistic: Transaction = {
        id: `tmp-${Date.now()}`,
        type,
        occurredAt: `${occurredAt}T12:00:00`,
        amount: value,
        categoryId: categoryId || undefined,
        categoryName: categories.find((c) => c.id === categoryId)?.name,
        bankAccountId: accountId || undefined,
        bankAccountName: accounts.find((a) => a.id === accountId)?.name,
        description: description || undefined,
        paymentMethod: method,
        vatAmount: Number(vatAmount.replace(",", ".")) || 0,
        sourceType: "manual",
      };
      setTransactions((prev) => [optimistic, ...prev]);
      setFormOpen(false);
    } else {
      setError(res.error ?? "Erro ao registar o movimento.");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">Movimentos</h1>
          <p className="text-xs text-[#a9adae]">
            Livro de caixa — entradas, saídas e IVA dedutível registado.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <FinanceSubNav active="movements" />
          <Button variant="primary" size="sm" onClick={openForm}>
            <Plus className="h-4 w-4 mr-1" />
            <span>Registar Movimento</span>
          </Button>
        </div>
      </div>

      {/* Filtros + totais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0c0f10] border border-white/[0.06] self-start">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                typeFilter === t
                  ? "bg-[#1f1b14] text-[#f7d46d]"
                  : "text-[#8a9092] hover:text-[#f1ede5]"
              }`}
            >
              {t === "all" ? "Todos" : t === "income" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#68a46b]">
            Entradas: <span className="font-mono font-bold">{formatCurrency(totals.income)}</span>
          </span>
          <span className="text-[#c96a6a]">
            Saídas: <span className="font-mono font-bold">{formatCurrency(totals.expense)}</span>
          </span>
          <span className="text-[#a9adae]">
            IVA dedutível: <span className="font-mono font-bold text-[#f7d46d]">{formatCurrency(totals.vatDeductible)}</span>
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-xs text-[#8a9092]">
            Sem movimentos registados.
          </Card>
        )}
        {filtered.map((t) => (
          <Card
            key={t.id}
            className="flex items-center justify-between gap-4 p-4 bg-[#101314] border border-white/[0.06]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
                  t.type === "income" ? "bg-[#142618] text-[#68a46b]" : "bg-[#2b1616] text-[#c96a6a]"
                }`}
              >
                {t.type === "income" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#f1ede5] truncate">
                  {t.description ?? t.categoryName ?? "Movimento"}
                </span>
                <span className="text-[10px] text-[#8a9092]">
                  {t.occurredAt.slice(0, 10)} · {SOURCE_LABELS[t.sourceType]}
                  {t.categoryName ? ` · ${t.categoryName}` : ""}
                  {t.reference ? ` · ${t.reference}` : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {t.vatAmount > 0 && t.type === "expense" && (
                <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                  IVA {formatCurrency(t.vatAmount)}
                </Badge>
              )}
              <span
                className={
                  "font-mono font-bold text-sm " +
                  (t.type === "income" ? "text-[#68a46b]" : "text-[#c96a6a]")
                }
              >
                {t.type === "income" ? "+" : "−"}
                {formatCurrency(t.amount)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de registo */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] bg-[#101314] border border-white/[0.1] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <span className="text-sm font-bold text-[#f1ede5]">Registar Movimento</span>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-md text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.06]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-md border px-3 py-2.5 text-xs font-semibold transition-all ${
                      type === t
                        ? t === "expense"
                          ? "border-[#c96a6a]/50 bg-[#2b1616] text-[#c96a6a]"
                          : "border-[#68a46b]/50 bg-[#142618] text-[#68a46b]"
                        : "border-white/[0.08] bg-[#0c0f10] text-[#8a9092]"
                    }`}
                  >
                    {t === "expense" ? "Saída (Despesa)" : "Entrada (Receita)"}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="mv-amount" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Valor (€ s/ IVA para despesas com fatura)
                </label>
                <input
                  id="mv-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="mv-cat" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Categoria
                </label>
                <select
                  id="mv-cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3"
                >
                  <option value="">— Sem categoria —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="mv-desc" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Descrição
                </label>
                <input
                  id="mv-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Combustível frotas Setembro"
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mv-date" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Data
                  </label>
                  <input
                    id="mv-date"
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mv-method" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Método
                  </label>
                  <select
                    id="mv-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3"
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mv-account" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Conta
                  </label>
                  <select
                    id="mv-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3"
                  >
                    <option value="">— Sem conta —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mv-vat" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    IVA dedutível (€)
                  </label>
                  <input
                    id="mv-vat"
                    type="number"
                    step="0.01"
                    min="0"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(e.target.value)}
                    placeholder="0,00"
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3 font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-[#2b1616] border border-[#c96a6a]/40 px-3 py-2 text-xs text-[#c96a6a]">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                  <span>Cancelar</span>
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  <span>{submitting ? "A registar…" : "Registar"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
