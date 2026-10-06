"use client";

import React, { useMemo, useState } from "react";
import { Plus, Repeat, Power, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatting";
import {
  createRecurringRuleAction,
  toggleRecurringRuleAction,
} from "@/app/actions/finance";
import { FinanceSubNav } from "../FinanceView";
import type {
  RecurringRule,
  RecurringRuleCreateInput,
  TransactionCategory,
} from "@/domains/finance/types";

const FREQUENCY_LABELS: Record<RecurringRule["frequency"], string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export function RecurringView({
  rules,
  categories,
}: {
  rules: RecurringRule[];
  categories: TransactionCategory[];
}) {
  const [items, setItems] = useState(rules);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringRuleCreateInput["frequency"]>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const monthlyExpense = items
      .filter((r) => r.active && r.type === "expense")
      .reduce((acc, r) => {
        const factor = r.frequency === "yearly" ? 1 / 12 : r.frequency === "quarterly" ? 1 / 3 : 1;
        return acc + r.amount * factor;
      }, 0);
    const activeCount = items.filter((r) => r.active).length;
    return { monthlyExpense, activeCount };
  }, [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!name.trim()) {
      setError("O nome da rubrica é obrigatório.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Introduz um valor superior a zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createRecurringRuleAction({
      name: name.trim(),
      type,
      amount: value,
      categoryId: categoryId || undefined,
      frequency,
      dayOfMonth: Number(dayOfMonth) || 1,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setFormOpen(false);
      setName("");
      setAmount("");
      setNotes("");
    } else {
      setError(res.error ?? "Erro ao criar a rubrica.");
    }
  };

  const toggle = async (rule: RecurringRule) => {
    const res = await toggleRecurringRuleAction(rule.id, !rule.active);
    if (res.ok) {
      setItems((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, active: !rule.active } : r))
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">Rubricas Recorrentes</h1>
          <p className="text-xs text-[#a9adae]">
            Renda, contabilidade, seguros, marketing e outros custos fixos — lançados automaticamente por agenda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <FinanceSubNav active="recurring" />
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span>Nova Rubrica</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card className="p-4">
          <span className="text-xs font-semibold text-[#a9adae]">Custo fixo mensal</span>
          <span className="block mt-2 text-xl font-bold font-mono text-[#c96a6a]">
            {formatCurrency(totals.monthlyExpense)}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-semibold text-[#a9adae]">Rubricas ativas</span>
          <span className="block mt-2 text-xl font-bold font-mono text-[#f1ede5]">
            {totals.activeCount}
          </span>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <Card className="p-8 text-center text-xs text-[#8a9092]">
            Sem rubricas recorrentes.
          </Card>
        )}
        {items.map((r) => (
          <Card
            key={r.id}
            className="flex items-center justify-between gap-4 p-4 bg-[#101314] border border-white/[0.06]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
                  r.type === "income" ? "bg-[#142618] text-[#68a46b]" : "bg-[#1f1b14] text-[#f7d46d]"
                }`}
              >
                <Repeat className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#f1ede5] truncate">{r.name}</span>
                  {r.active ? (
                    <Badge variant="outline" className="text-[10px]">
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px]">
                      Inativa
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-[#8a9092]">
                  {FREQUENCY_LABELS[r.frequency]} · dia {r.dayOfMonth}
                  {r.categoryName ? ` · ${r.categoryName}` : ""}
                  {r.notes ? ` · ${r.notes}` : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={
                  "font-mono font-bold text-sm " +
                  (r.type === "income" ? "text-[#68a46b]" : "text-[#c96a6a]")
                }
              >
                {r.type === "income" ? "+" : "−"}
                {formatCurrency(r.amount)}
              </span>
              <button
                onClick={() => toggle(r)}
                className={`p-2 rounded-md border transition-colors ${
                  r.active
                    ? "border-[#68a46b]/40 text-[#68a46b] hover:bg-[#142618]"
                    : "border-white/[0.1] text-[#8a9092] hover:bg-white/[0.04]"
                }`}
                title={r.active ? "Desativar" : "Ativar"}
                aria-label={r.active ? "Desativar rubrica" : "Ativar rubrica"}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] bg-[#101314] border border-white/[0.1] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <span className="text-sm font-bold text-[#f1ede5]">Nova Rubrica Recorrente</span>
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
                        ? "border-[#d3a548]/50 bg-[#1f1b14] text-[#f7d46d]"
                        : "border-white/[0.08] bg-[#0c0f10] text-[#8a9092]"
                    }`}
                  >
                    {t === "expense" ? "Saída (Despesa)" : "Entrada (Receita)"}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="rr-name" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Nome
                </label>
                <input
                  id="rr-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Renda do pavilhão"
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rr-amount" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Valor (€)
                  </label>
                  <input
                    id="rr-amount"
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
                  <label htmlFor="rr-day" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Dia do mês
                  </label>
                  <input
                    id="rr-day"
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rr-freq" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Frequência
                  </label>
                  <select
                    id="rr-freq"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringRuleCreateInput["frequency"])}
                    className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] outline-none px-3"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rr-cat" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                    Categoria
                  </label>
                  <select
                    id="rr-cat"
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
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="rr-notes" className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                  Notas
                </label>
                <input
                  id="rr-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contexto, contrato, acordos…"
                  className="h-10 w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none px-3"
                />
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
                  <span>{submitting ? "A criar…" : "Criar Rubrica"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
