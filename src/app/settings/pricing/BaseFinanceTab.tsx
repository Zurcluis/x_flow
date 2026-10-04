"use client";

import React, { useMemo, useState } from "react";
import { Check, Info, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  PricingExpenseItem,
  PricingPolicy,
  PricingRates,
  PricingValidationError,
} from "@/domains/pricing/types";
import { validatePolicy } from "@/domains/pricing/engine";
import { formatCurrency, formatNumber } from "@/lib/formatting";
import {
  DateInput,
  FeedbackBanner,
  Field,
  NumberInput,
} from "./controls";
import {
  buildFormPolicy,
  expenseTotals,
  formatRate,
  tryResolveRates,
  type PolicyForm,
} from "./pricing-utils";

const RATE_LINES: {
  label: string;
  unit: "/h" | "/dia";
  get: (rates: PricingRates) => number;
}[] = [
  { label: "Base diária agregada", unit: "/dia", get: (r) => r.dailyBaseAggregated },
  { label: "Despesas por hora", unit: "/h", get: (r) => r.hourlyExpenseAggregated },
  { label: "Objetivo de lucro por hora", unit: "/h", get: (r) => r.profitHourly },
  { label: "Tarifa completa", unit: "/h", get: (r) => r.completeHourlyRate },
  { label: "Tarifa pontual", unit: "/h", get: (r) => r.spotHourlyRate },
];

export function BaseFinanceTab({
  form,
  onFormChange,
  items,
  initialPolicy,
  onSavePolicy,
  onGoToExpenses,
}: {
  form: PolicyForm;
  onFormChange: (patch: Partial<PolicyForm>) => void;
  items: PricingExpenseItem[];
  initialPolicy: PricingPolicy | null;
  onSavePolicy: (
    intent: "draft" | "publish"
  ) => Promise<{ ok: true; version: number } | { ok: false; error: string }>;
  onGoToExpenses: () => void;
}) {
  const [errors, setErrors] = useState<PricingValidationError[]>([]);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [scenarioDays, setScenarioDays] = useState<number>(22);

  const totals = useMemo(() => expenseTotals(items), [items]);
  const beforeRates = useMemo(
    () => tryResolveRates(initialPolicy, items),
    [initialPolicy, items]
  );
  const afterRates = useMemo(
    () => tryResolveRates(buildFormPolicy(form), items),
    [form, items]
  );

  const daysMissing =
    form.method === "monthly" &&
    (form.productiveDaysPerMonth === null || form.productiveDaysPerMonth <= 0);

  const scenarioRates = useMemo(() => {
    if (form.method !== "manual") return null;
    if (!Number.isFinite(scenarioDays) || scenarioDays <= 0) return null;
    return tryResolveRates(
      buildFormPolicy({
        ...form,
        method: "monthly",
        productiveDaysPerMonth: Math.round(scenarioDays),
      }),
      items
    );
  }, [form, items, scenarioDays]);

  const handleSubmit = async (intent: "draft" | "publish") => {
    const validation = validatePolicy(buildFormPolicy(form), items);
    setErrors(validation);
    if (validation.length > 0) {
      setFeedback({
        tone: "error",
        text: "Corrige os erros antes de guardar.",
      });
      return;
    }
    setSaving(intent);
    setFeedback(null);
    const result = await onSavePolicy(intent);
    setSaving(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setFeedback({
      tone: "success",
      text:
        intent === "publish"
          ? `Base financeira aplicada (versão ${result.version}). Aplica-se aos próximos orçamentos; as propostas enviadas e aprovadas mantêm os valores guardados.`
          : `Rascunho guardado (versão ${result.version}).`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Coluna esquerda: método e parâmetros */}
      <div className="flex flex-col gap-4">
        <Card className="p-5 bg-[#101314] border border-white/[0.06] flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Método de cálculo
          </span>

          {/* Método 1: manual */}
          <div
            className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
              form.method === "manual"
                ? "bg-[#1f1b14] border-[#d3a548]"
                : "bg-[#15191a] border-white/[0.06] hover:border-white/20"
            }`}
          >
            <button
              type="button"
              onClick={() => onFormChange({ method: "manual" })}
              className="flex items-center justify-between w-full text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-[#f1ede5]">
                Valor diário manual
              </span>
              {form.method === "manual" && (
                <Check className="h-4 w-4 text-[#d3a548]" />
              )}
            </button>
            <span className="text-[11px] text-[#8a9092]">
              Define diretamente o valor diário de despesas da oficina.
            </span>
            <Field
              label="Despesas diárias (€)"
              hint="Usa este valor se preferes controlar a base à mão."
            >
              <NumberInput
                value={form.manualDailyExpenses}
                onChange={(value) =>
                  onFormChange({ manualDailyExpenses: value ?? 0 })
                }
                step={0.01}
                min={0}
                disabled={form.method !== "manual"}
              />
            </Field>
          </div>

          {/* Método 2: mensal */}
          <div
            className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
              form.method === "monthly"
                ? "bg-[#1f1b14] border-[#d3a548]"
                : "bg-[#15191a] border-white/[0.06] hover:border-white/20"
            }`}
          >
            <button
              type="button"
              onClick={() => onFormChange({ method: "monthly" })}
              className="flex items-center justify-between w-full text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-[#f1ede5]">
                Calcular pelo mês
              </span>
              {form.method === "monthly" && (
                <Check className="h-4 w-4 text-[#d3a548]" />
              )}
            </button>
            <span className="text-[11px] text-[#8a9092]">
              Total mensal das rubricas incluídas dividido pelos dias
              produtivos.
            </span>
            <div className="flex items-center justify-between gap-3 p-3 rounded-sm bg-[#080a0b] border border-white/[0.04]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#a9adae]">
                  Total mensal incluído
                </span>
                <span className="text-lg font-bold font-mono text-[#f7d46d] tabular-nums">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onGoToExpenses}>
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar despesas</span>
              </Button>
            </div>
            <Field
              label="Dias produtivos por mês"
              required={form.method === "monthly"}
              hint="Dias de trabalho usados para dividir o total mensal."
            >
              <NumberInput
                value={form.productiveDaysPerMonth}
                onChange={(value) =>
                  onFormChange({
                    productiveDaysPerMonth:
                      value === null ? null : Math.round(value),
                  })
                }
                allowEmpty
                step={1}
                min={1}
                placeholder="Ex.: 22"
                disabled={form.method !== "monthly"}
              />
            </Field>
            {daysMissing && (
              <p className="text-xs font-semibold text-[#f05a50]">
                Indica os dias de referência para calcular pelo mês.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5 bg-[#101314] border border-white/[0.06] flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Parâmetros comuns
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Horas técnicas faturáveis por dia, no total">
              <NumberInput
                value={form.dailyCapacityHours}
                onChange={(value) =>
                  onFormChange({ dailyCapacityHours: value ?? 0 })
                }
                step={0.5}
                min={0}
              />
            </Field>
            <Field label="Objetivo de lucro por dia (€)">
              <NumberInput
                value={form.profitDailyTarget}
                onChange={(value) =>
                  onFormChange({ profitDailyTarget: value ?? 0 })
                }
                step={1}
                min={0}
              />
            </Field>
            <Field label="Acréscimo por hora de serviço pontual (€)">
              <NumberInput
                value={form.spotSurchargePerHour}
                onChange={(value) =>
                  onFormChange({ spotSurchargePerHour: value ?? 0 })
                }
                step={0.5}
                min={0}
              />
            </Field>
            <Field label="Taxa de IVA (%)">
              <NumberInput
                value={form.vatRate}
                onChange={(value) => onFormChange({ vatRate: value ?? 0 })}
                step={0.1}
                min={0}
                max={100}
              />
            </Field>
            <Field label="Desperdício de material (%)">
              <NumberInput
                value={form.wasteRatePercent}
                onChange={(value) =>
                  onFormChange({ wasteRatePercent: value ?? 0 })
                }
                step={0.1}
                min={0}
                max={100}
              />
            </Field>
            <Field label="Taxa de gestão de subcontratados (%)">
              <NumberInput
                value={form.subletFeePercent}
                onChange={(value) =>
                  onFormChange({ subletFeePercent: value ?? 0 })
                }
                step={0.1}
                min={0}
                max={100}
              />
            </Field>
            <Field label="Aplicar a partir de">
              <DateInput
                value={form.effectiveFrom}
                onChange={(value) => onFormChange({ effectiveFrom: value })}
              />
            </Field>
          </div>

          {/* Experimentar cenário */}
          {form.method === "manual" && (
            <div className="flex flex-col gap-3 p-4 rounded-md bg-[#080a0b] border border-white/[0.04]">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                  Experimentar cenário
                </span>
                <span className="text-[11px] text-[#8a9092]">
                  Exemplo apenas para comparação; não publica o método mensal.
                </span>
              </div>
              <Field label="Dias produtivos para simulação">
                <NumberInput
                  value={scenarioDays}
                  onChange={(value) => setScenarioDays(value ?? 0)}
                  step={1}
                  min={1}
                />
              </Field>
              {scenarioRates ? (
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Despesas por hora", get: (r: PricingRates) => r.hourlyExpenseAggregated },
                    { label: "Tarifa completa", get: (r: PricingRates) => r.completeHourlyRate },
                    { label: "Tarifa pontual", get: (r: PricingRates) => r.spotHourlyRate },
                  ].map((line) => (
                    <div
                      key={line.label}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-[#a9adae]">{line.label}</span>
                      <span className="font-mono font-bold text-[#f1ede5] tabular-nums">
                        {formatRate(line.get(scenarioRates), "/h")}
                      </span>
                    </div>
                  ))}
                  <span className="text-[11px] text-[#8a9092]">
                    Com {formatNumber(Math.round(scenarioDays))} dias
                    produtivos por mês.
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[#8a9092]">
                  Indica os dias para simular o método mensal.
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Coluna direita: resultados */}
      <div className="lg:sticky lg:top-6 flex flex-col gap-4">
        <Card className="p-5 bg-[#101314] border border-white/[0.06] flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Resultado da configuração
          </span>

          {daysMissing ? (
            <div className="flex items-start gap-2 p-3 rounded-md bg-[#f05a50]/10 border border-[#f05a50]/30">
              <Info className="h-4 w-4 text-[#f05a50] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-[#f05a50]">
                Indica os dias de referência para calcular pelo mês.
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              {RATE_LINES.map((line) => (
                <div
                  key={line.label}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <span className="text-xs text-[#a9adae]">{line.label}</span>
                  <span className="text-xs font-mono font-bold tabular-nums text-right">
                    <span className="text-[#a9adae]">
                      {beforeRates
                        ? formatRate(line.get(beforeRates), line.unit)
                        : "—"}
                    </span>
                    <span className="text-[#8a9092] px-1.5">→</span>
                    <span className="text-[#f7d46d]">
                      {afterRates
                        ? formatRate(line.get(afterRates), line.unit)
                        : "—"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {!beforeRates && !daysMissing && (
            <p className="text-[11px] text-[#8a9092]">
              Sem base publicada: o valor «antes» fica em branco até aplicares
              a primeira configuração.
            </p>
          )}

          <div className="p-3 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30 text-xs text-[#f7d46d] font-semibold">
            Esta alteração aplica-se aos novos cálculos. As propostas enviadas
            e aprovadas mantêm os valores guardados.
          </div>

          {errors.length > 0 && (
            <div className="flex flex-col gap-1 p-3 rounded-md bg-[#f05a50]/10 border border-[#f05a50]/30">
              {errors.map((error) => (
                <p
                  key={error.field}
                  className="text-xs font-semibold text-[#f05a50]"
                >
                  {error.message}
                </p>
              ))}
            </div>
          )}

          {feedback && (
            <FeedbackBanner
              tone={feedback.tone}
              text={feedback.text}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => handleSubmit("draft")}
              disabled={saving !== null}
              className="flex-1"
            >
              <span>
                {saving === "draft" ? "A guardar…" : "Guardar rascunho"}
              </span>
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit("publish")}
              disabled={saving !== null || daysMissing}
              className="flex-1"
            >
              <span>
                {saving === "publish"
                  ? "A aplicar…"
                  : "Aplicar aos próximos orçamentos"}
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
