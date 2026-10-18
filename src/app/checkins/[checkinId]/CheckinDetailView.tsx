"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PhotoDamageMapper } from "@/components/xflow/checkins/PhotoDamageMapper";
import { Checkin } from "@/domains/checkins/types";
import {
  checkinStatusLabel,
  cleanlinessLabel,
  formatCheckinDate,
  fuelLevelLabel,
} from "@/domains/checkins/presentation";
import { PhotoInspectionGrid } from "@/components/xflow/checkins/PhotoInspectionGrid";
import { copyTextToClipboard } from "@/lib/clipboard";

export function CheckinDetailView({ checkin }: { checkin: Checkin }) {
  const [copyFeedback, setCopyFeedback] = useState<"copied" | "failed" | null>(null);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/checkins/report/${checkin.token}`;
    const copied = await copyTextToClipboard(url);
    setCopyFeedback(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/checkins"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar a Check-ins</span>
        </Link>
      </div>

      <div aria-live="polite" className="min-h-0">
        {copyFeedback && (
          <div
            role="status"
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-md bg-[#1b2021] border text-xs font-semibold shadow-2xl animate-fade-in ${
              copyFeedback === "copied"
                ? "border-[#d3a548] text-[#f7d46d]"
                : "border-[#f05a50]/50 text-[#f78e85]"
            }`}
          >
            {copyFeedback === "copied" ? (
              <CheckCircle2 className="h-4 w-4 text-[#d3a548]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#f05a50]" />
            )}
            <span>
              {copyFeedback === "copied"
                ? "Link do relatório copiado para a área de transferência."
                : "Não foi possível copiar o link."}
            </span>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-[6px] border border-white/20 bg-[#080a0b] px-2.5 py-0.5 font-mono text-sm font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1.5 text-[11px] font-sans">P</span>
              <span>{checkin.vehiclePlate}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              {checkin.vehicleModel} ({checkin.vehicleYear})
            </h1>
            <Badge
              variant={checkin.status === "draft" ? "gold" : "success"}
              className="text-xs"
            >
              {checkinStatusLabel(checkin)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <span>Cliente: <strong className="text-[#f1ede5]">{checkin.customerName}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Técnico Responsável: <strong className="text-[#f1ede5]">{checkin.technicianName}</strong></span>
            <span aria-hidden="true">·</span>
            <time dateTime={checkin.createdAt}>{formatCheckinDate(checkin.createdAt)}</time>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="bg-[#15191a]">
            <Share2 className="h-4 w-4 text-[#d3a548]" />
            <span>Copiar Link do Relatório</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-[#15191a]"
            onClick={() =>
              window.open(
                `/checkins/report/${checkin.token}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <ExternalLink className="h-4 w-4 text-[#d3a548]" />
            <span>Ver como Cliente</span>
          </Button>

          <Link
            href="/production"
            className={buttonStyles({ variant: "primary", size: "sm" })}
          >
            <FileCheck className="h-4 w-4" />
            <span>Abrir Produção</span>
          </Link>
        </div>
      </div>

      {/* Grid: Details, Damages, Photos & Signature */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Damages Silhouette & Photos */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Damages mapped on photos */}
          <Card className="p-5 flex flex-col gap-3">
            <h2 className="text-base font-bold text-[#f1ede5]">
              Registo de Danos Pré-existentes na Receção
            </h2>
            <PhotoDamageMapper
              photos={checkin.photos}
              damages={checkin.damages}
              onChangeDamages={() => {}}
              isReadOnly={true}
            />
          </Card>

          {/* Photos Grid */}
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Galeria Fotográfica ({checkin.photos.length})
              </h2>
              {checkin.hasRoofPhoto && (
                <div className="flex items-center gap-1.5 text-xs text-[#68a46b] font-semibold bg-[#68a46b]/10 px-2.5 py-1 rounded-full border border-[#68a46b]/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Tejadilho Inspecionado e Aprovado</span>
                </div>
              )}
            </div>

            <PhotoInspectionGrid
              photos={checkin.photos}
              onChangePhotos={() => {}}
              isReadOnly={true}
            />
          </Card>
        </div>

        {/* Right Column: Reception Data, Belongings & Signature */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Odometer & Fuel */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Dados de Receção
            </span>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Quilometragem (Odómetro)</span>
                <span className="font-bold text-[#f1ede5] tabular-nums font-mono">
                  {checkin.mileage.toLocaleString("pt-PT")} km
                </span>
              </div>

              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Nível de Combustível</span>
                <span className="font-semibold text-[#f1ede5]">
                  {fuelLevelLabel(checkin.fuelLevel)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#a9adae]">
                <span>Estado de Limpeza</span>
                <span className="font-semibold text-[#f1ede5]">
                  {cleanlinessLabel(checkin.cleanlinessStatus)}
                </span>
              </div>
            </div>
          </Card>

          {/* Belongings List */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Pertences a Bordo ({checkin.belongings.filter((b) => b.isPresent).length})
            </span>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
              {checkin.belongings.length === 0 ? (
                <p className="text-xs text-[#8a9092]">
                  Não foram registados pertences neste check-in.
                </p>
              ) : (
                checkin.belongings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-sm bg-[#15191a] text-xs text-[#f1ede5]"
                  >
                    <span className="truncate">{b.itemName}</span>
                    <Badge
                      variant={b.isPresent ? "success" : "outline"}
                      className="text-[11px] shrink-0"
                    >
                      {b.isPresent ? "Presente" : "Não a bordo"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Signature Box */}
          <Card className="p-5 flex flex-col gap-3 text-xs">
            <span className="font-bold text-sm text-[#f1ede5]">
              Validação & Assinatura
            </span>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between gap-3 text-[#a9adae]">
                <span>Assinado por:</span>
                <span className="font-bold text-[#f1ede5] text-right">
                  {checkin.signedByName || "Não registado"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[#8a9092]">
                <span>Data e Hora:</span>
                <time dateTime={checkin.completedAt ?? checkin.createdAt}>
                  {formatCheckinDate(checkin.completedAt ?? checkin.createdAt)}
                </time>
              </div>

              {checkin.signatureDataUrl ? (
                <div className="mt-2 rounded-sm bg-[#0c0f10] border border-white/[0.06] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={checkin.signatureDataUrl}
                    alt={`Assinatura de ${checkin.signedByName || "receção"}`}
                    className="h-20 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mt-2 p-3 rounded-sm bg-[#0c0f10] border border-white/[0.06] text-center font-mono text-xs text-[#8a9092]">
                  Assinatura digital não recolhida
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
