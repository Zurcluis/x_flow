"use client";

import React, { useState } from "react";
import { Crosshair, Trash2 } from "lucide-react";
import {
  CheckinDamage,
  CheckinPhoto,
  DamageSeverity,
  DamageType,
} from "@/domains/checkins/types";

interface PhotoDamageMapperProps {
  photos: CheckinPhoto[];
  damages: CheckinDamage[];
  onChangeDamages: (damages: CheckinDamage[]) => void;
  isReadOnly?: boolean;
}

const DAMAGE_TYPE_LABEL: Record<DamageType, string> = {
  stone_chip: "Pedrada",
  scratch: "Risco",
  dent: "Amassado",
  repainted: "Repintado",
  swirls: "Swirls",
  wear: "Desgaste",
};

const DAMAGE_SEVERITY_LABEL: Record<DamageSeverity, string> = {
  minor: "Ligeiro",
  moderate: "Moderado",
  severe: "Grave",
};

const SEVERITY_COLOR: Record<DamageSeverity, string> = {
  minor: "bg-[#68a46b]",
  moderate: "bg-[#f7d46d]",
  severe: "bg-[#f05a50]",
};

export function PhotoDamageMapper({
  photos,
  damages,
  onChangeDamages,
  isReadOnly = false,
}: PhotoDamageMapperProps) {
  const [activePhotoId, setActivePhotoId] = useState<string>(
    photos[0]?.id ?? ""
  );
  const [damageType, setDamageType] = useState<DamageType>("stone_chip");
  const [severity, setSeverity] = useState<DamageSeverity>("minor");

  const activePhoto =
    photos.find((p) => p.id === activePhotoId) ?? photos[0] ?? null;

  const handlePhotoClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || !activePhoto) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const posX = ((event.clientX - rect.left) / rect.width) * 100;
    const posY = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamage: CheckinDamage = {
      id: `dm-${Date.now()}-${Math.round(posX)}-${Math.round(posY)}`,
      posX: Math.round(posX * 100) / 100,
      posY: Math.round(posY * 100) / 100,
      bodyPart: activePhoto.label,
      type: damageType,
      severity,
      notes: "",
      photoId: activePhoto.id,
    };
    onChangeDamages([...damages, newDamage]);
  };

  const handleRemoveDamage = (id: string) => {
    onChangeDamages(damages.filter((d) => d.id !== id));
  };

  if (photos.length === 0) {
    return (
      <div className="p-6 rounded-md border border-dashed border-white/[0.12] text-center text-xs text-[#8a9092]">
        Sem fotografias. Volta ao passo anterior e regista as fotos da viatura
        para poderes marcar os danos.
      </div>
    );
  }

  const activeDamages = damages.filter(
    (d) => d.photoId === activePhoto?.id
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de tipo e gravidade (apenas em edição) */}
      {!isReadOnly && (
      <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-md bg-[#101314] border border-white/[0.08]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092] mr-1">
          Tipo:
        </span>
        {(Object.keys(DAMAGE_TYPE_LABEL) as DamageType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setDamageType(t)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              damageType === t
                ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d]"
                : "bg-[#15191a] border-white/[0.08] text-[#a9adae] hover:border-white/20"
            }`}
          >
            {DAMAGE_TYPE_LABEL[t]}
          </button>
        ))}
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092] ml-2 mr-1">
          Gravidade:
        </span>
        {(Object.keys(DAMAGE_SEVERITY_LABEL) as DamageSeverity[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              severity === s
                ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d]"
                : "bg-[#15191a] border-white/[0.08] text-[#a9adae] hover:border-white/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${SEVERITY_COLOR[s]}`}
            />
            {DAMAGE_SEVERITY_LABEL[s]}
          </button>
        ))}
      </div>
      )}

      {/* Seletor de fotografia */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePhotoId(p.id)}
            className={`relative shrink-0 w-24 h-16 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
              activePhoto?.id === p.id
                ? "border-[#d3a548]"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
            title={p.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.photoUrl}
              alt={p.label}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fotografia ativa com marcadores */}
      {activePhoto && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092] flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-[#d3a548]" />
            {activePhoto.label} — clica na foto para marcar um dano
          </span>
          <div
            onClick={handlePhotoClick}
            className={`relative w-full max-h-[420px] rounded-md overflow-hidden border border-white/[0.08] bg-[#080a0b] ${
              isReadOnly ? "" : "cursor-crosshair"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.photoUrl}
              alt={activePhoto.label}
              className="w-full max-h-[420px] object-contain"
            />
            {activeDamages.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) handleRemoveDamage(d.id);
                }}
                title={`${DAMAGE_TYPE_LABEL[d.type]} (${DAMAGE_SEVERITY_LABEL[d.severity]}) — clica para remover`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125 cursor-pointer ${SEVERITY_COLOR[d.severity]}`}
                style={{ left: `${d.posX}%`, top: `${d.posY}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de danos */}
      {damages.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
            {damages.length} {damages.length === 1 ? "dano registado" : "danos registados"}
          </span>
          {damages.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-2.5 rounded-sm bg-[#15191a] border border-white/[0.06] text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${SEVERITY_COLOR[d.severity]}`}
                />
                <span className="font-bold text-[#f1ede5]">
                  {DAMAGE_TYPE_LABEL[d.type]}
                </span>
                <span className="text-[#8a9092]">{d.bodyPart}</span>
                <span className="text-[#5a6062] uppercase text-[10px] font-bold">
                  {DAMAGE_SEVERITY_LABEL[d.severity]}
                </span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveDamage(d.id)}
                  className="p-1.5 rounded-md hover:bg-[#f05a50]/10 text-[#f05a50] cursor-pointer"
                  title="Remover dano"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
