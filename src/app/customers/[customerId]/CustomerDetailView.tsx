"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  User,
  Car,
  FileText,
  Plus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleCard } from "@/components/xflow/vehicles/VehicleCard";
import { VehicleFormModal } from "@/components/xflow/vehicles/VehicleFormModal";
import { formatCurrency } from "@/lib/formatting";
import { Vehicle } from "@/domains/vehicles/types";
import { Customer } from "@/domains/crm/types";
import { createVehicleAction } from "@/app/actions/vehicles";

interface CustomerDetailViewProps {
  customer: Customer;
  vehicles: Vehicle[];
  customers: Customer[];
}

export function CustomerDetailView({ customer, vehicles: initialVehicles, customers }: CustomerDetailViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [activeTab, setActiveTab] = useState<"overview" | "vehicles" | "communications">("vehicles");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const customerVehicles = vehicles.filter(
    (v) => v.currentOwner?.customerId === customer.id
  );

  const handleSaveVehicle = async (newVehicle: Partial<Vehicle>) => {
    const result = await createVehicleAction({ ...newVehicle, customerId: customer.id });
    if (result.ok) {
      setVehicles([result.vehicle, ...vehicles]);
    } else {
      console.error("Falha ao criar viatura:", result.error);
    }
  };

  const isBusiness = customer.type === "business";

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Clientes</span>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#15191a] border border-white/[0.1] text-[#d3a548]">
            {isBusiness ? (
              <Building2 className="h-7 w-7 stroke-[1.75]" />
            ) : (
              <User className="h-7 w-7 stroke-[1.75]" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-[#f1ede5] tracking-tight">
                {customer.name}
              </h1>
              <Badge variant={isBusiness ? "gold" : "outline"} className="text-xs uppercase">
                {isBusiness ? "Empresa B2B" : "Particular"}
              </Badge>
              <Badge variant={customer.status === "active" ? "success" : "in_progress"} className="text-xs">
                {customer.status === "active" ? "Cliente Ativo" : "Lead"}
              </Badge>
            </div>
            {customer.legalName && (
              <span className="text-xs text-[#8a9092] mt-0.5">
                {customer.legalName} {customer.nif ? `· NIF: ${customer.nif}` : ""}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#a9adae]">
              <a href={`tel:${customer.phoneNormalized}`} className="flex items-center gap-1.5 hover:text-[#f1ede5]">
                <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
                <span>{customer.phone}</span>
              </a>
              <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-[#f1ede5]">
                <Mail className="h-3.5 w-3.5 text-[#d3a548]" />
                <span>{customer.email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Financial Summary & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end pr-4 border-r border-white/[0.08]">
            <span className="text-[11px] uppercase text-[#8a9092] font-semibold">Total Faturado</span>
            <span className="text-xl font-bold text-[#f7d46d] tabular-nums">
              {formatCurrency(customer.totalSpent || 0)}
            </span>
          </div>
          <Button variant="primary" onClick={() => setIsVehicleModalOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            <span>Associar Viatura</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "vehicles"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <Car className="h-4 w-4" />
          <span>Viaturas ({customerVehicles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Visão Geral & Dados</span>
        </button>
        <button
          onClick={() => setActiveTab("communications")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "communications"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comunicações</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "vehicles" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#f1ede5]">
              Viaturas Associadas a {customer.name}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVehicleModalOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-[#d3a548]" />
              <span>Nova Viatura</span>
            </Button>
          </div>

          {customerVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
              <Car className="h-10 w-10 text-[#8a9092] mb-2" />
              <span className="text-sm font-medium text-[#f1ede5]">
                Nenhuma viatura associada a este cliente.
              </span>
              <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
                Podes registar a primeira viatura para criar automaticamente o seu Passaporte Digital.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setIsVehicleModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Registar Viatura</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notes Card */}
          <Card className="p-5 flex flex-col gap-3">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Notas Internas da Oficina</CardTitle>
            </CardHeader>
            <p className="text-xs text-[#f1ede5] leading-relaxed">
              {customer.notes || "Sem notas registadas para este cliente."}
            </p>
          </Card>

          {/* B2B Terms Card if applicable */}
          {customer.b2bDetails && (
            <Card className="p-5 flex flex-col gap-3 bg-[#15191a]">
              <CardHeader className="p-0">
                <CardTitle className="text-sm text-[#f7d46d]">Condições Comerciais B2B</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-[#8a9092]">Desconto Negociado</span>
                  <span className="text-base font-bold text-[#f1ede5]">
                    {customer.b2bDetails.discountRate}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#8a9092]">Prazo de Pagamento</span>
                  <span className="text-base font-bold text-[#f1ede5]">
                    {customer.b2bDetails.paymentTermsDays} Dias
                  </span>
                </div>
              </div>
              {customer.b2bDetails.commercialNotes && (
                <p className="text-xs text-[#a9adae] mt-1">
                  {customer.b2bDetails.commercialNotes}
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === "communications" && (
        <div className="flex flex-col gap-3">
          {customer.communications && customer.communications.length > 0 ? (
            customer.communications.map((com) => (
              <div
                key={com.id}
                className="flex items-start gap-3 p-4 rounded-[12px] bg-[#101314] border border-white/[0.06] text-xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15191a] text-[#d3a548]">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#f1ede5] capitalize">{com.type} ({com.direction})</span>
                    <span className="text-[12px] text-[#8a9092]">{com.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-[#a9adae] mt-1">{com.summary}</p>
                  <span className="text-[11px] text-[#8a9092] mt-1">Por: {com.authorName}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-lg bg-[#101314] text-center text-xs text-[#8a9092]">
              Sem histórico de comunicações registado.
            </div>
          )}
        </div>
      )}

      {/* Vehicle Form Modal */}
      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        customers={customers}
        initialCustomerId={customer.id}
      />
    </div>
  );
}
