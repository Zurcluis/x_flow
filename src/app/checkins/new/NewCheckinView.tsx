"use client";

import React, { useState } from "react";
import { Vehicle } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Car,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleDamageMapper } from "@/components/xflow/checkins/VehicleDamageMapper";
import { PhotoInspectionGrid } from "@/components/xflow/checkins/PhotoInspectionGrid";
import { SignaturePad } from "@/components/xflow/checkins/SignaturePad";
import {
  CheckinDamage,
  CheckinPhoto,
  CheckinBelonging,
  FuelLevel,
} from "@/domains/checkins/types";
import { validateCheckinSubmission } from "@/domains/checkins/roof-validator";

export function NewCheckinView({ vehicles: vehiclesProp, customers: customersProp }: { vehicles: Vehicle[]; customers: Customer[] }) {
  const router = useRouter();
  const [vehicles] = useState(vehiclesProp);
  const [customers] = useState(customersProp);

  // Active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Vehicle & Customer
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[3]?.id || vehicles[0]?.id || ""
  );
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedCustomer =
    customers.find((c) => c.id === selectedVehicle?.currentOwner?.customerId) ||
    customers[0];

  // Step 2: Odometer, Fuel & Belongings
  const [mileage, setMileage] = useState<number>(45200);
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("half");
  const [cleanlinessStatus, setCleanlinessStatus] = useState<
    "clean" | "dusty" | "dirty" | "needs_decontamination"
  >("clean");
  const [belongings, setBelongings] = useState<CheckinBelonging[]>([
    { id: "b1", itemName: "Chave da Viatura", isPresent: true, notes: "Chave original" },
    { id: "b2", itemName: "Perno de Segurança de Jantes", isPresent: true, notes: "Na bagageira" },
    { id: "b3", itemName: "Documento Único Automóvel (DUA)", isPresent: true, notes: "No porta-luvas" },
    { id: "b4", itemName: "Cabo de Carregamento / Acessórios", isPresent: false },
    { id: "b5", itemName: "Objetos de Valor Pessoais", isPresent: false, notes: "Confirmado sem objetos" },
  ]);

  // Step 3: Damages
  const [damages, setDamages] = useState<CheckinDamage[]>([]);

  // Step 4: Photos
  const [photos, setPhotos] = useState<CheckinPhoto[]>([
    {
      id: "p-init-1",
      photoUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=60",
      angle: "front",
      label: "Frente",
      isMandatory: false,
      createdAt: "2026-08-28 14:15",
    },
    {
      id: "p-init-2",
      photoUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=60",
      angle: "odometer",
      label: "Odómetro",
      isMandatory: false,
      createdAt: "2026-08-28 14:16",
    },
  ]);

  // Step 5: Signature & Approver
  const [signerName, setSignerName] = useState<string>(selectedCustomer?.name || "");
  const [, setSignatureDataUrl] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const toggleBelonging = (id: string) => {
    setBelongings(
      belongings.map((b) => (b.id === id ? { ...b, isPresent: !b.isPresent } : b))
    );
  };

  const handleNextStep = () => {
    // If moving from step 4 to 5, check validation
    if (currentStep === 4) {
      const validation = validateCheckinSubmission({
        mileage,
        photos,
        signedByName: signerName,
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }
    }

    setValidationErrors([]);
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setValidationErrors([]);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalizeCheckin = () => {
    const validation = validateCheckinSubmission({
      mileage,
      photos,
      signedByName: signerName,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Success redirect
    router.push("/checkins");
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <Link href="/checkins">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#a9adae]">
              Processo de Receção e Inspeção Fotográfica
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              Novo Check-in de Entrada
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#a9adae]">
          <span>Passo {currentStep} de 5</span>
        </div>
      </div>

      {/* 5-Step Stepper Bar */}
      <div className="grid grid-cols-5 gap-2 select-none">
        {[
          { num: 1, label: "1. Viatura" },
          { num: 2, label: "2. Odómetro & Pertences" },
          { num: 3, label: "3. Mapa de Danos" },
          { num: 4, label: "4. Fotos (Tejadilho)" },
          { num: 5, label: "5. Assinatura" },
        ].map((step) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-[12px] border text-center transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d] shadow-sm"
                  : isDone
                  ? "bg-[#141b17] border-[#68a46b]/40 text-[#68a46b]"
                  : "bg-[#101314] border-white/[0.04] text-[#8a9092]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isDone && <Check className="h-3.5 w-3.5" />}
                <span className="truncate">{step.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-[14px] bg-[#2a1210] border border-[#f05a50] text-[#f05a50] flex flex-col gap-1.5 animate-shake">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Validação Pendente: Corrige os seguintes pontos</span>
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1 text-[#f78e85]">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <div className="flex flex-col gap-6">
        {/* Step 1: Vehicle & Customer Selection */}
        {currentStep === 1 && (
          <Card className="p-6 flex flex-col gap-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 1 · Seleção da Viatura e Proprietário
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Viatura para Check-in *</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateDisplay} — {v.make} {v.model} ({v.generationYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Proprietário / Contacto</label>
                <div className="h-10 px-3.5 rounded-[10px] bg-[#080a0b] border border-white/[0.04] flex items-center justify-between text-sm text-[#f1ede5]">
                  <span className="truncate">{selectedCustomer.name}</span>
                  <span className="text-[11px] text-[#8a9092]">
                    {selectedCustomer.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Presentation Highlight */}
            <div className="p-4 rounded-[14px] bg-[#15191a] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#080a0b] text-[#d3a548] font-mono font-bold">
                  <Car className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#f1ede5]">
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.generationYear})
                  </span>
                  <span className="text-xs text-[#a9adae]">
                    Cor original: {selectedVehicle.originalColorName} · VIN: {selectedVehicle.vin}
                  </span>
                </div>
              </div>

              <Badge variant="gold" className="text-xs">
                Pronto para Receção
              </Badge>
            </div>
          </Card>
        )}

        {/* Step 2: Odometer, Fuel & Belongings */}
        {currentStep === 2 && (
          <Card className="p-6 flex flex-col gap-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 2 · Odómetro, Combustível & Pertences a Bordo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Quilometragem (Odómetro) *</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(parseInt(e.target.value) || 0)}
                  placeholder="ex: 45200"
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Nível de Combustível</label>
                <select
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value as FuelLevel)}
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  <option value="full">100% (Cheio)</option>
                  <option value="three_quarters">3/4 Depósito</option>
                  <option value="half">1/2 Depósito</option>
                  <option value="quarter">1/4 Depósito</option>
                  <option value="empty">Reserva</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Estado de Limpeza da Pintura</label>
                <select
                  value={cleanlinessStatus}
                  onChange={(e) =>
                    setCleanlinessStatus(
                      e.target.value as "clean" | "dusty" | "dirty" | "needs_decontamination"
                    )
                  }
                  className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  <option value="clean">Limpa (Pronta para inspeção)</option>
                  <option value="dusty">Poeira Ligeira</option>
                  <option value="dirty">Suja (Necessita lavagem antes)</option>
                  <option value="needs_decontamination">Requer Descontaminação</option>
                </select>
              </div>
            </div>

            {/* Belongings checklist */}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.04]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
                Pertences & Itens a Bordo:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {belongings.map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleBelonging(item.id)}
                    className={`flex items-center justify-between p-3 rounded-[10px] border transition-colors cursor-pointer select-none ${
                      item.isPresent
                        ? "bg-[#141b17] border-[#68a46b]/40 text-[#f1ede5]"
                        : "bg-[#15191a]/40 border-white/[0.03] text-[#8a9092]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          item.isPresent
                            ? "bg-[#68a46b] border-[#68a46b] text-[#050606]"
                            : "border-white/20 bg-[#080a0b]"
                        }`}
                      >
                        {item.isPresent && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium">{item.itemName}</span>
                    </div>
                    {item.notes && (
                      <span className="text-[11px] text-[#8a9092] truncate max-w-[140px]">
                        {item.notes}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Interactive 2D Damage Mapper */}
        {currentStep === 3 && (
          <Card className="p-6 flex flex-col gap-4">
            <VehicleDamageMapper
              damages={damages}
              onChangeDamages={setDamages}
              isReadOnly={false}
            />
          </Card>
        )}

        {/* Step 4: Photo Inspection Grid & Roof Validator */}
        {currentStep === 4 && (
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
                Passo 4 · Galeria Fotográfica de Inspeção
              </span>
              <span className="text-xs text-[#8a9092]">
                {photos.length} fotografias registadas
              </span>
            </div>

            <PhotoInspectionGrid
              photos={photos}
              onChangePhotos={setPhotos}
              isReadOnly={false}
            />
          </Card>
        )}

        {/* Step 5: Summary, Terms & Digital Signature */}
        {currentStep === 5 && (
          <Card className="p-6 flex flex-col gap-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 5 · Resumo da Receção & Assinatura Digital
            </span>

            {/* Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[14px] bg-[#15191a] border border-white/[0.04] text-xs">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#8a9092]">Viatura</span>
                <span className="font-bold text-[#f1ede5]">
                  {selectedVehicle.plateDisplay} — {selectedVehicle.make} {selectedVehicle.model}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#8a9092]">Quilómetros / Danos</span>
                <span className="font-bold text-[#f1ede5]">
                  {mileage.toLocaleString("pt-PT")} km · {damages.length} danos assinalados
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#8a9092]">Inspeção de Tejadilho</span>
                <span className="font-bold text-[#68a46b] flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Validada com Foto
                </span>
              </div>
            </div>

            {/* Signer input */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-[#a9adae]">Nome de Quem Entrega a Viatura *</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                required
              />
            </div>

            {/* Signature Pad */}
            <SignaturePad
              signerName={signerName}
              onSaveSignature={setSignatureDataUrl}
            />

            <div className="p-3.5 rounded-[12px] bg-[#101314] border border-white/[0.04] text-[12px] text-[#8a9092] leading-relaxed">
              Ao assinar este documento, o cliente e o técnico confirmam o estado físico da viatura, o registo de danos pré-existentes mapeados e autorizam o início dos trabalhos na oficina X-Motion.
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4" />
              <span>Passo Anterior</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button variant="primary" onClick={handleNextStep}>
              <span>Avançar para Passo {currentStep + 1}</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinalizeCheckin}
              className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-extrabold"
            >
              <Check className="h-5 w-5" />
              <span>Concluir Check-in e Iniciar Ordem de Trabalho</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
