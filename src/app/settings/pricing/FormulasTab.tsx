"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  FormulaComponent,
  FormulaComponentParams,
  FormulaComponentType,
  PricingRates,
  SuggestionResult,
} from "@/domains/pricing/types";
import type { PricingFormulaSummary } from "@/server/pricing";
import {
  computeSuggestion,
  DEFAULT_FORMULA_COMPONENTS,
  FORMULA_LABELS,
  round2,
} from "@/domains/pricing/engine";
import type { PublishFormulaInput } from "@/app/actions/pricing";
import { formatCurrency } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import {
  DateInput,
  FeedbackBanner,
  Field,
  NumberInput,
  SelectInput,
  ToggleSwitch,
  todayISO,
} from "./controls";
import {
  cloneComponents,
  defaultParamsFor,
  formatSignedCurrency,
  newId,
  toFormulaVersion,
} from "./pricing-utils";

type FormulaCardCode = "complete" | "spot";

const ALL_COMPONENT_TYPES = Object.keys(FORMULA_LABELS) as FormulaComponentType[];

const CARD_TITLES: Record<FormulaCardCode, string> = {
  complete: "Serviço completo",
  spot: "Serviço pontual",
};

const CARD_MODE_LABELS: Record<FormulaCardCode, string> = {
  complete: "Completo",
  spot: "Pontual",
};

function componentsForCode(
  formulas: PricingFormulaSummary[],
  code: FormulaCardCode
): FormulaComponent[] {
  const summary = formulas.find((item) => item.code === code);
  return summary?.published?.components ?? DEFAULT_FORMULA_COMPONENTS[code];
}

type PublishResult = {
  ok: true;
  versionId: string;
  version: number;
} | {
  ok: false;
  error: string;
};

function buildTestLines(
  components: FormulaComponent[],
  code: FormulaCardCode,
  testMode: "complete" | "spot",
  testHours: number,
  testMaterial: number,
  rates: PricingRates | null
) {
  return {
    serviceLines: [
      {
        name: "Serviço de teste",
        mode: testMode,
        hours: Number.isFinite(testHours) ? testHours : 0,
        notes: null,
        sortOrder: 0,
      },
    ],
    costLines: [
      {
        lineType: "material" as const,
        name: "Material de teste",
        quantity: 1,
        unit: "unit" as const,
        unitCost: Number.isFinite(testMaterial) ? testMaterial : 0,
        wasteRatePercent: rates?.wasteRatePercent ?? 0,
        totalCost: round2((testMaterial || 0) * (1 + (rates?.wasteRatePercent ?? 0) / 100)),
        kitId: null,
        supplierServiceId: null,
        materialId: null,
        deductedHours: null,
        notes: null,
        sortOrder: 0,
      },
    ],
    formula: toFormulaVersion(code, components),
  };
}

export function FormulasTab({
  formulas,
  rates,
  publishFormula,
}: {
  formulas: PricingFormulaSummary[];
  rates: PricingRates | null;
  publishFormula: (
    input: PublishFormulaInput
  ) => Promise<PublishResult>;
}) {
  const [focus, setFocus] = useState<FormulaCardCode>("complete");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(() => todayISO());
  const [publishing, setPublishing] = useState<FormulaCardCode | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  // Teste
  const [testHours, setTestHours] = useState<number>(3);
  const [testMaterial, setTestMaterial] = useState<number>(50);
  const [testMode, setTestMode] = useState<"complete" | "spot">("complete");

  const [completeComponents, setCompleteComponents] =
    useState<FormulaComponent[]>(
      () => cloneComponents(componentsForCode(formulas, "complete"))
    );
  const [spotComponents, setSpotComponents] = useState<FormulaComponent[]>(
    () => cloneComponents(componentsForCode(formulas, "spot"))
  );
  const [originalComplete, setOriginalComplete] =
    useState<FormulaComponent[]>(
      () => cloneComponents(componentsForCode(formulas, "complete"))
    );
  const [originalSpot, setOriginalSpot] = useState<FormulaComponent[]>(
    () => cloneComponents(componentsForCode(formulas, "spot"))
  );

  const editing: Record<FormulaCardCode, FormulaComponent[]> = {
    complete: completeComponents,
    spot: spotComponents,
  };
  const originals: Record<FormulaCardCode, FormulaComponent[]> = {
    complete: originalComplete,
    spot: originalSpot,
  };

  const setEditing = (
    code: FormulaCardCode,
    updater: (prev: FormulaComponent[]) => FormulaComponent[]
  ) => {
    if (code === "complete") setCompleteComponents(updater);
    else setSpotComponents(updater);
  };

  const handleToggle = (code: FormulaCardCode, id: string, enabled: boolean) =>
    setEditing(code, (prev) =>
      prev.map((component) =>
        component.id === id ? { ...component, enabled } : component
      )
    );

  const handleParams = (
    code: FormulaCardCode,
    id: string,
    params: Partial<FormulaComponentParams>
  ) =>
    setEditing(code, (prev) =>
      prev.map((component) =>
        component.id === id
          ? { ...component, params: { ...component.params, ...params } }
          : component
      )
    );

  const handleMove = (code: FormulaCardCode, id: string, direction: -1 | 1) =>
    setEditing(code, (prev) => {
      const index = prev.findIndex((component) => component.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });

  const handleRemove = (code: FormulaCardCode, id: string) =>
    setEditing(code, (prev) => prev.filter((component) => component.id !== id));

  const handleAdd = (code: FormulaCardCode, type: FormulaComponentType) => {
    if (!type) return;
    const component: FormulaComponent = {
      id: newId(`comp-${code}`),
      type,
      label: FORMULA_LABELS[type],
      enabled: false,
      params: defaultParamsFor(type),
    };
    setEditing(code, (prev) => [...prev, component]);
  };

  const handlePublish = async (code: FormulaCardCode) => {
    const summary = formulas.find((item) => item.code === code);
    if (!summary) {
      setFeedback({ tone: "error", text: "Fórmula não encontrada no sistema." });
      return;
    }
    if (summary.isArchived) return;
    setPublishing(code);
    const result = await publishFormula({
      formulaId: summary.formulaId,
      name: summary.published?.name ?? summary.name,
      description: summary.published?.description ?? null,
      components: editing[code],
      effectiveFrom,
    });
    setPublishing(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    if (code === "complete") setOriginalComplete(cloneComponents(editing[code]));
    else setOriginalSpot(cloneComponents(editing[code]));
    setFeedback({
      tone: "success",
      text: "Aplicado aos próximos orçamentos. Propostas enviadas mantêm-se.",
    });
  };

  const focusedComponents = editing[focus];
  const originalFocused = originals[focus];

  let testResult: SuggestionResult | null = null;
  if (rates) {
    try {
      testResult = computeSuggestion({
        rates,
        ...buildTestLines(focusedComponents, focus, testMode, testHours, testMaterial, rates),
      });
    } catch {
      testResult = null;
    }
  }

  let testOriginal: SuggestionResult | null = null;
  if (rates) {
    try {
      testOriginal = computeSuggestion({
        rates,
        ...buildTestLines(originalFocused, focus, testMode, testHours, testMaterial, rates),
      });
    } catch {
      testOriginal = null;
    }
  }

  const difference =
    testResult && testOriginal
      ? round2(testResult.suggestedPriceBeforeVat - testOriginal.suggestedPriceBeforeVat)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          text={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-4">
          {(["complete", "spot"] as FormulaCardCode[]).map((code) => (
            <FormulaCard
              key={code}
              code={code}
              summary={formulas.find((item) => item.code === code)}
              components={editing[code]}
              focused={focus === code}
              onSelect={() => setFocus(code)}
              onToggle={(id, enabled) => handleToggle(code, id, enabled)}
              onParams={(id, params) => handleParams(code, id, params)}
              onMove={(id, direction) => handleMove(code, id, direction)}
              onRemove={(id) => handleRemove(code, id)}
              onAdd={(type) => handleAdd(code, type)}
              effectiveFrom={effectiveFrom}
              onEffectiveFromChange={setEffectiveFrom}
              publishing={publishing === code}
              onPublish={() => handlePublish(code)}
            />
          ))}
        </div>

        {/* Painel de teste */}
        <div className="lg:sticky lg:top-6">
          <Card className="p-5 bg-[#101314] border border-white/[0.06] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                Teste da fórmula
              </span>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                {CARD_TITLES[focus]}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Horas de serviço">
                <NumberInput
                  value={testHours}
                  onChange={(value) => setTestHours(value ?? 0)}
                  step={0.5}
                  min={0}
                />
              </Field>
              <Field label="Material (€)">
                <NumberInput
                  value={testMaterial}
                  onChange={(value) => setTestMaterial(value ?? 0)}
                  step={0.01}
                  min={0}
                />
              </Field>
              <Field label="Modo">
                <SelectInput
                  value={testMode}
                  onChange={(value) =>
                    setTestMode(value as "complete" | "spot")
                  }
                >
                  <option value="complete">Completo</option>
                  <option value="spot">Pontual</option>
                </SelectInput>
              </Field>
            </div>

            {!rates ? (
              <div className="flex items-start gap-2 p-3 rounded-md bg-[#f05a50]/10 border border-[#f05a50]/30">
                <TriangleAlert className="h-4 w-4 text-[#f05a50] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-[#f05a50]">
                  Resolve primeiro a base financeira no separador «Base
                  financeira» para testar a fórmula.
                </span>
              </div>
            ) : !testResult ? (
              <p className="text-xs text-[#8a9092]">
                Sem resultado para os valores introduzidos.
              </p>
            ) : (
              <>
                <div className="flex flex-col">
                  {testResult.breakdown.length === 0 ? (
                    <p className="text-xs text-[#8a9092] py-2">
                      Sem componentes ativos para decompor. Ativa componentes
                      na fórmula em foco.
                    </p>
                  ) : (
                    testResult.breakdown.map((line, index) => (
                      <div
                        key={`${line.type}-${index}`}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-0"
                      >
                        <span className="text-xs text-[#a9adae]">
                          {line.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#f1ede5] tabular-nums">
                          {formatCurrency(line.value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-bold text-[#f1ede5]">
                    Preço sugerido (antes de IVA)
                  </span>
                  <span className="text-base font-bold font-mono text-[#f7d46d] tabular-nums">
                    {formatCurrency(testResult.suggestedPriceBeforeVat)}
                  </span>
                </div>

                {testOriginal && difference !== null && (
                  <p className="text-[11px] text-[#8a9092] leading-relaxed">
                    Resultado anterior:{" "}
                    <span className="font-mono text-[#a9adae]">
                      {formatCurrency(testOriginal.suggestedPriceBeforeVat)}
                    </span>{" "}
                    · Novo:{" "}
                    <span className="font-mono text-[#f1ede5]">
                      {formatCurrency(testResult.suggestedPriceBeforeVat)}
                    </span>{" "}
                    · Diferença:{" "}
                    <span
                      className={cn(
                        "font-mono font-bold",
                        difference > 0
                          ? "text-[#f7d46d]"
                          : difference < 0
                            ? "text-[#f05a50]"
                            : "text-[#a9adae]"
                      )}
                    >
                      {formatSignedCurrency(difference)}
                    </span>
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormulaCard({
  code,
  summary,
  components,
  focused,
  onSelect,
  onToggle,
  onParams,
  onMove,
  onRemove,
  onAdd,
  effectiveFrom,
  onEffectiveFromChange,
  publishing,
  onPublish,
}: {
  code: FormulaCardCode;
  summary: PricingFormulaSummary | undefined;
  components: FormulaComponent[];
  focused: boolean;
  onSelect: () => void;
  onToggle: (id: string, enabled: boolean) => void;
  onParams: (id: string, params: Partial<FormulaComponentParams>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAdd: (type: FormulaComponentType) => void;
  effectiveFrom: string;
  onEffectiveFromChange: (value: string) => void;
  publishing: boolean;
  onPublish: () => void;
}) {
  const isArchived = Boolean(summary?.isArchived);

  return (
    <Card
      className={cn(
        "p-5 bg-[#101314] flex flex-col gap-4 transition-colors",
        focused ? "border-[#d3a548]/60" : "border-white/[0.06]",
        isArchived && "opacity-60"
      )}
    >
      <div
        className="flex items-start justify-between gap-3 pb-2 border-b border-white/[0.06] cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#f1ede5]">
              {CARD_TITLES[code]}
            </span>
            {isArchived && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Arquivada
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-[#8a9092] line-clamp-1">
            {summary?.published?.description ??
              summary?.description ??
              `Fórmula aplicada às linhas de modo ${CARD_MODE_LABELS[code].toLowerCase()}.`}
          </span>
        </div>
        {focused && <Check className="h-4 w-4 text-[#d3a548] shrink-0 mt-0.5" />}
      </div>

      <div className="flex flex-col gap-2">
        {components.length === 0 && (
          <p className="text-xs text-[#8a9092]">
            Sem componentes. Adiciona o primeiro componente à fórmula.
          </p>
        )}
        {components.map((component, index) => (
          <div
            key={component.id}
            className="flex flex-col gap-2.5 p-3 rounded-sm bg-[#15191a] border border-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <ToggleSwitch
                  checked={component.enabled}
                  onCheckedChange={(checked) => onToggle(component.id, checked)}
                  disabled={isArchived}
                  label={`Ativar componente ${component.label}`}
                />
                <span
                  className={cn(
                    "text-xs font-semibold truncate",
                    component.enabled ? "text-[#f1ede5]" : "text-[#8a9092]"
                  )}
                >
                  {component.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  aria-label="Subir componente"
                  disabled={index === 0 || isArchived}
                  onClick={() => onMove(component.id, -1)}
                  className="p-1.5 rounded-sm text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Descer componente"
                  disabled={index === components.length - 1 || isArchived}
                  onClick={() => onMove(component.id, 1)}
                  className="p-1.5 rounded-sm text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remover componente"
                  disabled={isArchived}
                  onClick={() => onRemove(component.id)}
                  className="p-1.5 rounded-sm text-[#8a9092] hover:text-[#f05a50] hover:bg-[#f05a50]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {component.type === "fixed_amount" && (
              <div className="max-w-48">
                <Field label="Montante (€)">
                  <NumberInput
                    value={component.params.amount ?? 0}
                    onChange={(value) =>
                      onParams(component.id, { amount: value ?? 0 })
                    }
                    step={0.01}
                    disabled={isArchived}
                  />
                </Field>
              </div>
            )}

            {component.type === "material_margin" && (
              <div className="max-w-48">
                <Field label="Acréscimo (%)">
                  <NumberInput
                    value={component.params.percent ?? 0}
                    onChange={(value) =>
                      onParams(component.id, { percent: value ?? 0 })
                    }
                    step={0.1}
                    disabled={isArchived}
                  />
                </Field>
              </div>
            )}

            {component.type === "percent_adjust" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Acréscimo (%)">
                  <NumberInput
                    value={component.params.percent ?? 0}
                    onChange={(value) =>
                      onParams(component.id, { percent: value ?? 0 })
                    }
                    step={0.1}
                    disabled={isArchived}
                  />
                </Field>
                <Field label="Base de cálculo">
                  <SelectInput
                    value={component.params.base ?? "subtotal_before_percent"}
                    onChange={(value) =>
                      onParams(component.id, {
                        base: value as FormulaComponentParams["base"],
                      })
                    }
                    disabled={isArchived}
                  >
                    <option value="material">Material</option>
                    <option value="service_part">Parcela de serviço</option>
                    <option value="subtotal_before_percent">
                      Subtotal antes de acréscimos
                    </option>
                  </SelectInput>
                </Field>
              </div>
            )}

            {component.type === "expense_base" && (
              <div className="max-w-56">
                <Field label="Âmbito">
                  <SelectInput
                    value={component.params.scope ?? "aggregated"}
                    onChange={(value) =>
                      onParams(component.id, {
                        scope: value as FormulaComponentParams["scope"],
                      })
                    }
                    disabled={isArchived}
                  >
                    <option value="aggregated">Agregado</option>
                    <option value="operational">Operação</option>
                    <option value="cash_recovery">Aquisição</option>
                  </SelectInput>
                </Field>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Adicionar componente">
          <SelectInput
            value=""
            onChange={(value) => onAdd(value as FormulaComponentType)}
            disabled={isArchived}
          >
            <option value="">Escolher tipo de componente…</option>
            {ALL_COMPONENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {FORMULA_LABELS[type]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="flex items-end">
          <span className="text-[11px] text-[#8a9092]">
            Novos componentes entram desativados; ajusta os parâmetros e ativa
            quando estiver pronto.
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-3 border-t border-white/[0.06]">
        <Field label="Aplicar a partir de" className="w-full sm:w-44">
          <DateInput
            value={effectiveFrom}
            onChange={onEffectiveFromChange}
            disabled={isArchived}
          />
        </Field>
        <Button
          variant="primary"
          className="sm:ml-auto"
          onClick={onPublish}
          disabled={!summary || isArchived || publishing}
        >
          <Upload className="h-4 w-4" />
          <span>{publishing ? "A publicar…" : "Publicar versão"}</span>
        </Button>
      </div>

      {isArchived && (
        <p className="text-xs text-[#8a9092]">
          Fórmula arquivada: consulta apenas, sem edição nem publicação.
        </p>
      )}
      {!summary && (
        <p className="text-xs font-semibold text-[#f05a50]">
          Sem registo desta fórmula no sistema: não é possível publicar.
        </p>
      )}
    </Card>
  );
}
