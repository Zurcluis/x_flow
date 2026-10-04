"use client";

import React, { useMemo, useState } from "react";
import {
  Archive,
  Check,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ExpenseCategory,
  ExpenseKind,
  ExpenseValidationState,
  PricingExpenseItem,
} from "@/domains/pricing/types";
import type { SaveExpenseItemInput } from "@/app/actions/pricing";
import { round2 } from "@/domains/pricing/engine";
import { formatCurrency } from "@/lib/formatting";
import {
  CheckboxRow,
  DateInput,
  FeedbackBanner,
  Field,
  ModalShell,
  NumberInput,
  SelectInput,
  TextInput,
  ToggleSwitch,
  todayISO,
} from "./controls";
import { expenseTotals } from "./pricing-utils";

const KIND_LABELS: Record<ExpenseKind, string> = {
  expense: "Despesa",
  provision: "Provisão",
  reserve: "Reserva",
  cash_recovery: "Aquisição — recuperação de caixa",
};

const KIND_VARIANTS: Record<ExpenseKind, "default" | "in_progress" | "outline" | "gold"> = {
  expense: "default",
  provision: "in_progress",
  reserve: "outline",
  cash_recovery: "gold",
};

const VALIDATION_LABELS: Record<ExpenseValidationState, string> = {
  estimated: "Estimado",
  validated: "Validado",
  needs_breakdown: "Por discriminar",
};

const VALIDATION_VARIANTS: Record<ExpenseValidationState, "in_progress" | "success" | "danger"> = {
  estimated: "in_progress",
  validated: "success",
  needs_breakdown: "danger",
};

type SaveItemResult = {
  ok: true;
  id: string;
  version: number;
} | {
  ok: false;
  error: string;
};

type SimpleResult = {
  ok: true;
} | {
  ok: false;
  error: string;
};

function TotalsCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg bg-[#101314] border border-white/[0.06] flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
        {title}
      </span>
      <span
        className={`text-xl font-bold tabular-nums ${
          accent ? "text-[#f7d46d]" : "text-[#f1ede5]"
        }`}
      >
        {formatCurrency(value)}
      </span>
      <span className="text-[11px] text-[#8a9092]">
        Rubricas incluídas na base de preços
      </span>
    </div>
  );
}

export function ExpensesTab({
  items,
  saveItem,
  archiveItem,
  methodNote,
}: {
  items: PricingExpenseItem[];
  saveItem: (
    input: SaveExpenseItemInput
  ) => Promise<SaveItemResult>;
  archiveItem: (
    itemId: string,
    effectiveTo: string
  ) => Promise<SimpleResult>;
  methodNote: string | null;
}) {
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricingExpenseItem | null>(
    null
  );
  const [pendingToggle, setPendingToggle] = useState<{
    id: string;
    next: boolean;
  } | null>(null);
  const [pendingArchive, setPendingArchive] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = useMemo(() => expenseTotals(items), [items]);

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const item = items.find((i) => i.id === pendingToggle.id);
    if (!item) {
      setPendingToggle(null);
      return;
    }
    setBusyId(item.id);
    const result = await saveItem({
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      category: item.category,
      kind: item.kind,
      amount: item.amount,
      periodicity: item.periodicity,
      includedInPricing: pendingToggle.next,
      includesPersonnel: item.includesPersonnel,
      source: item.source ?? null,
      validationState: item.validationState,
      effectiveFrom: todayISO(),
      notes: item.notes ?? null,
    });
    setBusyId(null);
    setPendingToggle(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
    }
  };

  const confirmArchive = async () => {
    if (!pendingArchive) return;
    setBusyId(pendingArchive);
    const result = await archiveItem(pendingArchive, todayISO());
    setBusyId(null);
    setPendingArchive(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setFeedback({
      tone: "success",
      text: "Rubrica arquivada. Deixa de contar para a base de preços.",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TotalsCard title="Operação e reservas" value={totals.operational} />
        <TotalsCard title="Aquisição a recuperar" value={totals.acquisition} />
        <TotalsCard title="Total mensal" value={totals.total} accent />
      </div>

      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          text={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <Card className="bg-[#101314] border border-white/[0.06]">
        <div className="flex items-center justify-between gap-3 p-5 pb-4 border-b border-white/[0.06]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Rubricas mensais
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Nova rubrica</span>
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2 text-center">
            <span className="text-sm font-semibold text-[#f1ede5]">
              Sem rubricas registadas
            </span>
            <span className="text-xs text-[#8a9092] max-w-sm">
              Cria a primeira rubrica de despesa, provisão, reserva ou
              recuperação de caixa para compor a base financeira dos
              orçamentos.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-[#8a9092]">
                <tr>
                  <th className="pb-3 pt-4 px-5 font-semibold">Rubrica</th>
                  <th className="pb-3 pt-4 px-3 font-semibold">Tipo</th>
                  <th className="pb-3 pt-4 px-3 font-semibold text-right">
                    Valor mensal
                  </th>
                  <th className="pb-3 pt-4 px-3 font-semibold">Estado</th>
                  <th className="pb-3 pt-4 px-3 font-semibold text-center">
                    Incluída
                  </th>
                  <th className="pb-3 pt-4 px-5 font-semibold text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-[#f1ede5] block">
                          {item.name}
                        </span>
                        {item.description && (
                          <span className="text-[11px] text-[#8a9092] block mt-0.5 line-clamp-1">
                            {item.description}
                          </span>
                        )}
                        {item.includesPersonnel && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 mt-1.5 text-[#a9adae] border-white/10 bg-[#15191a]"
                          >
                            Pessoal já incluído
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={KIND_VARIANTS[item.kind]}
                          className="text-[11px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {KIND_LABELS[item.kind]}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#f7d46d] whitespace-nowrap">
                        {formatCurrency(item.monthlyEquivalent)}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={VALIDATION_VARIANTS[item.validationState]}
                          className="text-[11px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {VALIDATION_LABELS[item.validationState]}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <ToggleSwitch
                          checked={item.includedInPricing}
                          onCheckedChange={(next) =>
                            setPendingToggle({ id: item.id, next })
                          }
                          disabled={busyId === item.id}
                          label="Incluída na base de preços"
                        />
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setEditorOpen(true);
                            }}
                            disabled={busyId === item.id}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#f05a50] hover:text-[#f05a50]"
                            onClick={() => setPendingArchive(item.id)}
                            disabled={busyId === item.id}
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Arquivar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {pendingToggle?.id === item.id && (
                      <tr className="bg-[#1f1b14]/40">
                        <td colSpan={6} className="py-2.5 px-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-[#f1ede5]">
                              {pendingToggle.next
                                ? "Incluir esta rubrica na base de preços?"
                                : "Retirar esta rubrica da base de preços?"}
                            </span>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPendingToggle(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={confirmToggle}
                                disabled={busyId === item.id}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {pendingArchive === item.id && (
                      <tr className="bg-[#f05a50]/5">
                        <td colSpan={6} className="py-2.5 px-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-xs text-[#f05a50] font-semibold">
                              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                              Arquivar esta rubrica? Deixa de contar para a
                              base de preços.
                            </span>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPendingArchive(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={confirmArchive}
                                disabled={busyId === item.id}
                              >
                                Confirmar arquivo
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editorOpen && (
        <ExpenseFormModal
          key={editingItem?.id ?? "new"}
          initial={editingItem}
          items={items}
          includedMonthlyTotal={totals.total}
          methodNote={methodNote}
          onSubmit={saveItem}
          onClose={() => {
            setEditorOpen(false);
            setEditingItem(null);
          }}
          onDone={(wasEdit) => {
            setEditorOpen(false);
            setEditingItem(null);
            setFeedback(
              wasEdit
                ? {
                    tone: "success",
                    text:
                      "Nova versão criada. As propostas enviadas e aprovadas mantêm os valores guardados.",
                  }
                : { tone: "success", text: "Rubrica criada." }
            );
          }}
        />
      )}
    </div>
  );
}

function ExpenseFormModal({
  initial,
  items,
  includedMonthlyTotal,
  methodNote,
  onSubmit,
  onClose,
  onDone,
}: {
  initial: PricingExpenseItem | null;
  items: PricingExpenseItem[];
  includedMonthlyTotal: number;
  methodNote: string | null;
  onSubmit: (input: SaveExpenseItemInput) => Promise<SaveItemResult>;
  onClose: () => void;
  onDone: (wasEdit: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(
    initial?.category ?? "operational"
  );
  const [kind, setKind] = useState<ExpenseKind>(initial?.kind ?? "expense");
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [periodicity, setPeriodicity] = useState<"monthly" | "yearly">(
    initial?.periodicity ?? "monthly"
  );
  const [included, setIncluded] = useState(initial?.includedInPricing ?? true);
  const [personnel, setPersonnel] = useState(
    initial?.includesPersonnel ?? false
  );
  const [source, setSource] = useState(initial?.source ?? "");
  const [validationState, setValidationState] =
    useState<ExpenseValidationState>(initial?.validationState ?? "estimated");
  const [effectiveFrom, setEffectiveFrom] = useState(
    initial?.effectiveFrom ?? todayISO()
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyEquivalent = useMemo(
    () =>
      periodicity === "yearly" ? round2(amount / 12) : round2(amount),
    [amount, periodicity]
  );

  const projectedTotal = useMemo(() => {
    const draftEquivalent = included ? monthlyEquivalent : 0;
    if (initial) {
      const oldEquivalent = initial.includedInPricing
        ? initial.monthlyEquivalent
        : 0;
      return round2(includedMonthlyTotal - oldEquivalent + draftEquivalent);
    }
    return round2(includedMonthlyTotal + draftEquivalent);
  }, [initial, included, monthlyEquivalent, includedMonthlyTotal]);

  const includedCount = useMemo(
    () => items.filter((item) => item.includedInPricing).length,
    [items]
  );

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Indica o nome da rubrica.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError("O valor tem de ser igual ou superior a zero.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSubmit({
      id: initial?.id,
      name: name.trim(),
      description: description.trim() || null,
      category,
      kind,
      amount,
      periodicity,
      includedInPricing: included,
      includesPersonnel: personnel,
      source: source.trim() || null,
      validationState,
      effectiveFrom,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone(Boolean(initial));
  };

  return (
    <ModalShell
      title={initial ? "Editar rubrica" : "Nova rubrica"}
      onClose={onClose}
      wide
    >
      <div className="flex flex-col gap-4 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome da rubrica" required>
            <TextInput
              value={name}
              onChange={setName}
              placeholder="Ex.: Renda do pavilhão"
            />
          </Field>
          <Field label="Descrição">
            <TextInput
              value={description}
              onChange={setDescription}
              placeholder="Detalhe opcional da rubrica"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <SelectInput
              value={category}
              onChange={(value) => setCategory(value as ExpenseCategory)}
            >
              <option value="operational">Operacional</option>
              <option value="acquisition">Aquisição — recuperação de caixa</option>
            </SelectInput>
          </Field>
          <Field label="Tipo">
            <SelectInput
              value={kind}
              onChange={(value) => setKind(value as ExpenseKind)}
            >
              <option value="expense">Despesa</option>
              <option value="provision">Provisão</option>
              <option value="reserve">Reserva</option>
              <option value="cash_recovery">Recuperação de caixa</option>
            </SelectInput>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Valor"
            required
            hint={
              periodicity === "yearly"
                ? `Equivalente mensal: ${formatCurrency(monthlyEquivalent)}`
                : undefined
            }
          >
            <NumberInput value={amount} onChange={(value) => setAmount(value ?? 0)} step={0.01} min={0} />
          </Field>
          <Field label="Periodicidade">
            <SelectInput
              value={periodicity}
              onChange={(value) =>
                setPeriodicity(value as "monthly" | "yearly")
              }
            >
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </SelectInput>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CheckboxRow
            label="Incluída na base de preços"
            description="Conta para a base diária dos orçamentos"
            checked={included}
            onChange={setIncluded}
          />
          <CheckboxRow
            label="Custos de pessoal incluídos"
            description="A remuneração da equipa está neste valor"
            checked={personnel}
            onChange={setPersonnel}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fonte">
            <TextInput
              value={source}
              onChange={setSource}
              placeholder="Ex.: fatura, contratos, estimativa"
            />
          </Field>
          <Field label="Estado de validação">
            <SelectInput
              value={validationState}
              onChange={(value) =>
                setValidationState(value as ExpenseValidationState)
              }
            >
              <option value="estimated">Estimado</option>
              <option value="validated">Validado</option>
              <option value="needs_breakdown">Por discriminar</option>
            </SelectInput>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data de início de vigência" required>
            <DateInput value={effectiveFrom} onChange={setEffectiveFrom} />
          </Field>
          <Field label="Notas">
            <TextInput
              value={notes}
              onChange={setNotes}
              placeholder="Observações internas"
            />
          </Field>
        </div>

        {/* Pré-visualização em direto */}
        <div className="p-3.5 rounded-md bg-[#080a0b] border border-white/[0.06] text-xs text-[#a9adae] flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548]">
            Pré-visualização em direto
          </span>
          <span>
            Total atual:{" "}
            <strong className="text-[#f1ede5]">
              {formatCurrency(includedMonthlyTotal)}
            </strong>{" "}
            → Total com alteração:{" "}
            <strong className="text-[#f7d46d]">
              {formatCurrency(projectedTotal)}
            </strong>
          </span>
          <span className="text-[11px] text-[#8a9092]">
            {includedCount} rubrica{includedCount === 1 ? "" : "s"} incluída
            {includedCount === 1 ? "" : "s"} na base de preços
          </span>
          {methodNote && (
            <span className="text-[#f7d46d] font-semibold">{methodNote}</span>
          )}
        </div>

        {error && (
          <p className="text-xs font-semibold text-[#f05a50]">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            <Check className="h-4 w-4" />
            <span>{saving ? "A guardar…" : initial ? "Guardar versão" : "Criar rubrica"}</span>
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
