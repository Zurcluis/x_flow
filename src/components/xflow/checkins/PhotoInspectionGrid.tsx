"use client";

import React from "react";
import {
  Camera,
  CheckCircle2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { CheckinPhoto, PhotoAngle } from "@/domains/checkins/types";
import { Badge } from "@/components/ui/badge";

interface PhotoInspectionGridProps {
  photos: CheckinPhoto[];
  onChangePhotos: (photos: CheckinPhoto[]) => void;
  isReadOnly?: boolean;
}

interface PhotoSlotDefinition {
  angle: PhotoAngle;
  label: string;
  sampleUrl: string;
}

const MANDATORY_SLOTS: PhotoSlotDefinition[] = [
  {
    angle: "front",
    label: "Frente",
    sampleUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=60",
  },
  {
    angle: "left_side",
    label: "Lateral Esquerdo",
    sampleUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=60",
  },
  {
    angle: "right_side",
    label: "Lateral Direito",
    sampleUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60",
  },
  {
    angle: "rear",
    label: "Traseira",
    sampleUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=60",
  },
  {
    angle: "roof",
    label: "Tejadilho",
    sampleUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=60",
  },
  {
    angle: "odometer",
    label: "Odómetro (Quilometragem)",
    sampleUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=60",
  },
];

export function PhotoInspectionGrid({
  photos,
  onChangePhotos,
  isReadOnly = false,
}: PhotoInspectionGridProps) {
  const registeredCount = MANDATORY_SLOTS.filter((slot) =>
    photos.some((p) => p.photoUrl && p.angle === slot.angle)
  ).length;

  const isComplete = registeredCount >= 5;

  const handleCapturePhoto = (slot: PhotoSlotDefinition) => {
    if (isReadOnly) return;

    const existingIndex = photos.findIndex((p) => p.angle === slot.angle);
    if (existingIndex >= 0) {
      const updated = [...photos];
      updated[existingIndex] = {
        ...updated[existingIndex],
        photoUrl: slot.sampleUrl,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      };
      onChangePhotos(updated);
    } else {
      const newPhoto: CheckinPhoto = {
        id: `cp-${Date.now()}-${slot.angle}`,
        photoUrl: slot.sampleUrl,
        angle: slot.angle,
        label: slot.label,
        isMandatory: true,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      };
      onChangePhotos([...photos, newPhoto]);
    }
  };

  const handleRemovePhoto = (angle: PhotoAngle) => {
    if (isReadOnly) return;
    onChangePhotos(photos.filter((p) => p.angle !== angle));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Clean Status Counter Bar */}
      <div className="flex items-center justify-between p-4 rounded-[14px] bg-[#101314] border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              isComplete
                ? "bg-[#68a46b]/20 text-[#68a46b]"
                : "bg-[#d3a548]/20 text-[#f7d46d]"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-sm text-[#f1ede5]">
              Inspeção Fotográfica da Viatura
            </span>
            <span className="text-[12px] text-[#a9adae]">
              Frente, Lateral Esquerdo, Lateral Direito, Traseira e Tejadilho
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`text-xs px-3 py-1 font-mono ${
            isComplete
              ? "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30"
              : "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30"
          }`}
        >
          {registeredCount}/{MANDATORY_SLOTS.length} Fotos
        </Badge>
      </div>

      {/* Grid of 5 standard inspection slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MANDATORY_SLOTS.map((slot) => {
          const photo = photos.find((p) => p.angle === slot.angle);
          const isUploaded = !!photo?.photoUrl;

          return (
            <div
              key={slot.angle}
              className={`relative flex flex-col justify-between p-3.5 rounded-lg border overflow-hidden transition-all ${
                isUploaded
                  ? "bg-[#101314] border-[#68a46b]/30"
                  : "bg-[#0c0f10] border-white/[0.06]"
              }`}
            >
              {/* Header: Label & Status Badge */}
              <div className="flex items-start justify-between gap-2 z-10 mb-2">
                <span className="text-xs font-bold text-[#f1ede5]">
                  {slot.label}
                </span>

                <Badge
                  variant="outline"
                  className={`text-[11px] uppercase px-1.5 py-0 ${
                    isUploaded
                      ? "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30"
                      : "bg-white/[0.05] text-[#8a9092] border-white/[0.08]"
                  }`}
                >
                  {isUploaded ? "Registada" : "Pendente"}
                </Badge>
              </div>

              {/* Photo Preview Area */}
              <div className="relative h-36 w-full rounded-[10px] overflow-hidden bg-[#080a0b] border border-white/[0.04] flex items-center justify-center">
                {isUploaded ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photoUrl}
                      alt={slot.label}
                      className="h-full w-full object-cover"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(slot.angle)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-[#050606]/80 text-[#f05a50] hover:bg-[#f05a50] hover:text-[#050606] transition-colors cursor-pointer"
                        title="Remover fotografia"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center gap-1.5">
                    <Camera className="h-7 w-7 text-[#8a9092]" />
                    <span className="text-[12px] text-[#8a9092]">
                      Nenhuma foto capturada
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!isReadOnly && (
                <div className="mt-3 pt-2 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => handleCapturePhoto(slot)}
                    className={`w-full py-2 rounded-[8px] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isUploaded
                        ? "bg-white/[0.05] text-[#a9adae] hover:bg-white/10 hover:text-[#f1ede5]"
                        : "bg-[#15191a] text-[#f1ede5] border border-white/[0.08] hover:border-[#d3a548]"
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5 text-[#d3a548]" />
                    <span>
                      {isUploaded ? "Substituir Fotografia" : "Capturar Fotografia"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
