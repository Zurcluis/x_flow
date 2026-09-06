"use client";

import React, { useState } from "react";
import { Vehicle } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuotePartsMatrix } from "@/components/xflow/quotes/QuotePartsMatrix";
import { QuoteFinancialSummary } from "@/components/xflow/quotes/QuoteFinancialSummary";
import { buildQuoteOptionFromParts } from "@/domains/quotes/pricing-engine";
import { OptionTier } from "@/domains/quotes/types";
import { VEHICLE_SEGMENT_MULTIPLIERS } from "@/domains/catalog/types";
import { createQuoteAction } from "@/app/actions/quotes";

export function NewQuoteView({
  vehicles: vehiclesProp,
  customers: customersProp,
  initialVehicleId,
  simRef,
}: {
  vehicles: Vehicle[];
  customers: Customer[];
  initialVehicleId?: string;
  simRef?: { finish: string; coverageLabel: string } | null;
}) {
  const router = useRouter();

  const [vehicles] = useState(vehiclesProp);
  const [customers] = useState(customersProp);

  // Selected vehicle & customer — sincroniza quando a URL muda (ex.: "Refazer Proposta")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    if (initialVehicleId && vehicles.some((x) => x.id === initialVehicleId)) {
      return initialVehicleId;
    }
    return vehicles[0]?.id ?? "";
  });
  const [appliedInit, setAppliedInit] = useState(initialVehicleId);
  if (initialVehicleId && initialVehicleId !== appliedInit && vehicles.some((x) => x.id === initialVehicleId)) {
    setAppliedInit(initialVehicleId);
    setSelectedVehicleId(initialVehicleId);
  }
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedCustomer =
    customers.find((c) => c.id === selectedVehicle?.currentOwner?.customerId) ||
    customers[0];

  // Options configuration
  const [finish, setFinish] = useState<string>("gloss");
  const [discountRate, setDiscountRate] = useState<number>(
    selectedCustomer?.b2bDetails?.discountRate ?? 0
  );

  // Parts for the 3 options
  const [essentialParts, setEssentialParts] = useState<string[]>([
    "hood",
    "front_bumper",
    "headlights",
  ]);

  const [recommendedParts, setRecommendedParts] = useState<string[]>([
    "hood",
    "front_bumper",
    "front_fenders",
    "headlights",
    "mirrors",
    "rocker_panels",
    "door_sills",
  ]);

  const [premiumParts, setPremiumParts] = useState<string[]>([
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
  ]);

  const [activeTierTab, setActiveTierTab] = useState<OptionTier>("recommended");

  // Dynamically compute options using the pricing engine
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

  const [saving, setSaving] = useState(false);
  const [emitError, setEmitError] = useState<string | null>(null);

  const handleCreateQuote = async () => {
    if (!selectedVehicleId || !selectedCustomer?.id) {
      setEmitError("Seleciona a viatura e o cliente antes de emitir.");
      return;
    }
    setSaving(true);
    setEmitError(null);
    const result = await createQuoteAction({
      vehicleId: selectedVehicleId,
      customerId: selectedCustomer.id,
      options: [option1, option2, option3],
    });
    setSaving(false);
    if (!result.ok) {
      setEmitError(result.error);
      return;
    }
    router.push(`/quotes/${result.quoteId}`);
  };

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
              Novo Orçamento Multi-Opção
            </h1>
          </div>
        </div>

        {emitError && (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle Selection, Finish & Parts Matrix */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Step 1: Vehicle & Customer selection */}
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

            {/* Finish & Discount */}
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
          </Card>

          {/* Step 2: Customizing the 3 Options */}
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
        </div>

        {/* Right Column: Real-Time Financial Summary Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="sticky top-6 flex flex-col gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
