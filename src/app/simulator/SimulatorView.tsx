"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Vehicle } from "@/domains/vehicles/types";
import { initialFinishPresets } from "@/lib/demo-data/vision-simulation-data";
import { simulateFilmOnPhoto } from "@/lib/film-simulation";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  ArrowRight,
  Car,
  Sliders,
  Info,
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

// Parâmetros de negócio — configuráveis, alinhados com o blueprint (33 €/h)
const HOURLY_RATE_EUR = 33;
const PRICE_MULTIPLIER = 2.5;
const MATERIAL_METERS: Record<"exterior" | "extended" | "integral", number> = {
  exterior: 14,
  extended: 17,
  integral: 21,
};
const LABOR_HOURS: Record<"exterior" | "extended" | "integral", number> = {
  exterior: 24,
  extended: 30,
  integral: 36,
};
const HIGH_CONTRAST_EXTRA_HOURS = 4;
const SUV_EXTRA_HOURS = 4;
const HIGH_CONTRAST_ZONES = [
  "Puxadores",
  "Retrovisores",
  "Emblemas",
  "Óticas",
  "Frisos",
  "Borrachas",
  "Arestas de capô e mala",
  "Uniões de para-choques",
  "Entradas de cavas",
];

function presetTargetFamily(preset: FinishPreset): string {
  if (preset.type.startsWith("clear_ppf")) return "clear";
  const n = preset.name.toLowerCase();
  if (n.includes("black")) return "black";
  if (n.includes("grey") || n.includes("gray")) return "dark_grey";
  if (n.includes("white")) return "white";
  if (n.includes("silver")) return "silver";
  if (n.includes("blue")) return "dark_blue";
  if (n.includes("green")) return "green";
  if (n.includes("red")) return "red";
  return "custom";
}

export function SimulatorView({
  vehicles: vehiclesProp,
  coverPhotos,
  films,
}: {
  vehicles: Vehicle[];
  coverPhotos: Record<string, string>;
  films?: FinishPreset[];
}) {
  const [vehicles] = useState(vehiclesProp);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0].id);
  const [presets] = useState<FinishPreset[]>(
    films && films.length > 0 ? films : initialFinishPresets
  );
  const [selectedPreset, setSelectedPreset] = useState<FinishPreset>(presets[0]);
  const [selectedCoverage, setSelectedCoverage] = useState<"exterior" | "extended" | "integral">("extended");
  const [sliderPos, setSliderPos] = useState(50);

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const coverPhoto = coverPhotos[selectedVehicle.id];

  const originalColorFamily = selectedVehicle.originalColorFamily || "green";
  const targetColorFamily = presetTargetFamily(selectedPreset);
  const isClearFilm = selectedPreset.type.startsWith("clear_ppf");
  const serviceType = isClearFilm ? "PPF" : "Wrap";

  // Simulação física (canvas, preservação de luminância) — fallback CSS enquanto processa
  const [simResult, setSimResult] = useState<{ key: string; url: string | null }>({
    key: "",
    url: null,
  });
  const canSimulate =
    selectedPreset.textureEffect !== "carbon" && selectedPreset.glossGu !== undefined;
  const simKey = `${selectedVehicle.id}|${selectedPreset.id}|${coverPhoto ? "foto" : "sem"}`;

  useEffect(() => {
    if (!coverPhoto || !canSimulate || !selectedPreset.glossGu) return;
    let cancelled = false;
    simulateFilmOnPhoto(coverPhoto, {
      colorHex: selectedPreset.colorHex,
      glossGu: selectedPreset.glossGu,
      metallic: selectedPreset.metallic ?? 0,
      flakeScale: selectedPreset.flakeScale ?? 0,
      transparent: isClearFilm,
    })
      .then((url) => {
        if (!cancelled) setSimResult({ key: simKey, url });
      })
      .catch(() => {
        if (!cancelled) setSimResult({ key: simKey, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [coverPhoto, simKey, canSimulate, isClearFilm, selectedPreset.glossGu, selectedPreset.colorHex, selectedPreset.metallic, selectedPreset.flakeScale]);

  const simUrl = simResult.key === simKey ? simResult.url : null;
  const simPending = Boolean(coverPhoto) && canSimulate && simUrl === null;

  const contrastLevel = calculateColorContrast(
    originalColorFamily,
    targetColorFamily
  );

  const recommendedCoverage = useMemo(
    () => recommendCoverageLevel(contrastLevel, serviceType) as "exterior" | "extended" | "integral",
    [contrastLevel, serviceType]
  );

  // Sincroniza a cobertura com a recomendação (padrão "adjust state on prop change")
  const [prevRecommended, setPrevRecommended] = useState<string | null>(null);
  if (prevRecommended !== recommendedCoverage) {
    setPrevRecommended(recommendedCoverage);
    setSelectedCoverage(recommendedCoverage);
  }

  // Estimativa determinística (blueprint secção 11: custo direto + margem)
  const meters = MATERIAL_METERS[selectedCoverage] + (contrastLevel === "high" ? 2 : 0);
  const materialCost = (meters * selectedPreset.costPerMeterCents) / 100;

  const isLargeBody = ["suv", "van", "pickup"].includes(selectedVehicle.bodyType);
  const laborHours =
    LABOR_HOURS[selectedCoverage] +
    (contrastLevel === "high" ? HIGH_CONTRAST_EXTRA_HOURS : 0) +
    (isLargeBody ? SUV_EXTRA_HOURS : 0);
  const laborCost = laborHours * HOURLY_RATE_EUR;

  const directCost = materialCost + laborCost;
  const sellingPrice = Math.round(directCost * PRICE_MULTIPLIER);
  const marginPct = Math.round(((sellingPrice - directCost) / sellingPrice) * 100);

  const eur = (v: number) =>
    v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const quoteHref = `/quotes/new?vehicle=${selectedVehicle.id}&finish=${encodeURIComponent(selectedPreset.name)}&coverage=${selectedCoverage}`;

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
              Estúdio de Acabamentos 3D & Simulação
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Simulador de Acabamentos e Cores
          </h1>
          <p className="text-sm text-[#a9adae]">
            Simulação fidedigna de película PPF, vinil e Chrome Delete com análise em direto de contraste e cobertura.
          </p>
        </div>

        <Link href={quoteHref}>
          <Button className="bg-[#d3a548] text-[#050606] hover:bg-[#f7d46d] font-bold">
            <span>Criar Orçamento com este Acabamento</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Vehicle Selection Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-[#a9adae] shrink-0 mr-1">
          Viatura de Teste:
        </span>
        {vehicles.map((v) => {
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
      <div className="relative w-full h-80 sm:h-[26rem] rounded-[20px] overflow-hidden bg-gradient-to-b from-[#0e1214] to-[#060809] border border-white/[0.08] flex items-center justify-center p-6 shadow-2xl">
        {/* Background Ambient Studio Light */}
        <div
          style={{
            backgroundColor: isClearFilm ? "#0e1214" : selectedPreset.colorHex,
            opacity: 0.15,
          }}
          className="absolute inset-0 blur-3xl transition-all duration-700 pointer-events-none"
        />

        {/* Vehicle Render */}
        <div className="relative z-10 w-full max-w-2xl h-full flex flex-col items-center justify-center select-none">
          {coverPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Original (base) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPhoto}
                alt={`${selectedVehicle.make} ${selectedVehicle.model} original`}
                className="max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
              />

              {/* Simulated (tinted, clipped from the left by the slider) */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                {simUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={simUrl}
                      alt={`${selectedVehicle.make} ${selectedVehicle.model} simulado`}
                      className="max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                    />
                    {selectedPreset.textureEffect === "carbon" && (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 4px)",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPhoto}
                      alt={`${selectedVehicle.make} ${selectedVehicle.model} simulado`}
                      className="max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                    />
                    {!isClearFilm && (
                      <>
                        <div
                          style={{ backgroundColor: selectedPreset.colorHex, mixBlendMode: "color" }}
                          className="absolute inset-0"
                        />
                        <div
                          style={{ backgroundColor: selectedPreset.colorHex, mixBlendMode: "multiply", opacity: 0.3 }}
                          className="absolute inset-0"
                        />
                      </>
                    )}
                    {selectedPreset.textureEffect === "gloss" && (
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25" />
                    )}
                    {selectedPreset.textureEffect === "satin" && (
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/15" />
                    )}
                    {selectedPreset.textureEffect === "matte" && (
                      <div
                        className="absolute inset-0"
                        style={{ backdropFilter: "saturate(0.65) contrast(0.95)" }}
                      />
                    )}
                    {selectedPreset.textureEffect === "carbon" && (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 4px)",
                        }}
                      />
                    )}
                    {simPending && (
                      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-[#050606]/85 border border-white/[0.1] text-[10px] text-[#a9adae]">
                        a processar simulação física…
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Divider handle */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#d3a548] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#050606]/90 border border-[#d3a548] flex items-center justify-center text-[10px] font-bold text-[#f7d46d]">
                  ↔
                </div>
              </div>

              {/* Slider control */}
              <input
                type="range"
                min={5}
                max={95}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                aria-label="Comparar original e simulado"
                className="absolute bottom-2 left-0 w-full h-6 opacity-0 cursor-ew-resize"
              />

              {/* Labels */}
              <span className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-wider text-[#8a9092]">
                Original
              </span>
              <span className="absolute bottom-2 right-3 text-[10px] font-bold uppercase tracking-wider text-[#f7d46d]">
                Simulado · {selectedPreset.name}
              </span>
            </div>
          ) : (
            /* Silhueta vetorial quando não existem fotografias de check-in */
            <svg viewBox="0 0 400 170" className="w-full max-w-xl">
              <path
                d="M30 115 Q28 85 62 78 L108 48 Q120 42 142 42 L258 42 Q288 42 308 62 L340 78 Q372 83 372 108 Q372 120 355 120 L45 120 Q30 120 30 115 Z"
                fill={isClearFilm ? "#3a4043" : selectedPreset.colorHex}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
              />
              <path
                d="M118 52 L150 50 L150 76 L102 76 Z M160 50 L250 50 L288 76 L160 76 Z"
                fill="#0a0d0e"
                opacity="0.85"
              />
              <circle cx="112" cy="120" r="20" fill="#0a0d0e" stroke="#2a2f31" strokeWidth="4" />
              <circle cx="298" cy="120" r="20" fill="#0a0d0e" stroke="#2a2f31" strokeWidth="4" />
            </svg>
          )}
        </div>

        {/* Floating Finish Badge on Stage */}
        <div className="absolute top-4 left-4 p-3 rounded-md bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] flex items-center gap-3">
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
              {selectedPreset.glossGu !== undefined && ` · ${Math.round(selectedPreset.glossGu)} GU`}
            </span>
          </div>
        </div>

        {/* Representation disclaimer (requisito blueprint: simulação com aviso) */}
        <div className="absolute top-4 right-4 max-w-[180px] p-2.5 rounded-sm bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] flex items-start gap-1.5 text-[10px] text-[#a9adae]">
          <Info className="h-3.5 w-3.5 text-[#d3a548] shrink-0 mt-0.5" />
          <span>Simulação meramente representativa. A cor final pode variar face ao material real.</span>
        </div>

        {/* Floating Quick Specs */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 p-2.5 rounded-md bg-[#050606]/85 backdrop-blur-md border border-white/[0.1] text-xs text-[#a9adae]">
          <Shield className="h-4 w-4 text-[#68a46b]" />
          <span>Garantia de {selectedPreset.warrantyYears} Anos</span>
          <span>•</span>
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
              {selectedVehicle.originalColorName} → {selectedPreset.name}
            </span>
            <Badge
              variant={contrastLevel === "high" ? "danger" : "gold"}
              className="text-[11px] uppercase font-mono"
            >
              Contraste {contrastLevel === "high" ? "Alto" : "Baixo / Médio"}
            </Badge>
          </div>
          <span className="text-[12px] text-[#a9adae]">
            {contrastLevel === "high"
              ? "Requer acabamentos profundos nas cavas para disfarçar cor de fábrica."
              : "Transição cromática suave sem risco de vincos visíveis."}
          </span>
          {contrastLevel === "high" && !isClearFilm && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {HIGH_CONTRAST_ZONES.map((zone) => (
                <span
                  key={zone}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f05a50]/10 text-[#f78e85] border border-[#f05a50]/25"
                >
                  {zone}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-xs text-[#a9adae]">Nível de Cobertura Recomendado</span>
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

        {/* Estimativa determinística */}
        <Card className="p-4 bg-[#101314] border-white/[0.06] flex flex-col gap-2">
          <span className="text-xs text-[#a9adae]">Estimativa de Valor & Material</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#f1ede5] font-mono">
              {eur(sellingPrice)}
            </span>
            <span className="text-xs text-[#68a46b] font-semibold">
              ~{meters}m · ~{laborHours}h
            </span>
          </div>
          <div className="text-[12px] text-[#a9adae] flex flex-col gap-0.5">
            <span className="flex justify-between">
              <span>Material ({meters}m)</span>
              <span className="font-mono">{eur(materialCost)}</span>
            </span>
            <span className="flex justify-between">
              <span>Mão de obra ({laborHours}h × {HOURLY_RATE_EUR}€)</span>
              <span className="font-mono">{eur(laborCost)}</span>
            </span>
            <span className="flex justify-between">
              <span>Custo direto</span>
              <span className="font-mono">{eur(directCost)}</span>
            </span>
            <span className="flex justify-between text-[#f1ede5]">
              <span>Margem estimada</span>
              <span className="font-mono">~{marginPct}%</span>
            </span>
          </div>
          <span className="text-[10px] text-[#747a7c] pt-1">
            Estimativa automática — sujeita a confirmação no orçamento.
          </span>
        </Card>
      </div>

      {/* Finish Presets Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#f1ede5] flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#d3a548]" />
          <span>Catálogo de Acabamentos e Cores</span>
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
