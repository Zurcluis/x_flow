"use client";

import React, { useState } from "react";
import { X, Car, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle, BodyType, ColorFamily, FuelType } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import { normalizePlate, formatPlateForDisplay } from "@/domains/vehicles/plate-normalizer";

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Partial<Vehicle>) => void;
  customers: Customer[];
  initialCustomerId?: string;
}

export function VehicleFormModal({
  isOpen,
  onClose,
  onSave,
  customers,
  initialCustomerId,
}: VehicleFormModalProps) {
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [generationYear, setGenerationYear] = useState(new Date().getFullYear().toString());
  const [bodyType, setBodyType] = useState<BodyType>("coupe");
  const [colorName, setColorName] = useState("");
  const [colorFamily, setColorFamily] = useState<ColorFamily>("black");
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("gasoline");
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || (customers[0]?.id ?? ""));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setError("A matrícula é obrigatória.");
      return;
    }
    if (!make.trim() || !model.trim()) {
      setError("Indica a marca e o modelo da viatura.");
      return;
    }

    const normPlate = normalizePlate(plate);
    const displayPlate = formatPlateForDisplay(plate);
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    onSave({
      id: `veh-${Date.now()}`,
      organizationId: "org-xmotion-1",
      plateDisplay: displayPlate,
      plateNormalized: normPlate,
      vin: vin.trim() || undefined,
      make: make.trim(),
      model: model.trim(),
      generationYear: parseInt(generationYear, 10) || new Date().getFullYear(),
      bodyType,
      originalColorName: colorName.trim() || "Cor Original",
      originalColorFamily: colorFamily,
      currentMileage: mileage ? parseInt(mileage, 10) : undefined,
      fuelType,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentOwner: selectedCustomer
        ? {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerType: selectedCustomer.type,
            since: new Date().toISOString().split("T")[0],
          }
        : undefined,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          vehicleId: `veh-${Date.now()}`,
          type: "note_added",
          title: "Viatura Registada no Sistema",
          description: `Viatura criada e associada a ${selectedCustomer?.name || "Sem proprietário"}.`,
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
          authorName: "Luís Gonçalves",
          badgeText: "Registo Inicial",
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-xl rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5] my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#d3a548]" />
            <h2 id="vehicle-modal-title" className="text-lg font-bold text-[#f1ede5]">
              Nova Viatura
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#f05a50]/15 border border-[#f05a50]/30 text-xs text-[#f05a50]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Plate & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Matrícula *</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                onBlur={() => setPlate(formatPlateForDisplay(plate))}
                placeholder="ex: 00-AA-00"
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm font-mono font-bold text-[#f1ede5] uppercase tracking-wider"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Proprietário Associado *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#15191a] text-[#f1ede5]">
                    {c.name} ({c.type === "business" ? "B2B" : "Particular"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Make, Model & Year */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Marca *</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="ex: Porsche"
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Modelo *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: 911 Carrera"
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Ano</label>
              <input
                type="number"
                value={generationYear}
                onChange={(e) => setGenerationYear(e.target.value)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </div>
          </div>

          {/* Body Type & Fuel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Carroçaria</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as BodyType)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] capitalize"
              >
                <option value="coupe">Coupé</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="wagon">Carrinha (Wagon)</option>
                <option value="hatchback">Hatchback</option>
                <option value="cabrio">Cabriolet</option>
                <option value="motorcycle">Mota</option>
                <option value="van">Comercial</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] capitalize"
              >
                <option value="gasoline">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </div>
          </div>

          {/* Color Name & Color Family */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Nome da Cor Original</label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="ex: Nardo Grey"
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Família de Cor</label>
              <select
                value={colorFamily}
                onChange={(e) => setColorFamily(e.target.value as ColorFamily)}
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] capitalize"
              >
                <option value="black">Preto</option>
                <option value="white">Branco</option>
                <option value="grey">Cinzento</option>
                <option value="silver">Prateado</option>
                <option value="blue">Azul</option>
                <option value="red">Vermelho</option>
                <option value="green">Verde</option>
                <option value="yellow">Amarelo</option>
                <option value="orange">Laranja</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Mileage & VIN */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Quilometragem (km)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="ex: 15000"
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">VIN (Chassis)</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="ex: WBA..."
                className="h-10 px-3.5 rounded-[10px] bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] uppercase"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#a9adae]">Observações Iniciais</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Estado da pintura, histórico prévio ou instruções especiais..."
              className="p-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              <Check className="h-4 w-4" />
              <span>Registar Viatura</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
