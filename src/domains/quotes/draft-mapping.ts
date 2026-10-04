import { MASTER_BODY_PARTS } from "@/domains/catalog/parts-catalog";
import {
  FINISH_MULTIPLIERS,
  VEHICLE_SEGMENT_MULTIPLIERS,
} from "@/domains/catalog/types";
import type { BodyType } from "@/domains/vehicles/types";
import type { QuoteCostLine, ServiceLine } from "@/domains/pricing/types";
import { roundTo2Decimals } from "./pricing-engine";
import type { DraftQuoteData, DraftQuoteOption } from "./types";

export interface FlexibleDraftState {
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  finalPriceInput: string;
  adjustReason: string;
}

export interface ConfiguratorDraftState {
  essentialParts: string[];
  recommendedParts: string[];
  premiumParts: string[];
  finish: string;
  discountRate: number;
}

export type DraftEditMode =
  | { kind: "flexible"; state: FlexibleDraftState }
  | { kind: "configurator"; state: ConfiguratorDraftState }
  | { kind: "not_editable"; reason: string };

const EDITABLE_FINISHES = ["gloss", "matte", "color_ppf", "carbon"] as const;

function sameCode(a: number, b: number): boolean {
  return roundTo2Decimals(a) === roundTo2Decimals(b);
}

function detectFinish(
  options: DraftQuoteOption[],
  segmentMultiplier: number
): string | null {
  const candidates = EDITABLE_FINISHES.filter((finish) => {
    const multiplier = FINISH_MULTIPLIERS[finish] ?? 1;
    return options.every((option) =>
      option.items.every((item) => {
        const part = MASTER_BODY_PARTS.find((p) => p.code === item.bodyPartCode);
        if (!part) return false;
        return sameCode(
          part.basePrice * segmentMultiplier * multiplier,
          item.unitPrice
        );
      })
    );
  });
  return candidates.length === 1 ? candidates[0] : null;
}

function buildFlexibleState(option: DraftQuoteOption): FlexibleDraftState {
  const manualPrice =
    option.adjustKind === "manual_price" && option.adjustValue > 0
      ? String(option.adjustValue)
      : "";
  return {
    serviceLines: option.serviceLines.map((line, index) => ({
      name: line.name,
      description: line.description ?? null,
      mode: line.mode,
      hours: Number.isFinite(line.hours) ? line.hours : 0,
      notes: line.notes ?? null,
      sortOrder: index,
    })),
    costLines: option.costLines.map((line, index) => ({
      ...line,
      kitId: line.kitId ?? null,
      supplierServiceId: line.supplierServiceId ?? null,
      materialId: line.materialId ?? null,
      deductedHours: line.lineType === "sublet" ? line.deductedHours ?? 0 : null,
      notes: line.notes ?? null,
      sortOrder: index,
    })),
    finalPriceInput: manualPrice,
    adjustReason: option.adjustReason ?? "",
  };
}

function buildConfiguratorState(
  options: DraftQuoteOption[],
  bodyType: BodyType
): ConfiguratorDraftState | null {
  const tiers = ["essential", "recommended", "premium"] as const;
  const byTier = new Map<string, DraftQuoteOption>();
  for (const option of options) {
    if (option.kind !== "configurator" || option.items.length === 0) return null;
    if (byTier.has(option.tier)) return null;
    byTier.set(option.tier, option);
  }
  if (byTier.size !== tiers.length) return null;

  const partsByTier: Record<(typeof tiers)[number], string[]> = {
    essential: [],
    recommended: [],
    premium: [],
  };
  for (const tier of tiers) {
    const option = byTier.get(tier);
    if (!option) return null;
    for (const item of option.items) {
      if (!MASTER_BODY_PARTS.some((part) => part.code === item.bodyPartCode)) {
        return null;
      }
      if (!partsByTier[tier].includes(item.bodyPartCode)) {
        partsByTier[tier].push(item.bodyPartCode);
      }
    }
  }

  const segmentMultiplier = VEHICLE_SEGMENT_MULTIPLIERS[bodyType] || 1.0;
  const finish = detectFinish(options, segmentMultiplier);
  if (!finish) return null;

  const recommended = byTier.get("recommended");
  const discountRate = recommended?.discountRate ?? options[0]?.discountRate ?? 0;

  return {
    essentialParts: partsByTier.essential,
    recommendedParts: partsByTier.recommended,
    premiumParts: partsByTier.premium,
    finish,
    discountRate,
  };
}

export function resolveDraftEditMode(
  draft: DraftQuoteData,
  bodyType: BodyType
): DraftEditMode {
  if (draft.options.length === 0) {
    return { kind: "not_editable", reason: "Este rascunho não tem opções para editar." };
  }

  const allFlexible = draft.options.every((opt) => opt.kind === "flexible");
  const allConfigurator = draft.options.every((opt) => opt.kind === "configurator");

  if (!allFlexible && !allConfigurator) {
    return {
      kind: "not_editable",
      reason: "Este rascunho mistura modos e não pode ser editado neste ecrã.",
    };
  }

  if (allFlexible) {
    if (draft.options.length > 1) {
      return {
        kind: "not_editable",
        reason: "Este rascunho tem mais do que uma opção e não pode ser editado neste ecrã.",
      };
    }
    const option = draft.options[0];
    if (option.serviceLines.length === 0) {
      return {
        kind: "not_editable",
        reason: "Este rascunho não tem linhas de serviço e não pode ser editado neste ecrã.",
      };
    }
    return { kind: "flexible", state: buildFlexibleState(option) };
  }

  const state = buildConfiguratorState(draft.options, bodyType);
  if (!state) {
    return {
      kind: "not_editable",
      reason:
        "Este rascunho do configurador não pode ser reconstruído neste ecrã — ao guardar será criado um novo orçamento.",
    };
  }
  return { kind: "configurator", state };
}
