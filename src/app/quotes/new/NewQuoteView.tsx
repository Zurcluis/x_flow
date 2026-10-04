"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Vehicle } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileClock,
  Layers,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuotePartsMatrix } from "@/components/xflow/quotes/QuotePartsMatrix";
import { QuoteFinancialSummary } from "@/components/xflow/quotes/QuoteFinancialSummary";
import { FlexibleQuoteSummary } from "@/components/xflow/quotes/FlexibleQuoteSummary";
import { buildQuoteOptionFromParts } from "@/domains/quotes/pricing-engine";
import { resolveDraftEditMode } from "@/domains/quotes/draft-mapping";
import {
  OptionTier,
  QuoteOption,
  QuoteOptionInput,
} from "@/domains/quotes/types";
import type { DraftQuoteData } from "@/domains/quotes/types";
import {
  AdjustKind,
  ConsumableKit,
  CostLineType,
  CostLineUnit,
  PricingValidationError,
  QuoteCostLine,
  ServiceLine,
  ServiceLineMode,
} from "@/domains/pricing/types";
import {
  computeFinalFinancials,
  computeSuggestion,
  resolvePricingContext,
  round2,
  validateQuotePricing,
} from "@/domains/pricing/engine";
import { VEHICLE_SEGMENT_MULTIPLIERS } from "@/domains/catalog/types";
import { formatCurrency } from "@/lib/formatting";
import { createQuoteAction, updateDraftQuoteAction } from "@/app/actions/quotes";
import type { PricingContextData } from "@/server/pricing";

type QuoteMode = "flexible" | "configurator";
type CostTab = "material" | "kit" | "sublet" | "extra";

const COST_UNIT_OPTIONS: { value: CostLineUnit; label: string }[] = [
  { value: "linear_meter", label: "m lineares" },
  { value: "m2", label: "m²" },
  { value: "unit", label: "Unidade" },
  { value: "package", label: "Pacote" },
];

const COST_TABS: { id: CostTab; label: string }[] = [
  { id: "material", label: "Película/Vinil" },
  { id: "kit", label: "Kit consumíveis" },
  { id: "sublet", label: "Subcontratados" },
  { id: "extra", label: "Extras" },
];

const inputCls =
  "h-9 px-3 rounded-sm bg-[#080a0b] border border-white/[0.08] focus:border-[#d3a548] outline-none text-xs text-[#f1ede5]";
const labelCls = "text-[10px] font-semibold uppercase tracking-wide text-[#8a9092]";

const parseNumberInput = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const recalcCostTotal = (line: QuoteCostLine): number => {
  const quantity = Number.isFinite(line.quantity) ? line.quantity : 0;
  const unitCost = Number.isFinite(line.unitCost) ? line.unitCost : 0;
  if (line.lineType === "material") {
    const waste = Number.isFinite(line.wasteRatePercent) ? line.wasteRatePercent : 0;
    return round2(quantity * unitCost * (1 + waste / 100));
  }
  return round2(quantity * unitCost);
};

export function NewQuoteView({
  vehicles: vehiclesProp,
  customers: customersProp,
  pricingContext,
  initialVehicleId,
  simRef,
  draftQuote,
  draftRequested,
}: {
  vehicles: Vehicle[];
  customers: Customer[];
  pricingContext: PricingContextData;
  initialVehicleId?: string;
  simRef?: { finish: string; coverageLabel: string } | null;
  draftQuote?: DraftQuoteData | null;
  draftRequested?: boolean;
}) {
  const router = useRouter();

  const [vehicles] = useState(vehiclesProp);
  const [customers] = useState(customersProp);

  // Rascunho editável (?draft=<quoteId>) — carregado no servidor antes do primeiro render
  const draft = draftQuote ?? null;
  const draftVehicleBodyType = draft?.vehicleId
    ? (vehicles.find((v) => v.id === draft.vehicleId)?.bodyType ?? null)
    : null;
  const draftEdit = useMemo(() => {
    if (!draft) return null;
    if (!draftVehicleBodyType) {
      return {
        kind: "not_editable",
        reason:
          "A viatura deste rascunho já não está disponível — ao guardar será criado um novo orçamento.",
      } as const;
    }
    return resolveDraftEditMode(draft, draftVehicleBodyType);
  }, [draft, draftVehicleBodyType]);
  const draftQuoteId =
    draft && draftEdit && draftEdit.kind !== "not_editable" ? draft.quoteId : null;
  const draftFlexibleState = draftEdit?.kind === "flexible" ? draftEdit.state : null;
  const draftConfiguratorState = draftEdit?.kind === "configurator" ? draftEdit.state : null;

  // Selected vehicle & customer — sincroniza quando a URL muda (ex.: "Refazer Proposta")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    if (draft && vehicles.some((x) => x.id === draft.vehicleId)) {
      return draft.vehicleId;
    }
    if (initialVehicleId && vehicles.some((x) => x.id === initialVehicleId)) {
      return initialVehicleId;
    }
    return vehicles[0]?.id ?? "";
  });
  const [draftCustomerId, setDraftCustomerId] = useState<string | null>(() => draft?.customerId ?? null);
  const [appliedInit, setAppliedInit] = useState(initialVehicleId);
  if (initialVehicleId && initialVehicleId !== appliedInit && vehicles.some((x) => x.id === initialVehicleId)) {
    setAppliedInit(initialVehicleId);
    setSelectedVehicleId(initialVehicleId);
    setDraftCustomerId(null);
  }
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedCustomer =
    customers.find(
      (c) => c.id === (draftCustomerId ?? selectedVehicle?.currentOwner?.customerId)
    ) || customers[0];

  // Mode: serviço direto (flexível) é o default quando existe política publicada
  const hasPolicy = pricingContext.policy !== null;
  const [mode, setMode] = useState<QuoteMode>(() => {
    if (draftQuoteId) {
      return draftEdit?.kind === "configurator" ? "configurator" : "flexible";
    }
    return hasPolicy ? "flexible" : "configurator";
  });

  // Options configuration (modo configurador PPF)
  const [finish, setFinish] = useState<string>(() => draftConfiguratorState?.finish ?? "gloss");
  const [discountRate, setDiscountRate] = useState<number>(
    draftConfiguratorState?.discountRate ?? selectedCustomer?.b2bDetails?.discountRate ?? 0
  );

  // Parts for the 3 options
  const [essentialParts, setEssentialParts] = useState<string[]>(() =>
    draftConfiguratorState?.essentialParts ?? [
    "hood",
    "front_bumper",
    "headlights",
  ]
  );

  const [recommendedParts, setRecommendedParts] = useState<string[]>(() =>
    draftConfiguratorState?.recommendedParts ?? [
    "hood",
    "front_bumper",
    "front_fenders",
    "headlights",
    "mirrors",
    "rocker_panels",
    "door_sills",
  ]
  );

  const [premiumParts, setPremiumParts] = useState<string[]>(() =>
    draftConfiguratorState?.premiumParts ?? [
    "hood",
    "front_bumper",
    "front_fenders",
    "headlights",
    "mirrors",
    "doors",
    "rocker_panels",
    "rear_fenders",
    "pillars_a_b_c",
    "roof",
    "rear_bumper",
    "trunk_gate",
    "rear_spoiler",
    "door_sills",
  ]
  );

  const [activeTierTab, setActiveTierTab] = useState<OptionTier>("recommended");

  // ===== Modo Serviço direto: estado local =====
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>(() =>
    draftFlexibleState
      ? draftFlexibleState.serviceLines
      : [{ name: "", description: null, mode: "complete", hours: 0, notes: null, sortOrder: 0 }]
  );
  const [costLines, setCostLines] = useState<QuoteCostLine[]>(
    () => draftFlexibleState?.costLines ?? []
  );
  const [costTab, setCostTab] = useState<CostTab>("material");
  const [notes, setNotes] = useState(() => draft?.notes ?? "");
  const [adjustKind, setAdjustKind] = useState<AdjustKind>(() =>
    draftFlexibleState && draftFlexibleState.finalPriceInput !== "" ? "manual_price" : "none"
  );
  const [finalPriceInput, setFinalPriceInput] = useState(
    () => draftFlexibleState?.finalPriceInput ?? ""
  );
  const [adjustReason, setAdjustReason] = useState(() => draftFlexibleState?.adjustReason ?? "");
  const [manualTouched, setManualTouched] = useState(false);
  const [selectedSupplierServiceId, setSelectedSupplierServiceId] = useState("");
  const [submitting, setSubmitting] = useState<"draft" | "send" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestionChanged, setSuggestionChanged] = useState(false);
  const lastSuggestedRef = useRef<number | null>(null);

  // Dynamically compute options using the pricing engine (modo configurador)
  const quoteId = "quote-new";
  const bodyType = selectedVehicle?.bodyType || "coupe";
  const segmentMultiplier = VEHICLE_SEGMENT_MULTIPLIERS[bodyType] || 1.0;

  const option1 = buildQuoteOptionFromParts({
    quoteId,
    optionId: "opt-new-1",
    tier: "essential",
    name: "Opção 1: Pack Frontal Standard",
    description: "Proteção contra gravilha e impactos frontais de estrada.",
    isRecommended: false,
    warrantyYears: 5,
    bodyType,
    finish,
    partCodes: essentialParts,
    materialName: "Stek DYNOshield Gloss",
    discountRate,
  });

  const option2 = buildQuoteOptionFromParts({
    quoteId,
    optionId: "opt-new-2",
    tier: "recommended",
    name: "Opção 2: Pack Highway & Track",
    description: "Frente completa + Guarda-lamas, Embaladeiras e Soleiras de entrada.",
    isRecommended: true,
    warrantyYears: 10,
    bodyType,
    finish,
    partCodes: recommendedParts,
    materialName: "Stek DYNOshield Gloss",
    discountRate,
  });

  const option3 = buildQuoteOptionFromParts({
    quoteId,
    optionId: "opt-new-3",
    tier: "premium",
    name: "Opção 3: Cobertura Integral Full PPF",
    description: "Proteção total de 100% da pintura com acabamento de alta espessura.",
    isRecommended: false,
    warrantyYears: 10,
    bodyType,
    finish: finish === "gloss" ? "matte" : finish,
    partCodes: premiumParts,
    materialName: "Stek DYNOmatte Satin PPF",
    discountRate,
  });

  const currentActiveOption =
    activeTierTab === "essential"
      ? option1
      : activeTierTab === "recommended"
      ? option2
      : option3;

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    setDraftCustomerId(null);
    const v = vehicles.find((item) => item.id === vId);
    if (v && v.currentOwner) {
      const cust = customers.find((c) => c.id === v.currentOwner?.customerId);
      if (cust?.b2bDetails) {
        setDiscountRate(cust.b2bDetails.discountRate);
      } else {
        setDiscountRate(0);
      }
    }
  };

  // ===== Pré-visualização em direto (modo serviço direto) =====
  const rates = useMemo(() => {
    if (!pricingContext.policy) return null;
    try {
      return resolvePricingContext({
        policy: pricingContext.policy,
        expenseItems: pricingContext.expenseItems,
      });
    } catch {
      return null;
    }
  }, [pricingContext.policy, pricingContext.expenseItems]);

  const formulaCode: "complete" | "spot" = serviceLines.some(
    (line) => line.mode === "spot"
  )
    ? "spot"
    : "complete";

  const formula = useMemo(() => {
    return pricingContext.formulas.find((f) => f.code === formulaCode)?.published ?? null;
  }, [pricingContext.formulas, formulaCode]);

  const suggestion = useMemo(() => {
    if (!rates || !formula) return null;
    try {
      return computeSuggestion({ rates, formula, serviceLines, costLines });
    } catch {
      return null;
    }
  }, [rates, formula, serviceLines, costLines]);

  const parsedFinalPrice = finalPriceInput.trim() === "" ? null : Number(finalPriceInput);
  const hasManualPrice =
    adjustKind === "manual_price" &&
    parsedFinalPrice !== null &&
    Number.isFinite(parsedFinalPrice);

  const financials = useMemo(() => {
    if (!rates || !formula) return null;
    try {
      return computeFinalFinancials({
        rates,
        formula,
        serviceLines,
        costLines,
        adjustKind: hasManualPrice ? "manual_price" : "none",
        adjustValue: hasManualPrice ? parsedFinalPrice ?? 0 : 0,
      });
    } catch {
      return null;
    }
  }, [rates, formula, serviceLines, costLines, hasManualPrice, parsedFinalPrice]);

  const warnings = useMemo(() => {
    const all = validateQuotePricing({
      serviceLines,
      costLines,
      adjustKind: hasManualPrice ? "manual_price" : "none",
      adjustValue: hasManualPrice ? parsedFinalPrice ?? 0 : 0,
    });
    const seen = new Set<string>();
    const unique: PricingValidationError[] = [];
    for (const warning of all) {
      if (!seen.has(warning.message)) {
        seen.add(warning.message);
        unique.push(warning);
      }
    }
    return unique;
  }, [serviceLines, costLines, hasManualPrice, parsedFinalPrice]);

  useEffect(() => {
    const current = suggestion?.suggestedPriceBeforeVat ?? null;
    const previous = lastSuggestedRef.current;
    if (
      previous !== null &&
      current !== null &&
      previous !== current &&
      hasManualPrice &&
      manualTouched
    ) {
      setSuggestionChanged(true);
    }
    lastSuggestedRef.current = current;
  }, [suggestion, hasManualPrice, manualTouched]);

  const handleFinalPriceChange = (value: string) => {
    setFinalPriceInput(value);
    const trimmed = value.trim();
    setAdjustKind(trimmed === "" ? "none" : "manual_price");
    setManualTouched(true);
    setSuggestionChanged(false);
  };

  const restoreSuggestion = () => {
    setFinalPriceInput("");
    setAdjustKind("none");
    setManualTouched(false);
    setSuggestionChanged(false);
  };

  // ===== Editores do modo serviço direto =====
  const updateServiceLine = (index: number, patch: Partial<ServiceLine>) => {
    setServiceLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  };

  const addServiceLine = () => {
    setServiceLines((prev) => [
      ...prev,
      {
        name: "",
        description: null,
        mode: "complete",
        hours: 0,
        notes: null,
        sortOrder: prev.length,
      },
    ]);
  };

  const removeServiceLine = (index: number) => {
    setServiceLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const updateCostLine = (index: number, patch: Partial<QuoteCostLine>) => {
    setCostLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, ...patch };
        return { ...next, totalCost: recalcCostTotal(next) };
      })
    );
  };

  const removeCostLine = (index: number) => {
    setCostLines((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCostBlock = (blockType: CostLineType) => {
    setCostLines((prev) => prev.filter((line) => line.lineType !== blockType));
  };

  const addMaterialLine = () => {
    setCostLines((prev) => [
      ...prev,
      {
        lineType: "material",
        name: "",
        quantity: 1,
        unit: "linear_meter",
        unitCost: 0,
        wasteRatePercent: rates?.wasteRatePercent ?? 0,
        totalCost: 0,
        kitId: null,
        supplierServiceId: null,
        materialId: null,
        deductedHours: null,
        notes: null,
        sortOrder: prev.length,
      },
    ]);
  };

  const activeKits = useMemo(
    () => pricingContext.kits.filter((kit) => kit.active),
    [pricingContext.kits]
  );

  const activeSupplierServices = useMemo(
    () => pricingContext.supplierServices.filter((service) => service.active),
    [pricingContext.supplierServices]
  );

  const toggleKit = (kit: ConsumableKit) => {
    setCostLines((prev) => {
      const existingIndex = prev.findIndex(
        (line) => line.lineType === "consumable_kit" && line.kitId === kit.id
      );
      if (existingIndex >= 0) return prev.filter((_, i) => i !== existingIndex);
      return [
        ...prev,
        {
          lineType: "consumable_kit",
          name: kit.name,
          quantity: 1,
          unit: "unit",
          unitCost: kit.price,
          wasteRatePercent: 0,
          totalCost: round2(kit.price),
          kitId: kit.id,
          supplierServiceId: null,
          materialId: null,
          deductedHours: null,
          notes: null,
          sortOrder: prev.length,
        },
      ];
    });
  };

  const addSubletLine = () => {
    const service = activeSupplierServices.find(
      (item) => item.id === selectedSupplierServiceId
    );
    if (!service) return;
    setCostLines((prev) => [
      ...prev,
      {
        lineType: "sublet",
        name: `${service.supplierName} · ${service.serviceName}`,
        quantity: 1,
        unit: "unit",
        unitCost: service.basePrice,
        wasteRatePercent: 0,
        totalCost: round2(service.basePrice),
        kitId: null,
        supplierServiceId: service.id,
        materialId: null,
        deductedHours: service.phaseHours ?? 0,
        notes: null,
        sortOrder: prev.length,
      },
    ]);
    setSelectedSupplierServiceId("");
  };

  const addExtraLine = () => {
    setCostLines((prev) => [
      ...prev,
      {
        lineType: "extra",
        name: "",
        quantity: 1,
        unit: "unit",
        unitCost: 0,
        wasteRatePercent: 0,
        totalCost: 0,
        kitId: null,
        supplierServiceId: null,
        materialId: null,
        deductedHours: null,
        notes: null,
        sortOrder: prev.length,
      },
    ]);
  };

  const materialLines = costLines.filter((line) => line.lineType === "material");
  const kitLines = costLines.filter((line) => line.lineType === "consumable_kit");
  const subletLines = costLines.filter((line) => line.lineType === "sublet");
  const extraLines = costLines.filter((line) => line.lineType === "extra");

  // ===== Submissão =====
  const buildFlexibleOptionInput = (): QuoteOptionInput => {
    const descriptions = serviceLines
      .map((line) => (line.description ?? "").trim())
      .filter(Boolean);
    const manualPrice = hasManualPrice ? parsedFinalPrice : null;
    return {
      tier: "recommended",
      name: (serviceLines[0]?.name ?? "").trim() || "Proposta personalizada",
      description: descriptions.length > 0 ? descriptions.join(" ") : undefined,
      isRecommended: true,
      kind: "flexible",
      serviceLines: serviceLines.map((line, index) => ({
        name: line.name.trim(),
        description: (line.description ?? "").trim() || null,
        mode: line.mode,
        hours: Number.isFinite(line.hours) ? line.hours : 0,
        notes: (line.notes ?? "").trim() || null,
        sortOrder: index,
      })),
      costLines: costLines
        .filter((line) => line.lineType !== "extra" || line.name.trim() !== "")
        .map((line, index) => ({
          lineType: line.lineType,
          name: line.name.trim(),
          quantity: Number.isFinite(line.quantity) ? line.quantity : 0,
          unit: line.unit,
          unitCost: Number.isFinite(line.unitCost) ? line.unitCost : 0,
          wasteRatePercent: Number.isFinite(line.wasteRatePercent)
            ? line.wasteRatePercent
            : 0,
          totalCost: Number.isFinite(line.totalCost) ? line.totalCost : 0,
          kitId: line.kitId ?? null,
          supplierServiceId: line.supplierServiceId ?? null,
          materialId: line.materialId ?? null,
          deductedHours:
            line.lineType === "sublet" ? line.deductedHours ?? 0 : null,
          notes: line.notes ?? null,
          sortOrder: index,
        })),
      manualPriceBeforeVat: manualPrice,
      adjustKind: hasManualPrice ? "manual_price" : "none",
      adjustValue: hasManualPrice ? parsedFinalPrice ?? 0 : 0,
      adjustReason: adjustReason.trim() || null,
    };
  };

  const toConfiguratorOptionInput = (option: QuoteOption): QuoteOptionInput => ({
    tier: option.tier,
    name: option.name,
    description: option.description,
    isRecommended: option.isRecommended,
    warrantyYears: option.warrantyYears,
    discountRate: option.discountRate,
    kind: "configurator",
    items: option.items.map((item) => ({
      serviceName: item.serviceName,
      bodyPartCode: item.bodyPartCode,
      bodyPartName: item.bodyPartName,
      materialName: item.materialName,
      areaM2: item.areaM2,
      laborHours: item.laborHours,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    adjustKind: "none",
  });

  const [saving, setSaving] = useState(false);
  const [emitError, setEmitError] = useState<string | null>(null);

  const handleFlexibleSubmit = async (intent: "draft" | "send") => {
    if (!selectedVehicleId || !selectedCustomer?.id) {
      setSubmitError("Seleciona a viatura e o cliente antes de continuar.");
      return;
    }
    setSubmitting(intent);
    setSubmitError(null);
    const input = {
      vehicleId: selectedVehicleId,
      customerId: selectedCustomer.id,
      notes: notes.trim() || null,
      intent,
      options: [buildFlexibleOptionInput()],
    };
    const result = draftQuoteId
      ? await updateDraftQuoteAction({ quoteId: draftQuoteId, ...input })
      : await createQuoteAction(input);
    setSubmitting(null);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/quotes/${result.quoteId}`);
  };

  const handleCreateQuote = async () => {
    if (!selectedVehicleId || !selectedCustomer?.id) {
      setEmitError("Seleciona a viatura e o cliente antes de emitir.");
      return;
    }
    setSaving(true);
    setEmitError(null);
    const input = {
      vehicleId: selectedVehicleId,
      customerId: selectedCustomer.id,
      intent: "send" as const,
      options: [option1, option2, option3].map(toConfiguratorOptionInput),
    };
    const result = draftQuoteId
      ? await updateDraftQuoteAction({ quoteId: draftQuoteId, ...input })
      : await createQuoteAction(input);
    setSaving(false);
    if (!result.ok) {
      setEmitError(result.error);
      return;
    }
    router.push(`/quotes/${result.quoteId}`);
  };

  const flexibleReady =
    hasPolicy && rates !== null && formula !== null && suggestion !== null && financials !== null;
  const canSubmitFlexible =
    flexibleReady &&
    warnings.length === 0 &&
    Boolean(selectedVehicleId) &&
    Boolean(selectedCustomer?.id);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <Link href="/quotes">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#a9adae]">Configurador Comercial</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              {draftQuoteId ? "Editar Rascunho" : "Novo Orçamento Multi-Opção"}
            </h1>
          </div>
        </div>

        {mode === "configurator" && emitError && (
          <p className="text-xs font-semibold text-[#f05a50]">{emitError}</p>
        )}

        {simRef && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30 text-xs text-[#f7d46d]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              Referência do Simulador: <strong>{simRef.finish}</strong> · Cobertura{" "}
              <strong>{simRef.coverageLabel}</strong>
            </span>
          </div>
        )}

        {mode === "configurator" && (
          <Button variant="primary" onClick={handleCreateQuote} disabled={saving}>
            {saving ? (
              <span>A emitir proposta…</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Emitir e Gerar Link Seguro</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => hasPolicy && setMode("flexible")}
            disabled={!hasPolicy}
            className={`flex flex-col items-start gap-1.5 p-4 rounded-md border text-left transition-all select-none ${
              mode === "flexible"
                ? "bg-[#1f1b14] border-[#d3a548]/60 shadow-[0_0_0_1px_rgba(211,165,72,0.25)]"
                : "bg-[#15191a] border-white/[0.08] hover:border-white/20"
            } ${hasPolicy ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
          >
            <div className="flex items-center gap-2">
              <PenLine
                className={`h-4 w-4 ${mode === "flexible" ? "text-[#f7d46d]" : "text-[#8a9092]"}`}
              />
              <span
                className={`text-sm font-bold ${
                  mode === "flexible" ? "text-[#f7d46d]" : "text-[#f1ede5]"
                }`}
              >
                Serviço direto
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d3a548]/15 text-[#f7d46d] border border-[#d3a548]/30">
                Novo
              </span>
            </div>
            <span className="text-[11px] text-[#8a9092]">
              Serviços, custos diretos e preço final em minutos — sem matriz de peças.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("configurator")}
            className={`flex flex-col items-start gap-1.5 p-4 rounded-md border text-left transition-all cursor-pointer select-none ${
              mode === "configurator"
                ? "bg-[#1f1b14] border-[#d3a548]/60 shadow-[0_0_0_1px_rgba(211,165,72,0.25)]"
                : "bg-[#15191a] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers
                className={`h-4 w-4 ${
                  mode === "configurator" ? "text-[#f7d46d]" : "text-[#8a9092]"
                }`}
              />
              <span
                className={`text-sm font-bold ${
                  mode === "configurator" ? "text-[#f7d46d]" : "text-[#f1ede5]"
                }`}
              >
                Configurador de peças (PPF)
              </span>
            </div>
            <span className="text-[11px] text-[#8a9092]">
              Matriz de peças com 3 opções comparativas por nível.
            </span>
          </button>
        </div>

        {!hasPolicy && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30 text-xs text-[#f7d46d]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Configura a base financeira em{" "}
              <Link
                href="/settings/pricing"
                className="underline font-bold hover:text-[#f1ede5] transition-colors"
              >
                Configurações → Orçamentos e preços
              </Link>{" "}
              antes de criar orçamentos flexíveis.
            </span>
          </div>
        )}

        {draftQuoteId && draft && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-[#6e93b5]/10 border border-[#6e93b5]/30 text-xs text-[#9dbdd8]">
            <FileClock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              A editar o rascunho <strong className="font-mono">{draft.quoteNumber}</strong> —
              guardar atualiza o mesmo orçamento; emitir envia a proposta e gera o link seguro.
            </span>
          </div>
        )}

        {draftRequested && !draft && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-[#f05a50]/10 border border-[#f05a50]/30 text-xs text-[#f05a50]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              O rascunho indicado não existe ou já foi enviado — a continuar cria um orçamento
              novo.
            </span>
          </div>
        )}

        {draft && draftEdit?.kind === "not_editable" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-[#f05a50]/10 border border-[#f05a50]/30 text-xs text-[#f05a50]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{draftEdit.reason}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Step 1: Vehicle & Customer selection (partilhado) */}
          <Card className="p-5 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 1 · Viatura & Cliente
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Selecionar Viatura *</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#15191a] text-[#f1ede5]">
                      {v.plateDisplay} — {v.make} {v.model} ({v.generationYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Proprietário</label>
                <div className="h-10 px-3.5 rounded-sm bg-[#080a0b] border border-white/[0.04] flex items-center justify-between text-sm text-[#f1ede5]">
                  <span className="truncate">{selectedCustomer.name}</span>
                  <span className="text-[11px] uppercase font-bold text-[#d3a548] shrink-0">
                    {selectedCustomer.type === "business" ? "B2B" : "Particular"}
                  </span>
                </div>
              </div>
            </div>

            {mode === "configurator" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-white/[0.04]">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#a9adae]">Tipo de Acabamento Base</label>
                  <select
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                  >
                    <option value="gloss">PPF Ultra Gloss (Transparente Auto-regenerativo)</option>
                    <option value="matte">PPF Satin / Matte (Transformação Acetinada)</option>
                    <option value="color_ppf">Color PPF / Vinil Cast</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#a9adae]">Desconto Comercial (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                    className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04] text-xs">
                <label className="font-semibold text-[#a9adae]">Desconto Comercial (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                  className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] sm:max-w-48"
                />
                <span className="text-[10px] text-[#8a9092]">
                  Aplica-se apenas ao configurador de peças; no serviço direto define o preço final diretamente.
                </span>
              </div>
            )}
          </Card>

          {mode === "flexible" ? (
            <>
              {/* Service lines editor */}
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                    Linhas de Serviço
                  </span>
                  <span className="text-[12px] text-[#8a9092]">
                    {serviceLines.length}/6 linhas
                  </span>
                </div>

                {serviceLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 p-4 rounded-md bg-[#15191a] border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
                        Linha {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeServiceLine(index)}
                        disabled={serviceLines.length <= 1}
                        title="Remover linha"
                        className="text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>Nome do serviço *</label>
                        <input
                          value={line.name}
                          onChange={(e) => updateServiceLine(index, { name: e.target.value })}
                          placeholder="ex.: Aplicação de PPF frontal"
                          className={inputCls}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>Modo</label>
                        <select
                          value={line.mode}
                          onChange={(e) =>
                            updateServiceLine(index, {
                              mode: e.target.value as ServiceLineMode,
                            })
                          }
                          className={`${inputCls} cursor-pointer`}
                        >
                          <option value="complete">Completo</option>
                          <option value="spot">Pontual</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Descrição (texto ao cliente)</label>
                      <input
                        value={line.description ?? ""}
                        onChange={(e) => updateServiceLine(index, { description: e.target.value })}
                        placeholder="ex.: Frente completa com película auto-regenerativa"
                        className={inputCls}
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:w-44">
                      <label className={labelCls}>Horas previstas *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={line.hours || ""}
                        onChange={(e) =>
                          updateServiceLine(index, { hours: parseNumberInput(e.target.value) })
                        }
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addServiceLine}
                  disabled={serviceLines.length >= 6}
                  className="self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar linha</span>
                </Button>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
                  <label className="text-xs font-semibold text-[#a9adae]">Notas internas</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas internas do orçamento (não visíveis ao cliente)…"
                    className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] outline-none text-xs text-[#f1ede5]"
                  />
                </div>
              </Card>

              {/* Direct cost blocks */}
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                    Custos Diretos do Serviço
                  </span>
                  <span className="text-[12px] text-[#8a9092]">
                    Materiais, kits, subcontratados e extras
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-md bg-[#080a0b] border border-white/[0.06] select-none overflow-x-auto">
                  {COST_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCostTab(tab.id)}
                      className={`flex-1 py-2 px-2 whitespace-nowrap rounded-sm text-xs font-bold transition-all cursor-pointer ${
                        costTab === tab.id
                          ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                          : "text-[#a9adae] hover:text-[#f1ede5]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {costTab === "material" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548]">
                        Película / Vinil
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={addMaterialLine}>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar linha</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearCostBlock("material")}
                          disabled={materialLines.length === 0}
                        >
                          <span>Limpar</span>
                        </Button>
                      </div>
                    </div>

                    {materialLines.length === 0 && (
                      <p className="text-[11px] text-[#8a9092]">
                        Sem linhas de material. Adiciona a película ou vinil a aplicar.
                      </p>
                    )}

                    {materialLines.map((line) => {
                      const lineIndex = costLines.indexOf(line);
                      return (
                        <div
                          key={lineIndex}
                          className="flex flex-col gap-2.5 p-3 rounded-sm bg-[#080a0b]/60 border border-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              value={line.name}
                              onChange={(e) =>
                                updateCostLine(lineIndex, { name: e.target.value })
                              }
                              placeholder="Nome do material * (ex.: Oracal 970-932)"
                              className={`${inputCls} flex-1`}
                            />
                            <span className="text-xs font-bold text-[#f7d46d] tabular-nums shrink-0">
                              {formatCurrency(line.totalCost)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCostLine(lineIndex)}
                              title="Remover"
                              className="text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Quantidade *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={line.quantity || ""}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    quantity: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Unidade</label>
                              <select
                                value={line.unit}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    unit: e.target.value as CostLineUnit,
                                  })
                                }
                                className={`${inputCls} cursor-pointer`}
                              >
                                {COST_UNIT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Custo unitário *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.unitCost || ""}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    unitCost: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Desperdício %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={line.wasteRatePercent}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    wasteRatePercent: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {costTab === "kit" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548]">
                        Kits de consumíveis
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearCostBlock("consumable_kit")}
                        disabled={kitLines.length === 0}
                      >
                        <span>Limpar</span>
                      </Button>
                    </div>

                    {activeKits.length === 0 && (
                      <p className="text-[11px] text-[#8a9092]">Sem kits ativos configurados.</p>
                    )}

                    {activeKits.map((kit) => {
                      const kitLine = kitLines.find((l) => l.kitId === kit.id);
                      const kitIndex = kitLine ? costLines.indexOf(kitLine) : -1;
                      return (
                        <div
                          key={kit.id}
                          className="flex flex-wrap items-end gap-2 p-3 rounded-sm bg-[#080a0b]/60 border border-white/[0.04]"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#f1ede5] truncate">
                              {kit.name}
                            </span>
                            <span className="text-[11px] text-[#8a9092] tabular-nums">
                              {formatCurrency(kit.price)}
                            </span>
                          </div>

                          {kitLine ? (
                            <>
                              <div className="flex flex-col gap-1 w-24">
                                <label className={labelCls}>Quantidade</label>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={kitLine.quantity || ""}
                                  onChange={(e) =>
                                    updateCostLine(kitIndex, {
                                      quantity: parseNumberInput(e.target.value),
                                    })
                                  }
                                  className={inputCls}
                                />
                              </div>
                              <span className="text-xs font-bold text-[#f7d46d] tabular-nums pb-2">
                                {formatCurrency(kitLine.totalCost)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeCostLine(kitIndex)}
                                title="Remover"
                                className="text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer pb-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => toggleKit(kit)}>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Adicionar</span>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {costTab === "sublet" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548]">
                        Subcontratados
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearCostBlock("sublet")}
                        disabled={subletLines.length === 0}
                      >
                        <span>Limpar</span>
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedSupplierServiceId}
                        onChange={(e) => setSelectedSupplierServiceId(e.target.value)}
                        className={`${inputCls} flex-1 cursor-pointer`}
                      >
                        <option value="">Selecionar serviço de fornecedor…</option>
                        {activeSupplierServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.supplierName} — {service.serviceName} (
                            {formatCurrency(service.basePrice)})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSubletLine}
                        disabled={!selectedSupplierServiceId}
                        className="self-start"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar serviço</span>
                      </Button>
                    </div>

                    {activeSupplierServices.length === 0 && (
                      <p className="text-[11px] text-[#8a9092]">
                        Sem serviços de fornecedores disponíveis.
                      </p>
                    )}

                    {subletLines.length > 0 && (
                      <p className="text-[11px] text-[#8a9092] leading-relaxed">
                        Estas horas saem do trabalho interno para não pagares a desmontagem duas vezes.
                      </p>
                    )}

                    {subletLines.map((line) => {
                      const lineIndex = costLines.indexOf(line);
                      return (
                        <div
                          key={lineIndex}
                          className="flex flex-col gap-2.5 p-3 rounded-sm bg-[#080a0b]/60 border border-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#f1ede5] truncate">
                              {line.name}
                            </span>
                            <span className="text-xs font-bold text-[#a9adae] tabular-nums shrink-0">
                              {formatCurrency(line.unitCost)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCostLine(lineIndex)}
                              title="Remover"
                              className="text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Quantidade</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={line.quantity || ""}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    quantity: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Horas internas deduzidas</label>
                              <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={line.deductedHours ?? 0}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    deductedHours: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Total</label>
                              <div className="h-9 px-3 rounded-sm bg-[#080a0b] border border-white/[0.04] flex items-center text-xs font-bold text-[#f7d46d] tabular-nums">
                                {formatCurrency(line.totalCost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {costTab === "extra" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#d3a548]">
                        Extras
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={addExtraLine}>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar extra</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearCostBlock("extra")}
                          disabled={extraLines.length === 0}
                        >
                          <span>Limpar</span>
                        </Button>
                      </div>
                    </div>

                    {extraLines.length === 0 && (
                      <p className="text-[11px] text-[#8a9092]">
                        Sem extras. Adiciona custos pontuais do trabalho.
                      </p>
                    )}

                    {extraLines.map((line) => {
                      const lineIndex = costLines.indexOf(line);
                      return (
                        <div
                          key={lineIndex}
                          className="flex flex-col gap-2.5 p-3 rounded-sm bg-[#080a0b]/60 border border-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              value={line.name}
                              onChange={(e) =>
                                updateCostLine(lineIndex, { name: e.target.value })
                              }
                              placeholder="Nome do extra *"
                              className={`${inputCls} flex-1`}
                            />
                            <button
                              type="button"
                              onClick={() => removeCostLine(lineIndex)}
                              title="Remover"
                              className="text-[#8a9092] hover:text-[#f05a50] transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Custo *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.unitCost || ""}
                                onChange={(e) =>
                                  updateCostLine(lineIndex, {
                                    unitCost: parseNumberInput(e.target.value),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className={labelCls}>Total</label>
                              <div className="h-9 px-3 rounded-sm bg-[#080a0b] border border-white/[0.04] flex items-center text-xs font-bold text-[#f7d46d] tabular-nums">
                                {formatCurrency(line.totalCost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          ) : (
            /* Step 2: Customizing the 3 Options (modo configurador PPF) */
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                  Passo 2 · Matriz de Peças por Opção da Proposta
                </span>
                <span className="text-[12px] text-[#8a9092]">
                  Personaliza as peças incluídas em cada nível
                </span>
              </div>

              {/* Option Tier Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-md bg-[#080a0b] border border-white/[0.06] select-none">
                <button
                  type="button"
                  onClick={() => setActiveTierTab("essential")}
                  className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                    activeTierTab === "essential"
                      ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                      : "text-[#a9adae] hover:text-[#f1ede5]"
                  }`}
                >
                  Opção 1: Essencial ({essentialParts.length} peças)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTierTab("recommended")}
                  className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                    activeTierTab === "recommended"
                      ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                      : "text-[#a9adae] hover:text-[#f1ede5]"
                  }`}
                >
                  Opção 2: Recomendada ⭐ ({recommendedParts.length} peças)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTierTab("premium")}
                  className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                    activeTierTab === "premium"
                      ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                      : "text-[#a9adae] hover:text-[#f1ede5]"
                  }`}
                >
                  Opção 3: Premium ({premiumParts.length} peças)
                </button>
              </div>

              {/* Active Matrix */}
              {activeTierTab === "essential" && (
                <QuotePartsMatrix
                  selectedPartCodes={essentialParts}
                  onChangeParts={setEssentialParts}
                  segmentMultiplier={segmentMultiplier}
                />
              )}
              {activeTierTab === "recommended" && (
                <QuotePartsMatrix
                  selectedPartCodes={recommendedParts}
                  onChangeParts={setRecommendedParts}
                  segmentMultiplier={segmentMultiplier}
                />
              )}
              {activeTierTab === "premium" && (
                <QuotePartsMatrix
                  selectedPartCodes={premiumParts}
                  onChangeParts={setPremiumParts}
                  segmentMultiplier={segmentMultiplier}
                />
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Real-Time Financial Summary Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="sticky top-6 flex flex-col gap-4">
            {mode === "flexible" ? (
              <FlexibleQuoteSummary
                rates={rates}
                formulaPublished={formula !== null}
                suggestion={suggestion}
                financials={financials}
                warnings={warnings}
                isManual={hasManualPrice}
                finalPriceInput={finalPriceInput}
                onFinalPriceChange={handleFinalPriceChange}
                onRestoreSuggestion={restoreSuggestion}
                adjustReason={adjustReason}
                onAdjustReasonChange={setAdjustReason}
                showSuggestionChangedNotice={suggestionChanged}
                submittingIntent={submitting}
                canSubmit={canSubmitFlexible}
                submitError={submitError}
                onSaveDraft={() => void handleFlexibleSubmit("draft")}
                onEmit={() => void handleFlexibleSubmit("send")}
              />
            ) : (
              <>
                <QuoteFinancialSummary financials={currentActiveOption} />

                <div className="p-4 rounded-lg bg-[#101314] border border-white/[0.06] text-xs text-[#a9adae] flex flex-col gap-2">
                  <span className="font-bold text-[#f1ede5]">
                    Dica da Metodologia X-Motion:
                  </span>
                  <p className="leading-relaxed">
                    Apresentar 3 opções estruturadas aumenta a taxa de conversão em 40%, permitindo ao cliente escolher o nível de proteção adequado ao seu perfil de condução.
                  </p>
                </div>

                <Button variant="primary" onClick={handleCreateQuote} size="lg" className="w-full">
                  <Check className="h-4 w-4" />
                  <span>Emitir Proposta</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
