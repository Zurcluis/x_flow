"use client";

import React, { useState } from "react";
import { Car, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/xflow/vehicles/VehicleCard";
import { VehicleFormModal } from "@/components/xflow/vehicles/VehicleFormModal";
import { initialVehiclesData } from "@/lib/demo-data/vehicles-data";
import { initialCustomersData } from "@/lib/demo-data/customers-data";
import { Vehicle } from "@/domains/vehicles/types";
import { normalizePlate } from "@/domains/vehicles/plate-normalizer";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehiclesData);
  const [customers] = useState(initialCustomersData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredVehicles = vehicles.filter((vehicle) => {
    // Body type filter
    if (selectedBodyType !== "all" && vehicle.bodyType !== selectedBodyType) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const normQ = normalizePlate(searchQuery);

      const matchPlateDisplay = vehicle.plateDisplay.toLowerCase().includes(q);
      const matchPlateNorm = vehicle.plateNormalized.includes(normQ);
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

  const handleSaveVehicle = (newVehicle: Partial<Vehicle>) => {
    setVehicles([newVehicle as Vehicle, ...vehicles]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">Passaportes Digitais</span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Viaturas da Oficina
          </h1>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Nova Viatura</span>
        </Button>
      </div>

      {/* Controls Bar: Search & Body Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por matrícula (ex: 44-TX-88), marca, modelo, VIN ou dono..."
            className="w-full h-10 pl-10 pr-4 rounded-[12px] bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        {/* Body Types Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          <button
            onClick={() => setSelectedBodyType("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "all"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Todas ({vehicles.length})
          </button>
          <button
            onClick={() => setSelectedBodyType("coupe")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "coupe"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Coupés
          </button>
          <button
            onClick={() => setSelectedBodyType("suv")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "suv"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            SUVs
          </button>
          <button
            onClick={() => setSelectedBodyType("sedan")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "sedan"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Sedans
          </button>
          <button
            onClick={() => setSelectedBodyType("wagon")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "wagon"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Carrinhas
          </button>
          <button
            onClick={() => setSelectedBodyType("motorcycle")}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedBodyType === "motorcycle"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Motos
          </button>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Car className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">
            Nenhuma viatura encontrada
          </h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Não encontramos viaturas correspondentes aos termos ou filtros selecionados.
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

      {/* Modal */}
      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVehicle}
        customers={customers}
      />
    </div>
  );
}
