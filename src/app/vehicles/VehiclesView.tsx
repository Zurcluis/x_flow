"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/xflow/vehicles/VehicleCard";
import {
  VehicleFormModal,
  VehicleSaveResult,
} from "@/components/xflow/vehicles/VehicleFormModal";
import { createVehicleAction } from "@/app/actions/vehicles";
import { isObjectBodyType, Vehicle } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import { normalizePlate } from "@/domains/vehicles/plate-normalizer";

interface VehiclesViewProps {
  initialVehicles: Vehicle[];
  customers: Customer[];
  coverPhotos: Record<string, string>;
}

const FILTER_TABS: Array<{ key: string; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "coupe", label: "Coupés" },
  { key: "suv", label: "SUVs" },
  { key: "sedan", label: "Sedans" },
  { key: "wagon", label: "Carrinhas" },
  { key: "motorcycle", label: "Motas" },
  { key: "boat_heavy", label: "Barcos / Pesados" },
  { key: "object", label: "Objetos / Peças" },
];

export function VehiclesView({ initialVehicles, customers, coverPhotos }: VehiclesViewProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [lastSynced, setLastSynced] = useState(initialVehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  if (lastSynced !== initialVehicles) {
    setLastSynced(initialVehicles);
    setVehicles(initialVehicles);
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (selectedBodyType !== "all") {
      if (selectedBodyType === "object") {
        if (vehicle.itemType !== "object" && !isObjectBodyType(vehicle.bodyType)) {
          return false;
        }
      } else if (selectedBodyType === "boat_heavy") {
        if (!["boat", "motorhome", "truck", "van"].includes(vehicle.bodyType)) {
          return false;
        }
      } else if (vehicle.bodyType !== selectedBodyType) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const normQ = normalizePlate(searchQuery);

      const matchPlateDisplay = vehicle.plateDisplay.toLowerCase().includes(q);
      const matchPlateNorm = normQ.length > 0 && vehicle.plateNormalized.includes(normQ);
      const matchMake = vehicle.make.toLowerCase().includes(q);
      const matchModel = vehicle.model.toLowerCase().includes(q);
      const matchVin = vehicle.vin?.toLowerCase().includes(q);
      const matchOwner = vehicle.currentOwner?.customerName.toLowerCase().includes(q);

      return (
        matchPlateDisplay ||
        matchPlateNorm ||
        matchMake ||
        matchModel ||
        matchVin ||
        matchOwner
      );
    }

    return true;
  });

  const handleSaveVehicle = async (
    newVehicle: Partial<Vehicle> & { customerId?: string }
  ): Promise<VehicleSaveResult> => {
    setFeedback(null);
    const result = await createVehicleAction(newVehicle);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setVehicles((prev) => [result.vehicle, ...prev]);
    const label = result.vehicle.plateDisplay
      ? `Viatura ${result.vehicle.plateDisplay}`
      : `${result.vehicle.make} ${result.vehicle.model}`;
    setFeedback({
      tone: "success",
      message: `${label} registado com sucesso.`,
    });
    router.refresh();
    return { ok: true };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">Passaportes Digitais</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Viaturas & Itens da Oficina
          </h1>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Nova Viatura / Item</span>
        </Button>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedback.tone === "error"
              ? "border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f8a19b]"
              : "border-[#68a46b]/30 bg-[#68a46b]/10 text-[#9ed3a0]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por matrícula, referência, marca, modelo, VIN ou dono..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedBodyType(tab.key)}
              aria-pressed={selectedBodyType === tab.key}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedBodyType === tab.key
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              {tab.key === "all" ? `Todas (${vehicles.length})` : tab.label}
            </button>
          ))}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Car className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">Ainda não há viaturas</h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Regista a primeira viatura ou objeto para começar o passaporte digital e o histórico de intervenções.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            <span>Registar Viatura / Item</span>
          </Button>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverPhotos[vehicle.id]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Car className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            Nenhuma viatura ou item encontrado
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Não encontramos viaturas ou objetos correspondentes aos termos ou filtros selecionados.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedBodyType("all");
            }}
            className="mt-4"
          >
            Limpar Pesquisa
          </Button>
        </div>
      )}

      <VehicleFormModal
        key={isModalOpen ? "vehicle-open" : "vehicle-closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVehicle}
        customers={customers}
      />
    </div>
  );
}
