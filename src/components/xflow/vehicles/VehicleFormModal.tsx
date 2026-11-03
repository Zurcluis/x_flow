"use client";

import React, { useState } from "react";
import { X, Car, Package, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Vehicle,
  BodyType,
  BODY_TYPE_LABELS,
  ColorFamily,
  FuelType,
  ItemType,
  isObjectBodyType,
} from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import {
  formatPlateForDisplay,
  isValidPlate,
  normalizePlate,
} from "@/domains/vehicles/plate-normalizer";
import {
  parseGenerationYear,
  parseMileage,
  VehicleValidationError,
} from "@/domains/vehicles/validation";

export type VehicleSaveResult = { ok: true } | { ok: false; error: string };

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    vehicle: Partial<Vehicle> & { customerId?: string; itemType?: ItemType }
  ) => Promise<VehicleSaveResult>;
  customers?: Customer[];
  initialCustomerId?: string;
  initialData?: Vehicle;
}

const ALL_BODY_TYPES: BodyType[] = [
  "coupe",
  "sedan",
  "suv",
  "wagon",
  "hatchback",
  "cabrio",
  "motorcycle",
  "van",
  "boat",
  "motorhome",
  "truck",
  "helmet",
  "part",
  "other",
];

export function VehicleFormModal({
  isOpen,
  onClose,
  onSave,
  customers = [],
  initialCustomerId,
  initialData,
}: VehicleFormModalProps) {
  const isEditing = Boolean(initialData);
  const initialItemType: ItemType =
    initialData?.itemType ??
    (initialData?.bodyType && isObjectBodyType(initialData.bodyType) ? "object" : "vehicle");

  const [itemType, setItemType] = useState<ItemType>(initialItemType);
  const [plate, setPlate] = useState(initialData?.plateDisplay ?? "");
  const [make, setMake] = useState(initialData?.make ?? "");
  const [model, setModel] = useState(initialData?.model ?? "");
  const [generationYear, setGenerationYear] = useState(
    initialData?.generationYear ? String(initialData.generationYear) : ""
  );
  const [bodyType, setBodyType] = useState<BodyType | "">(initialData?.bodyType ?? "");
  const [colorName, setColorName] = useState(initialData?.originalColorName ?? "");
  const [colorFamily, setColorFamily] = useState<ColorFamily | "">(
    initialData?.originalColorFamily ?? ""
  );
  const [vin, setVin] = useState(initialData?.vin ?? "");
  const [mileage, setMileage] = useState(
    initialData?.currentMileage !== undefined ? String(initialData.currentMileage) : ""
  );
  const [fuelType, setFuelType] = useState<FuelType | "">(initialData?.fuelType ?? "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialData?.currentOwner?.customerId ?? initialCustomerId ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isOpen) return null;

  const isPlateOptional = itemType === "object" || bodyType === "boat";
  const plateLabel =
    itemType === "object"
      ? "Referência / Identificação (opcional)"
      : bodyType === "boat"
      ? "Matrícula / Registo (opcional)"
      : "Matrícula *";

  const handleItemTypeChange = (nextType: ItemType) => {
    setItemType(nextType);
    if (nextType === "object") {
      if (!bodyType || !isObjectBodyType(bodyType)) {
        setBodyType("helmet");
      }
      if (!colorFamily) {
        setColorFamily("other");
      }
    } else if (bodyType && isObjectBodyType(bodyType)) {
      setBodyType("coupe");
    }
  };

  const handleBodyTypeChange = (nextBody: BodyType | "") => {
    setBodyType(nextBody);
    if (nextBody) {
      setItemType(isObjectBodyType(nextBody) ? "object" : "vehicle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;

    const trimmedPlate = plate.trim();
    if (!isPlateOptional) {
      if (!trimmedPlate) {
        setError("A matrícula é obrigatória.");
        return;
      }
      if (!isValidPlate(trimmedPlate)) {
        setError("A matrícula indicada não é válida.");
        return;
      }
    }

    if (!make.trim() || !model.trim()) {
      setError(
        itemType === "object"
          ? "Indica a marca/fabricante e a descrição/modelo do objeto."
          : "Indica a marca e o modelo da viatura."
      );
      return;
    }
    if (!bodyType) {
      setError("Seleciona o tipo de carroçaria ou objeto.");
      return;
    }
    const resolvedColorFamily: ColorFamily | "" =
      colorFamily || (itemType === "object" ? "other" : "");
    if (!resolvedColorFamily) {
      setError("Seleciona a família de cor.");
      return;
    }

    let year: number;
    let parsedMileage: number | undefined;
    try {
      if (itemType === "object" && !generationYear.trim()) {
        year = new Date().getFullYear();
      } else {
        year = parseGenerationYear(generationYear);
      }
      parsedMileage = parseMileage(mileage);
    } catch (e) {
      setError(e instanceof VehicleValidationError ? e.message : "Dados inválidos.");
      return;
    }

    const formattedPlate = trimmedPlate
      ? isValidPlate(trimmedPlate)
        ? formatPlateForDisplay(trimmedPlate)
        : trimmedPlate.slice(0, 50)
      : "";
    const normalizedPlate = trimmedPlate ? normalizePlate(trimmedPlate) : "";

    setPending(true);
    setError(null);
    try {
      const result = await onSave({
        itemType,
        plateDisplay: formattedPlate,
        plateNormalized: normalizedPlate,
        vin: vin.trim() || undefined,
        make: make.trim(),
        model: model.trim(),
        generationYear: year,
        bodyType,
        originalColorName: colorName.trim() || "Por identificar",
        originalColorFamily: resolvedColorFamily,
        currentMileage: parsedMileage,
        fuelType: fuelType || undefined,
        notes: notes.trim() || undefined,
        customerId: selectedCustomerId || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    } catch {
      setError("Não foi possível guardar os dados. Tenta novamente.");
    } finally {
      setPending(false);
    }
  };

  const hasCurrentOwnerInList =
    !initialData?.currentOwner ||
    customers.some((c) => c.id === initialData.currentOwner?.customerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-xl rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5] my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            {itemType === "object" ? (
              <Package className="h-5 w-5 text-[#d3a548]" />
            ) : (
              <Car className="h-5 w-5 text-[#d3a548]" />
            )}
            <h2 id="vehicle-modal-title" className="text-lg font-bold text-[#f1ede5]">
              {isEditing
                ? "Editar Passaporte Digital"
                : itemType === "object"
                ? "Novo Objeto / Peça Solta"
                : "Nova Viatura / Embarcação"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={pending}
            className="p-1.5 rounded-lg text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
          {/* Seletor Viatura vs Objeto */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-[#15191a] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleItemTypeChange("vehicle")}
              aria-pressed={itemType === "vehicle"}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                itemType === "vehicle"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>Viatura / Embarcação</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemTypeChange("object")}
              aria-pressed={itemType === "object"}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                itemType === "object"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Objeto / Peça Solta</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-sm bg-[#f05a50]/15 border border-[#f05a50]/30 text-xs text-[#f05a50]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">{plateLabel}</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                onBlur={() => {
                  if (plate.trim() && isValidPlate(plate)) {
                    setPlate(formatPlateForDisplay(plate));
                  }
                }}
                placeholder={
                  itemType === "object"
                    ? "ex: CAP-01 ou S/ Matrícula"
                    : bodyType === "boat"
                    ? "ex: PT-BAR-01 (opcional)"
                    : "ex: 00-AA-00"
                }
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm font-mono font-bold text-[#f1ede5] uppercase tracking-wider"
                required={!isPlateOptional}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Proprietário Associado</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
              >
                <option value="" className="bg-[#15191a] text-[#f1ede5]">
                  Sem proprietário
                </option>
                {!hasCurrentOwnerInList && initialData?.currentOwner && (
                  <option
                    value={initialData.currentOwner.customerId}
                    className="bg-[#15191a] text-[#f1ede5]"
                  >
                    {initialData.currentOwner.customerName} (
                    {initialData.currentOwner.customerType === "business" ? "B2B" : "Particular"})
                  </option>
                )}
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#15191a] text-[#f1ede5]">
                    {c.name} ({c.type === "business" ? "B2B" : "Particular"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">
                {itemType === "object" ? "Marca / Fabricante *" : "Marca *"}
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder={itemType === "object" ? "ex: Arai / OEM" : "ex: Porsche"}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">
                {itemType === "object" ? "Modelo / Peça *" : "Modelo *"}
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={itemType === "object" ? "ex: Capacete GP-7" : "ex: 911 Carrera"}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">
                {itemType === "object" ? "Ano (opcional)" : "Ano *"}
              </label>
              <input
                type="number"
                value={generationYear}
                onChange={(e) => setGenerationYear(e.target.value)}
                placeholder="ex: 2024"
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">
                {itemType === "object" ? "Categoria / Tipo *" : "Carroçaria *"}
              </label>
              <select
                value={bodyType}
                onChange={(e) => handleBodyTypeChange(e.target.value as BodyType | "")}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              >
                <option value="" disabled>
                  Selecionar
                </option>
                {ALL_BODY_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {BODY_TYPE_LABELS[bt]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType | "")}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] capitalize"
              >
                <option value="">Não indicado</option>
                <option value="gasoline">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Nome da Cor Original</label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="ex: Nardo Grey"
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Família de Cor *</label>
              <select
                value={colorFamily}
                onChange={(e) => setColorFamily(e.target.value as ColorFamily | "")}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] capitalize"
              >
                <option value="" disabled>
                  Selecionar
                </option>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Quilometragem (km)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="ex: 15000"
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">VIN / Nº Série</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="ex: WBA..."
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] uppercase"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#a9adae]">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Estado da pintura, histórico prévio ou instruções especiais..."
              className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" type="button" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              <Check className="h-4 w-4" />
              <span>
                {pending
                  ? "A guardar..."
                  : isEditing
                  ? "Guardar Alterações"
                  : itemType === "object"
                  ? "Registar Objeto"
                  : "Registar Viatura"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
