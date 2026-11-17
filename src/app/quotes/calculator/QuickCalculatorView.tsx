"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FilePlus2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatting";
import type { Material } from "@/domains/materials/types";
import type { CostLineUnit } from "@/domains/pricing/types";
import {
  buildMaterialOptions,
  buildQuickCalculatorPrefill,
  calculateQuickQuote,
  createQuickLineFromPreset,
  DEFAULT_VAT_RATE,
  encodeQuickCalculatorPrefill,
  EXCEL_DEFAULT_FIXED_HOURLY_COST,
  formatQuickQuoteSummaryText,
  MARGIN_UNIT_LABELS,
  MATERIAL_UNIT_SHORT_LABELS,
  XMOTION_MATERIAL_PRESETS,
  XMOTION_SERVICE_PRESETS,
  type QuickCalculatorLine,
  type QuickMarginUnit,
} from "@/domains/pricing/quick-calculator";
import { cn } from "@/lib/utils";

interface QuickCalculatorViewProps {
  initialFixedHourlyCost: number;
  policyHourlyCost: number | null;
  initialVatRate: number;
  defaultWasteRate: number;
  stockMaterials: Material[];
}

const inputCls =
  "h-11 w-full rounded-md bg-[#080a0b] border border-white/[0.1] px-3 text-sm text-[#f1ede5] tabular-nums focus:border-[#d3a548] focus:outline-none focus:ring-1 focus:ring-[#d3a548]/40";
const selectCls =
  "h-11 w-full rounded-md bg-[#080a0b] border border-white/[0.1] px-3 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none focus:ring-1 focus:ring-[#d3a548]/40";
const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wide text-[#a9adae] mb-1";

function parseDecimal(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  if (normalized === "") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function DecimalInput({
  id,
  value,
  onValueChange,
  step = "0.01",
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
  step?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => String(value));

  const displayValue = focused ? draft : String(value);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      data-step={step}
      className={inputCls}
      value={displayValue}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === 0 ? "" : String(value));
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        onValueChange(parseDecimal(draft));
      }}
      onChange={(e) => {
        const nextRaw = e.target.value;
        setDraft(nextRaw);
        onValueChange(parseDecimal(nextRaw));
      }}
      placeholder="0"
    />
  );
}

function buildInitialLine(materialOptions: ReturnType<typeof buildMaterialOptions>): QuickCalculatorLine {
  const line = createQuickLineFromPreset("car_wrapping", "line-1", materialOptions);
  return {
    ...line,
    hours: 22,
    materialId: "ppf_m2",
    materialName: "PPF (m²)",
    materialUnit: "m2",
    materialUnitPrice: 27,
    materialQuantity: 17,
    wasteRatePercent: 0,
  };
}

export function QuickCalculatorView({
  initialFixedHourlyCost,
  policyHourlyCost,
  initialVatRate,
  defaultWasteRate,
  stockMaterials,
}: QuickCalculatorViewProps) {
  const router = useRouter();
  const materialOptions = useMemo(
    () => buildMaterialOptions(stockMaterials),
    [stockMaterials]
  );

  const [fixedHourlyCost, setFixedHourlyCost] = useState<number>(initialFixedHourlyCost);
  const [vatRate, setVatRate] = useState<number>(initialVatRate || DEFAULT_VAT_RATE);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [lines, setLines] = useState<QuickCalculatorLine[]>(() => [
    buildInitialLine(materialOptions),
  ]);
  const [nextLineSeq, setNextLineSeq] = useState(2);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      calculateQuickQuote({
        fixedHourlyCost,
        vatRate,
        discountRate,
        lines,
      }),
    [fixedHourlyCost, vatRate, discountRate, lines]
  );

  const updateLine = (lineId: string, patch: Partial<QuickCalculatorLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const handleServiceSelect = (lineId: string, serviceId: string) => {
    if (serviceId === "custom") {
      updateLine(lineId, {
        serviceId: "custom",
        serviceName: "Serviço personalizado",
      });
      return;
    }
    const preset = XMOTION_SERVICE_PRESETS.find((item) => item.id === serviceId);
    if (!preset) return;
    const suggestedMaterial = materialOptions.find(
      (item) => item.id === preset.suggestedMaterialId
    );
    updateLine(lineId, {
      serviceId: preset.id,
      serviceName: preset.label,
      marginValue: preset.defaultMargin,
      marginUnit: preset.marginUnit,
      ...(suggestedMaterial
        ? {
            materialId: suggestedMaterial.id,
            materialName:
              suggestedMaterial.id === "none" ? "" : suggestedMaterial.label,
            materialUnit: suggestedMaterial.unit,
            materialUnitPrice: suggestedMaterial.unitPrice,
          }
        : {}),
    });
  };

  const handleMaterialSelect = (lineId: string, materialId: string) => {
    const selected = materialOptions.find((item) => item.id === materialId);
    if (!selected) return;
    if (selected.id === "custom") {
      updateLine(lineId, {
        materialId: "custom",
        materialName: "Material personalizado",
      });
      return;
    }
    if (selected.id === "none") {
      updateLine(lineId, {
        materialId: "none",
        materialName: "",
        materialUnitPrice: 0,
        materialQuantity: 0,
      });
      return;
    }
    updateLine(lineId, {
      materialId: selected.id,
      materialName: selected.label,
      materialUnit: selected.unit,
      materialUnitPrice: selected.unitPrice,
      wasteRatePercent: defaultWasteRate,
    });
  };

  const addServiceFromPreset = (presetId: string) => {
    const id = `line-${nextLineSeq}`;
    setNextLineSeq((seq) => seq + 1);
    const created = createQuickLineFromPreset(presetId, id, materialOptions);
    created.wasteRatePercent = defaultWasteRate;
    setLines((prev) => [...prev, created]);
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== lineId) : prev));
  };

  const resetCalculator = () => {
    setFixedHourlyCost(initialFixedHourlyCost);
    setVatRate(initialVatRate || DEFAULT_VAT_RATE);
    setDiscountRate(0);
    setLines([buildInitialLine(materialOptions)]);
    setNextLineSeq(2);
  };

  const handleCopySummary = async () => {
    const text = formatQuickQuoteSummaryText(
      { fixedHourlyCost, vatRate, discountRate, lines },
      result
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleCreateQuote = () => {
    const prefill = buildQuickCalculatorPrefill(
      { fixedHourlyCost, vatRate, discountRate, lines },
      result
    );
    const encoded = encodeQuickCalculatorPrefill(prefill);
    router.push(`/quotes/new?calc=${encodeURIComponent(encoded)}`);
  };

  return (
    <div className="flex flex-col gap-5 pb-40 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            href="/quotes"
            className={buttonStyles({
              variant: "ghost",
              size: "sm",
              className: "p-2 shrink-0",
            })}
            aria-label="Voltar aos orçamentos"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#d3a548]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d3a548]">
                Orçamentos X-Motion
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1ede5]">
              Calculadora Rápida
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-expanded={settingsOpen}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Parâmetros ({formatCurrency(fixedHourlyCost)}/h)</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetCalculator}
            aria-label="Repor valores"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Repor</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Service Chips (ideal for 1-tap mobile use) */}
      <section aria-label="Adicionar serviço rápido" className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9092]">
          Adicionar serviço em 1 toque
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {XMOTION_SERVICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => addServiceFromPreset(preset.id)}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#101314] border border-white/[0.1] hover:border-[#d3a548]/60 hover:bg-[#1f1b14] text-xs font-medium text-[#f1ede5] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#d3a548]" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* General Parameters Panel */}
      {settingsOpen && (
        <Card className="p-4 sm:p-5 bg-[#101314] border-[#d3a548]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-[#f1ede5]">Dados Gerais</h2>
              <p className="text-xs text-[#a9adae]">
                Base horária da oficina, IVA e desconto comercial global.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFixedHourlyCost(EXCEL_DEFAULT_FIXED_HOURLY_COST)}
                className={cn(
                  "px-2.5 py-1.5 rounded text-xs font-semibold border cursor-pointer transition-colors",
                  fixedHourlyCost === EXCEL_DEFAULT_FIXED_HOURLY_COST
                    ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d]"
                    : "bg-[#080a0b] border-white/[0.08] text-[#a9adae] hover:text-[#f1ede5]"
                )}
              >
                Excel X-Motion ({formatCurrency(EXCEL_DEFAULT_FIXED_HOURLY_COST)}/h)
              </button>
              {policyHourlyCost !== null && (
                <button
                  type="button"
                  onClick={() => setFixedHourlyCost(policyHourlyCost)}
                  className={cn(
                    "px-2.5 py-1.5 rounded text-xs font-semibold border cursor-pointer transition-colors",
                    fixedHourlyCost === policyHourlyCost
                      ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d]"
                      : "bg-[#080a0b] border-white/[0.08] text-[#a9adae] hover:text-[#f1ede5]"
                  )}
                >
                  Política X-Flow ({formatCurrency(policyHourlyCost)}/h)
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="calc-fixed-hourly" className={labelCls}>
                Custo Fixo / Hora (€)
              </label>
              <DecimalInput
                id="calc-fixed-hourly"
                value={fixedHourlyCost}
                onValueChange={setFixedHourlyCost}
              />
            </div>
            <div>
              <label htmlFor="calc-vat-rate" className={labelCls}>
                IVA (%)
              </label>
              <DecimalInput
                id="calc-vat-rate"
                value={vatRate}
                onValueChange={setVatRate}
              />
            </div>
            <div>
              <label htmlFor="calc-discount-rate" className={labelCls}>
                Desconto (%)
              </label>
              <DecimalInput
                id="calc-discount-rate"
                value={discountRate}
                onValueChange={(next) => setDiscountRate(Math.min(100, next))}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Service Lines */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {lines.map((line, index) => {
            const breakdown = result.lines[index];
            const serviceSelectId = `line-service-${line.id}`;
            const serviceNameId = `line-service-name-${line.id}`;
            const hoursId = `line-hours-${line.id}`;
            const materialSelectId = `line-material-${line.id}`;
            const materialQtyId = `line-material-qty-${line.id}`;
            const materialUnitId = `line-material-unit-${line.id}`;
            const materialPriceId = `line-material-price-${line.id}`;
            const wasteId = `line-waste-${line.id}`;
            const marginId = `line-margin-${line.id}`;
            const marginUnitId = `line-margin-unit-${line.id}`;

            return (
              <Card key={line.id} className="p-4 sm:p-5 bg-[#101314] border-white/[0.08]">
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1f1b14] border border-[#d3a548]/40 text-xs font-bold text-[#f7d46d] shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-[#f1ede5] truncate">
                      {line.serviceName || `Serviço ${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#f7d46d] tabular-nums">
                      {formatCurrency(breakdown?.lineTotalBeforeVat ?? 0)}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="p-2 rounded-md text-[#8a9092] hover:text-[#e57373] hover:bg-white/[0.05] cursor-pointer"
                        aria-label={`Remover serviço ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  {/* Serviço */}
                  <div className="sm:col-span-6">
                    <label htmlFor={serviceSelectId} className={labelCls}>
                      Serviço
                    </label>
                    <select
                      id={serviceSelectId}
                      className={selectCls}
                      value={line.serviceId}
                      onChange={(e) => handleServiceSelect(line.id, e.target.value)}
                    >
                      {XMOTION_SERVICE_PRESETS.map((preset) => {
                        const unitSuffix =
                          preset.marginUnit === "per_hour"
                            ? "/hora"
                            : preset.marginUnit === "per_unit"
                            ? "/un."
                            : " fixo";
                        return (
                          <option key={preset.id} value={preset.id}>
                            {preset.label} ({formatCurrency(preset.defaultMargin)}
                            {unitSuffix})
                          </option>
                        );
                      })}
                      <option value="custom">Serviço personalizado</option>
                    </select>
                  </div>

                  {/* Horas */}
                  <div className="sm:col-span-3">
                    <label htmlFor={hoursId} className={labelCls}>
                      Mão de obra (horas)
                    </label>
                    <DecimalInput
                      id={hoursId}
                      value={line.hours}
                      onValueChange={(next) => updateLine(line.id, { hours: next })}
                    />
                  </div>

                  {/* Material */}
                  <div className="sm:col-span-3">
                    <label htmlFor={wasteId} className={labelCls}>
                      Desperdício (%)
                    </label>
                    <DecimalInput
                      id={wasteId}
                      value={line.wasteRatePercent}
                      onValueChange={(next) =>
                        updateLine(line.id, { wasteRatePercent: next })
                      }
                    />
                  </div>

                  {line.serviceId === "custom" && (
                    <div className="sm:col-span-12">
                      <label htmlFor={serviceNameId} className={labelCls}>
                        Nome do serviço
                      </label>
                      <input
                        id={serviceNameId}
                        type="text"
                        className={inputCls}
                        value={line.serviceName}
                        onChange={(e) =>
                          updateLine(line.id, { serviceName: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {/* Material Selector */}
                  <div className="sm:col-span-5">
                    <label htmlFor={materialSelectId} className={labelCls}>
                      Tipo de Material
                    </label>
                    <select
                      id={materialSelectId}
                      className={selectCls}
                      value={line.materialId}
                      onChange={(e) => handleMaterialSelect(line.id, e.target.value)}
                    >
                      <optgroup label="Tabela X-Motion">
                        {materialOptions
                          .filter((m) => m.source === "preset")
                          .map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.label}
                              {mat.id === "none"
                                ? ""
                                : ` (${formatCurrency(mat.unitPrice)}/${MATERIAL_UNIT_SHORT_LABELS[mat.unit]})`}
                            </option>
                          ))}
                      </optgroup>
                      {materialOptions.some((m) => m.source === "stock") && (
                        <optgroup label="Stock da Oficina">
                          {materialOptions
                            .filter((m) => m.source === "stock")
                            .map((mat) => (
                              <option key={mat.id} value={mat.id}>
                                {mat.label} ({formatCurrency(mat.unitPrice)}/
                                {MATERIAL_UNIT_SHORT_LABELS[mat.unit]})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      <option value="custom">Outro material (manual)</option>
                    </select>
                  </div>

                  {/* Material Quantity + Unit */}
                  <div className="grid grid-cols-2 gap-2 sm:col-span-4">
                    <div>
                      <label htmlFor={materialQtyId} className={labelCls}>
                        Qtd. material
                      </label>
                      <DecimalInput
                        id={materialQtyId}
                        value={line.materialQuantity}
                        onValueChange={(next) =>
                          updateLine(line.id, { materialQuantity: next })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor={materialUnitId} className={labelCls}>
                        Unidade
                      </label>
                      <select
                        id={materialUnitId}
                        className={selectCls}
                        value={line.materialUnit}
                        onChange={(e) =>
                          updateLine(line.id, {
                            materialUnit: e.target.value as CostLineUnit,
                          })
                        }
                      >
                        <option value="linear_meter">metros (m)</option>
                        <option value="m2">m²</option>
                        <option value="unit">unidade</option>
                        <option value="package">pacote</option>
                      </select>
                    </div>
                  </div>

                  {/* Material Price */}
                  <div className="sm:col-span-3">
                    <label htmlFor={materialPriceId} className={labelCls}>
                      Preço material (€)
                    </label>
                    <DecimalInput
                      id={materialPriceId}
                      value={line.materialUnitPrice}
                      onValueChange={(next) =>
                        updateLine(line.id, { materialUnitPrice: next })
                      }
                    />
                  </div>

                  {/* Margin Value + Unit */}
                  <div className="sm:col-span-6">
                    <label htmlFor={marginId} className={labelCls}>
                      Margem de Lucro (€)
                    </label>
                    <DecimalInput
                      id={marginId}
                      value={line.marginValue}
                      onValueChange={(next) =>
                        updateLine(line.id, { marginValue: next })
                      }
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor={marginUnitId} className={labelCls}>
                      Aplicação da Margem
                    </label>
                    <select
                      id={marginUnitId}
                      className={selectCls}
                      value={line.marginUnit}
                      onChange={(e) =>
                        updateLine(line.id, {
                          marginUnit: e.target.value as QuickMarginUnit,
                        })
                      }
                    >
                      <option value="per_hour">Por hora (€/h)</option>
                      <option value="per_unit">Por unidade/metro de material</option>
                      <option value="flat">Valor fixo no serviço (€)</option>
                    </select>
                  </div>
                </div>

                {/* Line Breakdown Strip */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#8a9092]">Mão de obra</span>
                    <span className="font-semibold text-[#f1ede5] tabular-nums">
                      {formatCurrency(breakdown?.laborCost ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#8a9092]">Material</span>
                    <span className="font-semibold text-[#f1ede5] tabular-nums">
                      {formatCurrency(breakdown?.materialCost ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] text-[#8a9092]">Margem</span>
                    <span className="font-semibold text-[#68a46b] tabular-nums">
                      {formatCurrency(breakdown?.profitMargin ?? 0)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => addServiceFromPreset("car_wrapping")}
            className="h-11 border-dashed border-[#d3a548]/40 text-[#f7d46d] hover:bg-[#1f1b14]"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar outro serviço ao orçamento</span>
          </Button>

          {/* Reference Tables Toggle */}
          <Card className="bg-[#101314] border-white/[0.08] overflow-hidden">
            <button
              type="button"
              onClick={() => setReferenceOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-[#f1ede5] hover:bg-white/[0.02] cursor-pointer"
              aria-expanded={referenceOpen}
            >
              <span>Tabelas de referência X-Motion (Material e Margem)</span>
              {referenceOpen ? (
                <ChevronUp className="h-4 w-4 text-[#d3a548]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#a9adae]" />
              )}
            </button>
            {referenceOpen && (
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 text-xs">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548] mb-2">
                    Tipo de Material
                  </h3>
                  <ul className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-md bg-[#080a0b]">
                    {XMOTION_MATERIAL_PRESETS.filter((m) => m.id !== "none").map((mat) => (
                      <li
                        key={mat.id}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-[#f1ede5]">{mat.label}</span>
                        <span className="font-semibold text-[#a9adae] tabular-nums">
                          {formatCurrency(mat.unitPrice)}/
                          {MATERIAL_UNIT_SHORT_LABELS[mat.unit]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#68a46b] mb-2">
                    Serviço (Margem de Lucro)
                  </h3>
                  <ul className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-md bg-[#080a0b]">
                    {XMOTION_SERVICE_PRESETS.map((srv) => (
                      <li
                        key={srv.id}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-[#f1ede5]">{srv.label}</span>
                        <span className="font-semibold text-[#68a46b] tabular-nums">
                          {formatCurrency(srv.defaultMargin)}{" "}
                          <span className="text-[10px] text-[#8a9092]">
                            {MARGIN_UNIT_LABELS[srv.marginUnit]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Desktop Sticky Financial Summary */}
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-6">
          <Card className="p-5 bg-[#101314] border-[#d3a548]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-[#f1ede5]">Valores Finais</h2>
              <span className="text-xs text-[#a9adae] tabular-nums">
                {result.totalHours}h · {result.lines.length}{" "}
                {result.lines.length === 1 ? "serviço" : "serviços"}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#a9adae]">Total mão de obra</span>
                <span className="font-semibold text-[#f1ede5] tabular-nums">
                  {formatCurrency(result.totalLaborCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a9adae]">Total material</span>
                <span className="font-semibold text-[#f1ede5] tabular-nums">
                  {formatCurrency(result.totalMaterialCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a9adae]">Margem de lucro total</span>
                <span className="font-semibold text-[#68a46b] tabular-nums">
                  {formatCurrency(result.totalProfitMargin)}
                </span>
              </div>
              {result.discountAmount > 0 && (
                <div className="flex items-center justify-between text-[#f7d46d]">
                  <span>Desconto ({result.discountRate}%)</span>
                  <span className="font-semibold tabular-nums">
                    -{formatCurrency(result.discountAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-[#a9adae]">
                  Preço Final (s/ IVA)
                </span>
                <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
                  {formatCurrency(result.finalPriceBeforeVat)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#8a9092]">
                <span>IVA ({result.vatRate}%)</span>
                <span className="tabular-nums">{formatCurrency(result.vatAmount)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                  Preço c/ IVA
                </span>
                <span className="text-3xl font-black text-[#f7d46d] tabular-nums">
                  {formatCurrency(result.finalPriceWithVat)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#a9adae] pt-1">
                <span>Margem líquida sobre venda</span>
                <span className="font-semibold text-[#68a46b] tabular-nums">
                  {formatPercentage(result.netMarginPercent)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateQuote}
                className="h-11 w-full"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Criar Orçamento no X-Flow</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopySummary}
                className="h-10 w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#68a46b]" />
                    <span>Resumo copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar resumo (WhatsApp / IG)</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* Mobile Fixed Sticky Bottom Summary Bar */}
      <div className="lg:hidden fixed bottom-[80px] md:bottom-3 left-2 right-2 z-30 rounded-xl bg-[#0d1011]/95 backdrop-blur-md border border-[#d3a548]/45 px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.75)]">
        {mobileDetailsOpen && (
          <div className="pb-3 mb-3 border-b border-white/[0.08] grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="block text-[10px] text-[#8a9092]">Mão de obra</span>
              <span className="font-semibold text-[#f1ede5] tabular-nums">
                {formatCurrency(result.totalLaborCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#8a9092]">Material</span>
              <span className="font-semibold text-[#f1ede5] tabular-nums">
                {formatCurrency(result.totalMaterialCost)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#8a9092]">
                Margem ({formatPercentage(result.netMarginPercent)})
              </span>
              <span className="font-semibold text-[#68a46b] tabular-nums">
                {formatCurrency(result.netMarginAmount)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileDetailsOpen((prev) => !prev)}
            className="flex flex-col text-left min-w-0 cursor-pointer"
            aria-expanded={mobileDetailsOpen}
          >
            <span className="text-[11px] text-[#a9adae] flex items-center gap-1">
              <span>s/ IVA {formatCurrency(result.finalPriceBeforeVat)}</span>
              {mobileDetailsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#d3a548]" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-[#d3a548]" />
              )}
            </span>
            <span className="text-lg font-black text-[#f7d46d] tabular-nums leading-tight">
              {formatCurrency(result.finalPriceWithVat)}{" "}
              <span className="text-[11px] font-semibold text-[#a9adae]">c/ IVA</span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="h-10 px-3"
              aria-label="Copiar resumo"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#68a46b]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreateQuote}
              className="h-10 px-3.5"
            >
              <FilePlus2 className="h-4 w-4" />
              <span>Orçamento</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
