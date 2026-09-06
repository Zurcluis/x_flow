"use client";

import React, { useState, useRef } from "react";
import {
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { CheckinDamage, DamageSeverity, DamageType } from "@/domains/checkins/types";
import { Button } from "@/components/ui/button";

interface VehicleDamageMapperProps {
  damages: CheckinDamage[];
  onChangeDamages: (damages: CheckinDamage[]) => void;
  isReadOnly?: boolean;
}

export function VehicleDamageMapper({
  damages,
  onChangeDamages,
  isReadOnly = false,
}: VehicleDamageMapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // New damage pin temporary state
  const [activeDamageModal, setActiveDamageModal] = useState<{
    posX: number;
    posY: number;
    bodyPart: string;
    type: DamageType;
    severity: DamageSeverity;
    notes: string;
  } | null>(null);

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Determine estimated body part from Y position
    let detectedPart = "Zona Central / Lateral";
    if (y < 25) detectedPart = "Frente / Para-choques / Capô";
    else if (y > 75) detectedPart = "Traseira / Mala / Para-choques";
    else if (x < 25) detectedPart = "Lateral Esquerda / Portas";
    else if (x > 75) detectedPart = "Lateral Direita / Portas";
    else detectedPart = "Tejadilho / Vidros / Habitáculo";

    setActiveDamageModal({
      posX: Math.round(x),
      posY: Math.round(y),
      bodyPart: detectedPart,
      type: "stone_chip",
      severity: "minor",
      notes: "",
    });
  };

  const handleSaveDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDamageModal) return;

    const newDamage: CheckinDamage = {
      id: `dmg-${Date.now()}`,
      posX: activeDamageModal.posX,
      posY: activeDamageModal.posY,
      bodyPart: activeDamageModal.bodyPart,
      type: activeDamageModal.type,
      severity: activeDamageModal.severity,
      notes: activeDamageModal.notes || "Dano assinalado na receção",
    };

    onChangeDamages([...damages, newDamage]);
    setActiveDamageModal(null);
  };

  const handleRemoveDamage = (id: string) => {
    onChangeDamages(damages.filter((d) => d.id !== id));
  };

  const getDamageColor = (type: DamageType) => {
    switch (type) {
      case "dent":
        return "bg-[#f05a50] border-[#f05a50] text-[#050606]";
      case "scratch":
        return "bg-[#f78e85] border-[#f05a50] text-[#050606]";
      case "stone_chip":
        return "bg-[#d3a548] border-[#d3a548] text-[#050606]";
      case "repainted":
        return "bg-[#6e93b5] border-[#6e93b5] text-[#050606]";
      default:
        return "bg-[#d3a548] border-[#d3a548] text-[#050606]";
    }
  };

  const getDamageLabel = (type: DamageType) => {
    switch (type) {
      case "stone_chip":
        return "Picada de Gravilha";
      case "scratch":
        return "Risco na Pintura";
      case "dent":
        return "Amolgadela";
      case "repainted":
        return "Repintura Anterior";
      case "swirls":
        return "Swirls / Micro-riscos";
      case "wear":
        return "Desgaste / Queimado";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive Blueprint Canvas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
            Silhueta da Viatura (Vista Superior & Painéis)
          </span>
          {!isReadOnly && (
            <span className="text-[12px] text-[#8a9092]">
              Clica na silhueta para assinalar um dano prévio
            </span>
          )}
        </div>

        <div
          ref={containerRef}
          onClick={handleDiagramClick}
          className={`relative w-full h-[340px] sm:h-[400px] rounded-[18px] bg-[#0c0f10] border border-white/[0.08] flex items-center justify-center overflow-hidden select-none ${
            isReadOnly ? "cursor-default" : "cursor-crosshair hover:border-[#d3a548]/40"
          }`}
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Stylized 2D Blueprint SVG Car Silhouette */}
          <svg
            viewBox="0 0 300 600"
            className="h-[90%] w-auto max-w-full opacity-70 transition-opacity hover:opacity-90 pointer-events-none"
            fill="none"
            stroke="currentColor"
          >
            {/* Outer Chassis */}
            <path
              d="M 90,60 C 90,30 210,30 210,60 L 225,120 C 235,160 235,440 225,480 L 210,540 C 210,570 90,570 90,540 L 75,480 C 65,440 65,160 75,120 Z"
              stroke="#d3a548"
              strokeWidth="2.5"
              fill="#141819"
            />
            {/* Front Bumper & Grill */}
            <path d="M 100,60 Q 150,40 200,60" stroke="#8a9092" strokeWidth="2" />
            <path d="M 110,80 Q 150,70 190,80" stroke="#8a9092" strokeWidth="1.5" />
            {/* Hood */}
            <path d="M 95,120 L 205,120" stroke="#d3a548" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 120,65 L 120,115" stroke="#8a9092" strokeWidth="1" />
            <path d="M 180,65 L 180,115" stroke="#8a9092" strokeWidth="1" />
            {/* Windshield */}
            <path
              d="M 95,130 C 105,170 195,170 205,130 Z"
              stroke="#6e93b5"
              strokeWidth="2"
              fill="#10171e"
            />
            {/* Roof Top */}
            <rect
              x="95"
              y="180"
              width="110"
              height="160"
              rx="12"
              stroke="#d3a548"
              strokeWidth="2"
              fill="#171c1e"
            />
            <text
              x="150"
              y="265"
              textAnchor="middle"
              fill="#8a9092"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="1"
            >
              TEJADILHO
            </text>
            {/* Rear Window */}
            <path
              d="M 95,350 C 105,390 195,390 205,350 Z"
              stroke="#6e93b5"
              strokeWidth="2"
              fill="#10171e"
            />
            {/* Trunk Gate */}
            <path d="M 95,430 L 205,430" stroke="#d3a548" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 100,540 Q 150,560 200,540" stroke="#8a9092" strokeWidth="2" />
            {/* Wheels */}
            <rect x="55" y="110" width="15" height="50" rx="4" fill="#202628" stroke="#8a9092" />
            <rect x="230" y="110" width="15" height="50" rx="4" fill="#202628" stroke="#8a9092" />
            <rect x="55" y="420" width="15" height="50" rx="4" fill="#202628" stroke="#8a9092" />
            <rect x="230" y="420" width="15" height="50" rx="4" fill="#202628" stroke="#8a9092" />
            {/* Mirrors */}
            <path d="M 75,145 L 60,135" stroke="#d3a548" strokeWidth="3" strokeLinecap="round" />
            <path d="M 225,145 L 240,135" stroke="#d3a548" strokeWidth="3" strokeLinecap="round" />
          </svg>

          {/* Placed Damage Markers */}
          {damages.map((dmg, idx) => (
            <div
              key={dmg.id}
              style={{ left: `${dmg.posX}%`, top: `${dmg.posY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full font-black text-[12px] shadow-lg border-2 animate-bounce-short cursor-pointer transition-transform hover:scale-125 ${getDamageColor(
                  dmg.type
                )}`}
              >
                {idx + 1}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="rounded-sm bg-[#050606] border border-white/20 p-2 text-center text-[11px] text-[#f1ede5] shadow-2xl whitespace-nowrap">
                  <span className="font-bold block text-[#f7d46d]">
                    #{idx + 1} {getDamageLabel(dmg.type)}
                  </span>
                  <span className="text-[#a9adae] block">{dmg.bodyPart}</span>
                  <span className="text-[#8a9092] block italic">{dmg.notes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recorded Damages List */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
          Danos Identificados ({damages.length})
        </span>

        {damages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {damages.map((dmg, idx) => (
              <div
                key={dmg.id}
                className="flex items-start justify-between p-3 rounded-md bg-[#101314] border border-white/[0.06] text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px] ${getDamageColor(
                      dmg.type
                    )}`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#f1ede5] truncate">
                        {getDamageLabel(dmg.type)}
                      </span>
                      <span className="text-[11px] uppercase font-semibold text-[#a9adae] bg-[#15191a] px-1.5 py-0.2 rounded">
                        {dmg.severity === "minor"
                          ? "Ligeiro"
                          : dmg.severity === "moderate"
                          ? "Moderado"
                          : "Grave"}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#d3a548] font-medium truncate">
                      {dmg.bodyPart}
                    </span>
                    <span className="text-[11px] text-[#8a9092] line-clamp-1 mt-0.5">
                      {dmg.notes}
                    </span>
                  </div>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDamage(dmg.id)}
                    className="p-1 rounded text-[#8a9092] hover:text-[#f05a50] hover:bg-[#f05a50]/10 transition-colors cursor-pointer shrink-0"
                    title="Remover Dano"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-md bg-[#101314]/50 border border-white/[0.04] text-xs text-[#8a9092] text-center">
            Nenhum dano assinalado. A viatura encontra-se sem imperfeições visíveis na receção.
          </div>
        )}
      </div>

      {/* Modal / Dialog for Adding New Damage Pin */}
      {activeDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-[20px] bg-[#101314] border border-white/[0.12] p-6 shadow-2xl text-[#f1ede5]"
            role="dialog"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#d3a548]" />
                <h3 className="font-bold text-base">Assinalar Dano Pré-existente</h3>
              </div>
              <span className="text-xs font-mono text-[#8a9092]">
                ({activeDamageModal.posX}%, {activeDamageModal.posY}%)
              </span>
            </div>

            <form onSubmit={handleSaveDamage} className="flex flex-col gap-4 mt-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Tipo de Dano *</label>
                <select
                  value={activeDamageModal.type}
                  onChange={(e) =>
                    setActiveDamageModal({
                      ...activeDamageModal,
                      type: e.target.value as DamageType,
                    })
                  }
                  className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] cursor-pointer"
                >
                  <option value="stone_chip">Picada de Gravilha (Stone Chip)</option>
                  <option value="scratch">Risco na Pintura / Verniz</option>
                  <option value="dent">Amolgadela / Toque de Estacionamento</option>
                  <option value="repainted">Repintura Anterior Detetada</option>
                  <option value="swirls">Micro-riscos Agressivos / Swirls</option>
                  <option value="wear">Desgaste de Verniz / Queimado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Peça / Zona Afetada *</label>
                <input
                  type="text"
                  value={activeDamageModal.bodyPart}
                  onChange={(e) =>
                    setActiveDamageModal({
                      ...activeDamageModal,
                      bodyPart: e.target.value,
                    })
                  }
                  className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Severidade *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["minor", "moderate", "severe"] as DamageSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() =>
                        setActiveDamageModal({
                          ...activeDamageModal,
                          severity: sev,
                        })
                      }
                      className={`py-2 rounded-sm border text-xs font-bold transition-all cursor-pointer ${
                        activeDamageModal.severity === sev
                          ? "bg-[#1f1b14] border-[#d3a548] text-[#f7d46d]"
                          : "bg-[#15191a] border-white/[0.06] text-[#a9adae]"
                      }`}
                    >
                      {sev === "minor" ? "Ligeiro" : sev === "moderate" ? "Moderado" : "Grave"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#a9adae]">Observações do Técnico</label>
                <textarea
                  rows={2}
                  value={activeDamageModal.notes}
                  onChange={(e) =>
                    setActiveDamageModal({
                      ...activeDamageModal,
                      notes: e.target.value,
                    })
                  }
                  placeholder="ex: Micro picada no canto superior esquerdo..."
                  className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setActiveDamageModal(null)}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <Check className="h-4 w-4" />
                  <span>Adicionar Marcador</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
