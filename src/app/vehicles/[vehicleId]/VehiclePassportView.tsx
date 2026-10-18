"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  History,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { VehiclePassportHero } from "@/components/xflow/vehicles/VehiclePassportHero";
import { VehicleTimeline } from "@/components/xflow/vehicles/VehicleTimeline";
import { formatVehicleDateKey } from "@/domains/vehicles/presentation";
import { formatCheckinDate } from "@/domains/checkins/presentation";
import { Vehicle } from "@/domains/vehicles/types";

interface VehiclePassportViewProps {
  vehicle: Vehicle;
}

export function VehiclePassportView({ vehicle }: VehiclePassportViewProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "owners" | "notes">("timeline");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Viaturas</span>
        </Link>
      </div>

      <VehiclePassportHero vehicle={vehicle} />

      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setActiveTab("timeline")}
          aria-pressed={activeTab === "timeline"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "timeline"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Passaporte & Timeline Técnica ({vehicle.timeline?.length ?? 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("owners")}
          aria-pressed={activeTab === "owners"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "owners"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Histórico de Proprietários ({vehicle.ownerHistory?.length ?? 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          aria-pressed={activeTab === "notes"}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "notes"
              ? "border-[#d3a548] text-[#f7d46d]"
              : "border-transparent text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          <StickyNote className="h-4 w-4" />
          <span>Notas Técnicas da Oficina</span>
        </button>
      </div>

      {activeTab === "timeline" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#f1ede5]">
              Histórico Técnico Rastreável
            </h3>
            <span className="text-xs text-[#8a9092]">
              Check-ins, serviços concluídos, controlos de qualidade e garantias
            </span>
          </div>

          <VehicleTimeline events={vehicle.timeline} vehicleId={vehicle.id} />
        </div>
      )}

      {activeTab === "owners" && (
        <div className="flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">
                Rastreabilidade de Posse da Viatura
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-[#a9adae]">
              A viatura preserva o histórico técnico de intervenções, materiais e garantias mesmo
              quando muda de proprietário. Os dados pessoais de proprietários anteriores permanecem
              protegidos.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              {vehicle.ownerHistory && vehicle.ownerHistory.length > 0 ? (
                vehicle.ownerHistory.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3.5 rounded-md border ${
                      link.isCurrent
                        ? "bg-[#1f1b14] border-[#d3a548]/40 text-[#f7d46d]"
                        : "bg-[#15191a] border-white/[0.06] text-[#a9adae]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <Link
                          href={`/customers/${link.customerId}`}
                          className="font-semibold text-sm hover:underline text-[#f1ede5]"
                        >
                          {link.customerName}
                        </Link>
                        <span className="text-[11px] text-[#8a9092]">
                          Relação:{" "}
                          {link.relationshipType === "owner"
                            ? "Proprietário"
                            : link.relationshipType === "fleet_manager"
                            ? "Gestor de Frota"
                            : "Condutor"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="tabular-nums">
                        {formatVehicleDateKey(link.startedAt)}{" "}
                        {link.endedAt
                          ? `até ${formatVehicleDateKey(link.endedAt)}`
                          : "(Atual)"}
                      </span>
                      {link.isCurrent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d3a548]/20 text-[#f7d46d] border border-[#d3a548]/40">
                          Atual
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-md bg-[#15191a] text-xs text-[#f1ede5]">
                  Sem histórico de proprietários registado.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col gap-3">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Observações Técnicas</CardTitle>
            </CardHeader>
            <p className="text-xs text-[#f1ede5] leading-relaxed">
              {vehicle.notes || "Sem notas registadas para esta viatura."}
            </p>
          </Card>

          <Card className="p-5 flex flex-col gap-3 bg-[#15191a]">
            <CardHeader className="p-0">
              <CardTitle className="text-sm text-[#d3a548]">Notas da Viatura</CardTitle>
            </CardHeader>
            {vehicle.technicalNotes && vehicle.technicalNotes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {vehicle.technicalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col gap-1 rounded-md border border-white/[0.06] bg-[#101314] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#d3a548]">
                        {note.category === "technical"
                          ? "Técnica"
                          : note.category === "bodywork"
                          ? "Carroçaria"
                          : "Geral"}
                      </span>
                      <span className="text-[11px] text-[#8a9092]">
                        {formatCheckinDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#f1ede5] leading-relaxed">{note.content}</p>
                    <span className="text-[11px] text-[#8a9092]">
                      Registado por: {note.authorName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8a9092] leading-relaxed">
                Sem notas técnicas registadas para esta viatura.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
