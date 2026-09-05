"use client";

import React, { useState } from "react";
import { Vehicle } from "@/domains/vehicles/types";
import { initialFinishPresets } from "@/lib/demo-data/vision-simulation-data";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  ArrowRight,
  Car,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinishSelector } from "@/components/xflow/simulator/FinishSelector";
import {
  calculateColorContrast,
  recommendCoverageLevel,
  formatCoverageLabel,
} from "@/domains/intelligence/vision-analyzer";
import { FinishPreset } from "@/domains/intelligence/types";

export function SimulatorView({ vehicles: vehiclesProp }: { vehicles: Vehicle[] }) {
  const [vehicles] = useState(vehiclesProp);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0].id);
  const [presets] = useState(initialFinishPresets);
  const [selectedPreset, setSelectedPreset] = useState<FinishPreset>(presets[0]);
  const [selectedCoverage, setSelectedCoverage] = useState<"exterior" | "extended" | "integral">("extended");

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Contrast calculation
  const originalColorFamily = selectedVehicle.originalColorFamily || "green";

  const targetColorFamily = selectedPreset.type.includes("clear")
    ? originalColorFamily
    : selectedPreset.name.toLowerCase().includes("grey")
    ? "dark_grey"
    : selectedPreset.name.toLowerCase().includes("black")
    ? "black"
    : "custom";

  const contrastLevel = calculateColorContrast(
    originalColorFamily,
    targetColorFamily
  );

  const recommendedCoverage = recommendCoverageLevel(
    contrastLevel,
    selectedPreset.type.includes("ppf") && !selectedPreset.type.includes("color")
      ? "PPF"
      : "Wrap"
  );

  // Estimations
  const estimatedMeters = 18;
  const materialCost = (estimatedMeters * selectedPreset.costPerMeterCents) / 100;
  const estimatedSellingPrice = Math.round(materialCost * 2.85);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="gold"
              className="text-[11px] uppercase font-mono tracking-wider flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Est├║dio de Acabamentos 3D & Simula├º├úo
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Simulador de Acabamentos e Cores
          </h1>
          <p className="text-sm text-[#a9adae]">
            Simula├º├úo fidedigna de pel├¡cula PPF, vinil e Chrome Delete com an├ílise em direto de contraste e cobertura.
          </p>
        </div>

        <Link href="/quotes/new">
          <Button className="bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d] font-bold">
            <span>Criar Or├ºamento com este Acabamento</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Vehicle Selection Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-[#a9adae] shrink-0 mr-1">
          Viatura de Teste:
        </span>
        {vehicles.slice(0, 4).map((v) => {
          const isSelected = v.id === selectedVehicleId;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
                  : "bg-[#101314] text-[#a9adae] border-white/[0.08] hover:border-white/20"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>
                {v.make} {v.model} ({v.plateDisplay})
              </span>
            </button>
          );
        })}
      </div>

      {/* Visual Simulation Stage */}
      <div className="relative w-full h-80 sm:h-96 rounded-[20px] overflow-hidden bg-gradient-to-b from-[#0e1214] to-[#060809] border border-white/[0.08] flex items-center justify-center p-6 shadow-2xl">
        {/* Background Ambient Studio Light */}
        <div
          style={{
            backgroundColor: selectedPreset.colorHex,
            opacity: 0.15,
          }}
          className="absolute inset-0 blur-3xl transition-all duration-700 pointer-events-none"
        />

        {/* Vehicle Render Image */}
        <div className="relative z-10 w-full max-w-2xl h-full flex flex-col items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&auto=format&fit=crop&q=80"
            alt={selectedVehicle.model}
            className="max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-all duration-500"
          />
        </div>

        {/* Floating Finish Badge on Stage */}
        <div className="absolute top-4 left-4 p-3 rounded-[12px] bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] flex items-center gap-3">
          <div
            style={{ backgroundColor: selectedPreset.colorHex }}
            className="h-6 w-6 rounded-full border border-white/30"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#f1ede5]">
              {selectedPreset.name}
            </span>
            <span className="text-[11px] text-[#d3a548] uppercase tracking-wider font-mono">
              Efeito {selectedPreset.textureEffect.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Floating Quick Specs */}
        <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-2 p-2.5 rounded-[12px] bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] text-xs text-[#a9adae]">
          <Shield className="h-4 w-4 text-[#68a46b]" />
          <span>Garantia de {selectedPreset.warrantyYears} Anos</span>
          <span>ÔÇó</span>
          <span className="text-[#f1ede5] font-mono">
            {(selectedPreset.costPerMeterCents / 100).toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
            /m
          </span>
        </div>
      </div>

      {/* Contrast & Coverage Analysis Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">Contraste com a Cor de Origem</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#f1ede5]">
              {selectedVehicle.originalColorName} ÔåÆ {selectedPreset.name}
            </span>
            <Badge
              variant={contrastLevel === "high" ? "danger" : "gold"}
              className="text-[11px] uppercase font-mono"
            >
              Contraste {contrastLevel === "high" ? "Alto" : "Baixo / M├®dio"}
            </Badge>
          </div>
          <span className="text-[12px] text-[#a9adae]">
            {contrastLevel === "high"
              ? "Requer acabamentos profundos nas cavas para disfar├ºar cor de f├íbrica."
              : "Transi├º├úo crom├ítica suave sem risco de vincos vis├¡veis."}
          </span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">N├¡vel de Cobertura Recomendado</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#d3a548]">
              {formatCoverageLabel(recommendedCoverage)}
            </span>
          </div>
          <div className="flex gap-1.5 mt-1">
            {(["exterior", "extended", "integral"] as const).map((cov) => (
              <button
                key={cov}
                type="button"
                onClick={() => setSelectedCoverage(cov)}
                className={`px-2 py-1 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  selectedCoverage === cov
                    ? "bg-[#d3a548] text-[#050606]"
                    : "bg-white/[0.04] text-[#a9adae] hover:bg-white/[0.08]"
                }`}
              >
                {cov === "exterior" ? "Exterior" : cov === "extended" ? "Estendida" : "Integral"}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">Estimativa de Valor & Material</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#f1ede5] font-mono">
              {estimatedSellingPrice.toLocaleString("pt-PT", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
            <span className="text-xs text-[#68a46b] font-semibold">
              ~{estimatedMeters}m necess├írios
            </span>
          </div>
          <span className="text-[12px] text-[#a9adae]">
            Custo material: {materialCost.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} ÔÇó Margem estimada: ~65%
          </span>
        </Card>
      </div>

      {/* Finish Presets Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#f1ede5] flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#d3a548]" />
          <span>Cat├ílogo de Acabamentos e Cores</span>
        </h3>

        <FinishSelector
          presets={presets}
          selectedPresetId={selectedPreset.id}
          onSelectPreset={setSelectedPreset}
        />
      </div>
    </div>
  );
}
