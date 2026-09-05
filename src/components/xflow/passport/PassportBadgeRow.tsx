import React from "react";
import { ShieldCheck, Award, CheckCircle2, Sparkles, Lock } from "lucide-react";

export function PassportBadgeRow() {
  const badges = [
    {
      icon: ShieldCheck,
      title: "Tejadilho Inspecionado",
      desc: "Foto 360° no Check-in",
      color: "from-[#1a3822] to-[#0f1f14] text-[#68a46b] border-[#68a46b]/40",
    },
    {
      icon: Award,
      title: "PPF Stek 10 Anos",
      desc: "Lote Oficial de Fábrica",
      color: "from-[#382d14] to-[#1f190a] text-[#f7d46d] border-[#d3a548]/40",
    },
    {
      icon: CheckCircle2,
      title: "QC 10/10 Pontos",
      desc: "Lâmpada Scangrip 30cm",
      color: "from-[#1a3822] to-[#0f1f14] text-[#68a46b] border-[#68a46b]/40",
    },
    {
      icon: Sparkles,
      title: "Garantia Ativa",
      desc: "Até Agosto de 2036",
      color: "from-[#382d14] to-[#1f190a] text-[#f7d46d] border-[#d3a548]/40",
    },
    {
      icon: Lock,
      title: "Passaporte Imutável",
      desc: "Registo Digital X-Flow",
      color: "from-[#1a2228] to-[#0f1418] text-[#86abcf] border-[#6e93b5]/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {badges.map((b, idx) => {
        const Icon = b.icon;
        return (
          <div
            key={idx}
            className={`flex flex-col items-center text-center p-3.5 rounded-lg bg-gradient-to-b ${b.color} border shadow-lg transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] mb-1.5">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs leading-tight text-[#f1ede5]">
              {b.title}
            </span>
            <span className="text-[11px] text-[#a9adae] mt-0.5">
              {b.desc}
            </span>
          </div>
        );
      })}
    </div>
  );
}
