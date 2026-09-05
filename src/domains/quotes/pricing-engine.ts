import { BodyType } from "../vehicles/types";
import { VEHICLE_SEGMENT_MULTIPLIERS, FINISH_MULTIPLIERS } from "../catalog/types";
import { QuoteOption, QuoteOptionItem, OptionTier } from "./types";
import { MASTER_BODY_PARTS } from "../catalog/parts-catalog";

const DEFAULT_HOURLY_LABOR_RATE = 45; // €/hora custo base da oficina
const DEFAULT_VAT_RATE = 0.23; // 23% IVA em Portugal

export interface PricingFinancials {
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  estimatedCost: number;
  estimatedMarginAmount: number;
  estimatedMarginPercentage: number;
  estimatedHours: number;
}

export function roundTo2Decimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateOptionFinancials(
  items: { totalPrice: number; laborHours: number; areaM2: number }[],
  discountRate: number = 0,
  materialCostPerM2: number = 40,
  hourlyLaborRate: number = DEFAULT_HOURLY_LABOR_RATE
): PricingFinancials {
  const subtotal = roundTo2Decimals(
    items.reduce((acc, item) => acc + item.totalPrice, 0)
  );

  const discountAmount = roundTo2Decimals(subtotal * (discountRate / 100));
  const taxableBase = roundTo2Decimals(subtotal - discountAmount);
  const vatRate = DEFAULT_VAT_RATE;
  const vatAmount = roundTo2Decimals(taxableBase * vatRate);
  const totalWithVat = roundTo2Decimals(taxableBase + vatAmount);

  const totalAreaM2 = items.reduce((acc, item) => acc + item.areaM2, 0);
  const estimatedHours = roundTo2Decimals(
    items.reduce((acc, item) => acc + item.laborHours, 0)
  );

  const materialCost = roundTo2Decimals(totalAreaM2 * materialCostPerM2);
  const laborCost = roundTo2Decimals(estimatedHours * hourlyLaborRate);
  const estimatedCost = roundTo2Decimals(materialCost + laborCost);

  const estimatedMarginAmount = roundTo2Decimals(taxableBase - estimatedCost);
  const estimatedMarginPercentage =
    taxableBase > 0
      ? roundTo2Decimals((estimatedMarginAmount / taxableBase) * 100)
      : 0;

  return {
    subtotal,
    discountRate,
    discountAmount,
    taxableBase,
    vatRate,
    vatAmount,
    totalWithVat,
    estimatedCost,
    estimatedMarginAmount,
    estimatedMarginPercentage,
    estimatedHours,
  };
}

export function buildQuoteOptionFromParts({
  quoteId,
  optionId,
  tier,
  name,
  description,
  isRecommended,
  warrantyYears,
  bodyType,
  finish,
  partCodes,
  materialName,
  discountRate = 0,
  materialCostPerM2 = 45,
}: {
  quoteId: string;
  optionId: string;
  tier: OptionTier;
  name: string;
  description: string;
  isRecommended: boolean;
  warrantyYears: number;
  bodyType: BodyType;
  finish: string;
  partCodes: string[];
  materialName: string;
  discountRate?: number;
  materialCostPerM2?: number;
}): QuoteOption {
  const segmentMultiplier = VEHICLE_SEGMENT_MULTIPLIERS[bodyType] || 1.0;
  const finishMultiplier = FINISH_MULTIPLIERS[finish] || 1.0;

  const items: QuoteOptionItem[] = partCodes.map((code, idx) => {
    const part =
      MASTER_BODY_PARTS.find((p) => p.code === code) || {
        code,
        namePt: code,
        category: "front",
        defaultAreaM2: 1.0,
        baseLaborHours: 2.0,
        basePrice: 250,
      };

    const unitPrice = roundTo2Decimals(
      part.basePrice * segmentMultiplier * finishMultiplier
    );

    return {
      id: `item-${optionId}-${idx + 1}`,
      serviceName: "Aplicação de Película PPF",
      bodyPartCode: part.code,
      bodyPartName: part.namePt,
      materialName,
      areaM2: part.defaultAreaM2,
      laborHours: part.baseLaborHours,
      unitPrice,
      totalPrice: unitPrice,
    };
  });

  const financials = calculateOptionFinancials(
    items,
    discountRate,
    materialCostPerM2
  );

  return {
    id: optionId,
    quoteId,
    tier,
    name,
    description,
    isRecommended,
    warrantyYears,
    ...financials,
    items,
  };
}
