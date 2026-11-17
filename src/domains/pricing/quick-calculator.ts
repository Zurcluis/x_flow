import type { Material } from "@/domains/materials/types";
import type { CostLineUnit, QuoteCostLine, ServiceLine } from "./types";
import { round2 } from "./engine";

export type QuickMarginUnit = "per_hour" | "per_unit" | "flat";

export interface QuickMaterialOption {
  id: string;
  label: string;
  unitPrice: number;
  unit: CostLineUnit;
  source: "preset" | "stock" | "custom";
  materialId?: string | null;
}

export interface QuickServicePreset {
  id: string;
  label: string;
  defaultMargin: number;
  marginUnit: QuickMarginUnit;
  suggestedMaterialId?: string;
}

export interface QuickCalculatorLine {
  id: string;
  serviceId: string;
  serviceName: string;
  hours: number;
  materialId: string;
  materialName: string;
  materialUnit: CostLineUnit;
  materialUnitPrice: number;
  materialQuantity: number;
  wasteRatePercent: number;
  marginValue: number;
  marginUnit: QuickMarginUnit;
}

export interface QuickCalculatorInput {
  fixedHourlyCost: number;
  vatRate: number;
  discountRate: number;
  lines: QuickCalculatorLine[];
}

export interface QuickLineBreakdown {
  id: string;
  serviceName: string;
  hours: number;
  laborCost: number;
  materialCost: number;
  profitMargin: number;
  lineTotalBeforeVat: number;
}

export interface QuickCalculatorResult {
  lines: QuickLineBreakdown[];
  totalHours: number;
  totalMaterialQuantity: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalProfitMargin: number;
  subtotalBeforeVat: number;
  discountRate: number;
  discountAmount: number;
  finalPriceBeforeVat: number;
  vatRate: number;
  vatAmount: number;
  finalPriceWithVat: number;
  totalInternalCost: number;
  netMarginAmount: number;
  netMarginPercent: number;
}

export interface QuickCalculatorPrefill {
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  finalPriceBeforeVat: number;
  adjustReason: string;
  notes: string;
}

export const EXCEL_DEFAULT_FIXED_HOURLY_COST = 34.44;
export const DEFAULT_VAT_RATE = 23;

export const XMOTION_MATERIAL_PRESETS: QuickMaterialOption[] = [
  { id: "none", label: "Sem material", unitPrice: 0, unit: "linear_meter", source: "preset" },
  { id: "carlike", label: "Carlike", unitPrice: 18, unit: "linear_meter", source: "preset" },
  { id: "avery", label: "Avery", unitPrice: 40, unit: "linear_meter", source: "preset" },
  { id: "chrome_delete", label: "Chrome Delete", unitPrice: 1, unit: "linear_meter", source: "preset" },
  { id: "preto_brilho_m2", label: "Preto Brilho (m²)", unitPrice: 17, unit: "m2", source: "preset" },
  { id: "full_ppf", label: "Full PPF", unitPrice: 40, unit: "linear_meter", source: "preset" },
  { id: "ppf_m2", label: "PPF (m²)", unitPrice: 27, unit: "m2", source: "preset" },
  { id: "spray_pinca", label: "Spray (por pinça)", unitPrice: 10, unit: "unit", source: "preset" },
];

export const XMOTION_SERVICE_PRESETS: QuickServicePreset[] = [
  {
    id: "car_wrapping",
    label: "Car Wrapping",
    defaultMargin: 24.18,
    marginUnit: "per_hour",
    suggestedMaterialId: "avery",
  },
  {
    id: "chrome_delete",
    label: "Chrome Delete",
    defaultMargin: 93.78,
    marginUnit: "flat",
    suggestedMaterialId: "chrome_delete",
  },
  {
    id: "preto_brilho_metro",
    label: "Preto Brilho/Metro",
    defaultMargin: 47.34,
    marginUnit: "per_unit",
    suggestedMaterialId: "preto_brilho_m2",
  },
  {
    id: "full_ppf",
    label: "Full PPF",
    defaultMargin: 26.63,
    marginUnit: "per_hour",
    suggestedMaterialId: "full_ppf",
  },
  {
    id: "ppf_m2",
    label: "PPF (m²)",
    defaultMargin: 46.17,
    marginUnit: "per_unit",
    suggestedMaterialId: "ppf_m2",
  },
  {
    id: "pintura_pincas",
    label: "Pintura de Pinças",
    defaultMargin: 36.52,
    marginUnit: "per_unit",
    suggestedMaterialId: "spray_pinca",
  },
];

export const MARGIN_UNIT_LABELS: Record<QuickMarginUnit, string> = {
  per_hour: "€/hora",
  per_unit: "€/un. material",
  flat: "€ fixo",
};

export const MATERIAL_UNIT_SHORT_LABELS: Record<CostLineUnit, string> = {
  linear_meter: "m",
  m2: "m²",
  unit: "un",
  package: "pack",
};

function safeNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function buildMaterialOptions(stockMaterials: Material[]): QuickMaterialOption[] {
  const stockOptions: QuickMaterialOption[] = stockMaterials.map((material) => {
    const unit: CostLineUnit =
      material.unit === "meter" ? "linear_meter" : "unit";
    return {
      id: `stock:${material.id}`,
      label: `${material.brand} ${material.name}`.trim(),
      unitPrice: round2(safeNonNegative(material.costPerMeter)),
      unit,
      source: "stock",
      materialId: material.id,
    };
  });

  return [
    ...XMOTION_MATERIAL_PRESETS,
    ...stockOptions,
    { id: "custom", label: "Outro material (manual)", unitPrice: 0, unit: "linear_meter", source: "custom" },
  ];
}

export function createQuickLineFromPreset(
  presetId: string,
  id: string,
  materialOptions: QuickMaterialOption[] = XMOTION_MATERIAL_PRESETS
): QuickCalculatorLine {
  const preset =
    XMOTION_SERVICE_PRESETS.find((item) => item.id === presetId) ??
    XMOTION_SERVICE_PRESETS[0];
  const material =
    materialOptions.find((item) => item.id === preset.suggestedMaterialId) ??
    XMOTION_MATERIAL_PRESETS[0];

  return {
    id,
    serviceId: preset.id,
    serviceName: preset.label,
    hours: 4,
    materialId: material.id,
    materialName: material.id === "none" ? "" : material.label,
    materialUnit: material.unit,
    materialUnitPrice: material.unitPrice,
    materialQuantity: material.id === "none" ? 0 : 1,
    wasteRatePercent: 0,
    marginValue: preset.defaultMargin,
    marginUnit: preset.marginUnit,
  };
}

export function calculateQuickLine(
  line: QuickCalculatorLine,
  fixedHourlyCost: number
): QuickLineBreakdown {
  const hours = safeNonNegative(line.hours);
  const hourlyRate = safeNonNegative(fixedHourlyCost);
  const quantity = safeNonNegative(line.materialQuantity);
  const unitPrice = safeNonNegative(line.materialUnitPrice);
  const wastePercent = safeNonNegative(line.wasteRatePercent);
  const marginValue = safeNonNegative(line.marginValue);

  const laborCost = round2(hours * hourlyRate);
  const materialCost = round2(quantity * unitPrice * (1 + wastePercent / 100));

  let profitMargin = 0;
  if (line.marginUnit === "per_hour") {
    profitMargin = round2(hours * marginValue);
  } else if (line.marginUnit === "per_unit") {
    profitMargin = round2(quantity * marginValue);
  } else {
    profitMargin = round2(marginValue);
  }

  const lineTotalBeforeVat = round2(laborCost + materialCost + profitMargin);

  return {
    id: line.id,
    serviceName: line.serviceName.trim() || "Serviço",
    hours,
    laborCost,
    materialCost,
    profitMargin,
    lineTotalBeforeVat,
  };
}

export function calculateQuickQuote(
  input: QuickCalculatorInput
): QuickCalculatorResult {
  const lineResults = input.lines.map((line) =>
    calculateQuickLine(line, input.fixedHourlyCost)
  );

  const totalHours = round2(
    lineResults.reduce((acc, item) => acc + item.hours, 0)
  );
  const totalMaterialQuantity = round2(
    input.lines.reduce((acc, item) => acc + safeNonNegative(item.materialQuantity), 0)
  );
  const totalLaborCost = round2(
    lineResults.reduce((acc, item) => acc + item.laborCost, 0)
  );
  const totalMaterialCost = round2(
    lineResults.reduce((acc, item) => acc + item.materialCost, 0)
  );
  const totalProfitMargin = round2(
    lineResults.reduce((acc, item) => acc + item.profitMargin, 0)
  );

  const subtotalBeforeVat = round2(
    totalLaborCost + totalMaterialCost + totalProfitMargin
  );
  const discountRate = Math.min(100, safeNonNegative(input.discountRate));
  const discountAmount = round2(subtotalBeforeVat * (discountRate / 100));
  const finalPriceBeforeVat = round2(Math.max(0, subtotalBeforeVat - discountAmount));

  const vatRate = safeNonNegative(input.vatRate);
  const vatAmount = round2(finalPriceBeforeVat * (vatRate / 100));
  const finalPriceWithVat = round2(finalPriceBeforeVat + vatAmount);

  const totalInternalCost = round2(totalLaborCost + totalMaterialCost);
  const netMarginAmount = round2(finalPriceBeforeVat - totalInternalCost);
  const netMarginPercent =
    finalPriceBeforeVat > 0
      ? round2((netMarginAmount / finalPriceBeforeVat) * 100)
      : 0;

  return {
    lines: lineResults,
    totalHours,
    totalMaterialQuantity,
    totalLaborCost,
    totalMaterialCost,
    totalProfitMargin,
    subtotalBeforeVat,
    discountRate,
    discountAmount,
    finalPriceBeforeVat,
    vatRate,
    vatAmount,
    finalPriceWithVat,
    totalInternalCost,
    netMarginAmount,
    netMarginPercent,
  };
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatQuickQuoteSummaryText(
  input: QuickCalculatorInput,
  result: QuickCalculatorResult
): string {
  const lines = input.lines
    .map((line, index) => {
      const breakdown = result.lines[index];
      const matText =
        line.materialQuantity > 0 && line.materialName.trim()
          ? ` · ${line.materialName.trim()} (${line.materialQuantity} ${MATERIAL_UNIT_SHORT_LABELS[line.materialUnit]})`
          : "";
      return `• ${breakdown.serviceName} (${line.hours}h${matText}): ${formatEur(breakdown.lineTotalBeforeVat)}`;
    })
    .join("\n");

  const discountLine =
    result.discountAmount > 0
      ? `\nDesconto (${result.discountRate}%): -${formatEur(result.discountAmount)}`
      : "";

  return [
    "Estimativa X-Motion",
    lines,
    discountLine,
    `Subtotal s/ IVA: ${formatEur(result.finalPriceBeforeVat)}`,
    `IVA (${result.vatRate}%): ${formatEur(result.vatAmount)}`,
    `Total c/ IVA: ${formatEur(result.finalPriceWithVat)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQuickCalculatorPrefill(
  input: QuickCalculatorInput,
  result: QuickCalculatorResult
): QuickCalculatorPrefill {
  const serviceLines: ServiceLine[] = input.lines
    .filter((line) => line.serviceName.trim() !== "" || line.hours > 0)
    .map((line, index) => ({
      name: line.serviceName.trim() || `Serviço ${index + 1}`,
      description:
        line.marginUnit === "per_hour"
          ? null
          : `Margem ${MARGIN_UNIT_LABELS[line.marginUnit]}: ${line.marginValue} €`,
      mode: "complete",
      hours: safeNonNegative(line.hours),
      notes: null,
      sortOrder: index,
    }));

  const costLines: QuoteCostLine[] = input.lines
    .filter((line) => line.materialQuantity > 0 && line.materialUnitPrice > 0)
    .map((line, index) => {
      const waste = safeNonNegative(line.wasteRatePercent);
      const quantity = safeNonNegative(line.materialQuantity);
      const unitCost = safeNonNegative(line.materialUnitPrice);
      const stockMaterialId = line.materialId.startsWith("stock:")
        ? line.materialId.slice("stock:".length)
        : null;
      return {
        lineType: "material",
        name: line.materialName.trim() || "Material",
        quantity,
        unit: line.materialUnit,
        unitCost,
        wasteRatePercent: waste,
        totalCost: round2(quantity * unitCost * (1 + waste / 100)),
        kitId: null,
        supplierServiceId: null,
        materialId: stockMaterialId,
        deductedHours: null,
        notes: null,
        sortOrder: index,
      };
    });

  return {
    serviceLines:
      serviceLines.length > 0
        ? serviceLines
        : [{ name: "Serviço X-Motion", description: null, mode: "complete", hours: 1, notes: null, sortOrder: 0 }],
    costLines,
    finalPriceBeforeVat: result.finalPriceBeforeVat,
    adjustReason: "Calculadora Rápida X-Motion",
    notes: formatQuickQuoteSummaryText(input, result),
  };
}

export function encodeQuickCalculatorPrefill(
  prefill: QuickCalculatorPrefill
): string {
  const json = JSON.stringify(prefill);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeQuickCalculatorPrefill(
  encoded: string | undefined
): QuickCalculatorPrefill | null {
  if (!encoded || encoded.length > 16000) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<QuickCalculatorPrefill>;
    if (!Array.isArray(parsed.serviceLines) || !Array.isArray(parsed.costLines)) {
      return null;
    }
    const serviceLines: ServiceLine[] = parsed.serviceLines.slice(0, 30).map((line, index) => ({
      name: typeof line?.name === "string" ? line.name.slice(0, 140) : "Serviço",
      description: typeof line?.description === "string" ? line.description.slice(0, 300) : null,
      mode: line?.mode === "spot" ? "spot" : "complete",
      hours: typeof line?.hours === "number" && Number.isFinite(line.hours) && line.hours >= 0 ? line.hours : 0,
      notes: typeof line?.notes === "string" ? line.notes.slice(0, 300) : null,
      sortOrder: index,
    }));
    const validUnits = new Set<CostLineUnit>(["linear_meter", "m2", "unit", "package"]);
    const costLines: QuoteCostLine[] = parsed.costLines.slice(0, 30).map((line, index) => {
      const quantity =
        typeof line?.quantity === "number" && Number.isFinite(line.quantity) && line.quantity >= 0
          ? line.quantity
          : 0;
      const unitCost =
        typeof line?.unitCost === "number" && Number.isFinite(line.unitCost) && line.unitCost >= 0
          ? line.unitCost
          : 0;
      const waste =
        typeof line?.wasteRatePercent === "number" &&
        Number.isFinite(line.wasteRatePercent) &&
        line.wasteRatePercent >= 0
          ? line.wasteRatePercent
          : 0;
      const unit: CostLineUnit =
        typeof line?.unit === "string" && validUnits.has(line.unit as CostLineUnit)
          ? (line.unit as CostLineUnit)
          : "linear_meter";
      return {
        lineType: "material",
        name: typeof line?.name === "string" ? line.name.slice(0, 140) : "Material",
        quantity,
        unit,
        unitCost,
        wasteRatePercent: waste,
        totalCost: round2(quantity * unitCost * (1 + waste / 100)),
        kitId: null,
        supplierServiceId: null,
        materialId: typeof line?.materialId === "string" ? line.materialId : null,
        deductedHours: null,
        notes: null,
        sortOrder: index,
      };
    });
    const finalPriceBeforeVat =
      typeof parsed.finalPriceBeforeVat === "number" &&
      Number.isFinite(parsed.finalPriceBeforeVat) &&
      parsed.finalPriceBeforeVat >= 0
        ? round2(parsed.finalPriceBeforeVat)
        : 0;

    return {
      serviceLines,
      costLines,
      finalPriceBeforeVat,
      adjustReason:
        typeof parsed.adjustReason === "string"
          ? parsed.adjustReason.slice(0, 140)
          : "Calculadora Rápida X-Motion",
      notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 2000) : "",
    };
  } catch {
    return null;
  }
}
