"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, CheckCircle2, ClipboardList, FlaskConical, Hourglass, Wrench } from "lucide-react";
import { ShopFloorData } from "@/server/shopfloor";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_COLOR: Record<string, string> = {
  Agendada: "text-[#9fc0dd]",
  "Por iniciar": "text-[#9fc0dd]",
  "Em curso": "text-[#68a46b]",
  "À espera de peças": "text-[#f7d46d]",
  "Controlo de qualidade": "text-[#c8b5ef]",
  Concluída: "text-[#68a46b]",
};

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <span className="text-5xl font-black font-mono text-[#f7d46d]">--:--</span>;
  return (
    <span className="text-5xl font-black font-mono text-[#f7d46d] tabular-nums">
      {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
      <span className="text-2xl text-[#d3a548]">
        :{String(now.getSeconds()).padStart(2, "0")}
      </span>
    </span>
  );
}

export function ShopFloorView({ data }: { data: ShopFloorData }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(t);
  }, [router]);

  const today = new Date();
  const dateLabel = `${today.getDate()} de ${MONTHS[today.getMonth()]} de ${today.getFullYear()}`;

  const kpis = [
    { icon: Car, label: "Marcações hoje", value: data.appointmentsToday, color: "text-[#9fc0dd]" },
    { icon: Wrench, label: "Em produção", value: data.workOrders.length, color: "text-[#68a46b]" },
    { icon: FlaskConical, label: "QC pendente", value: data.qcPending, color: "text-[#c8b5ef]" },
    { icon: CheckCircle2, label: "Concluídas hoje", value: data.completedToday, color: "text-[#f7d46d]" },
    { icon: Hourglass, label: "Propostas à espera", value: data.quotesAwaiting, color: "text-[#d3a548]" },
  ];

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] p-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-end justify-between pb-5 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#d3a548]">
            X-Flow · Painel da Oficina
          </span>
          <span className="text-xl text-[#a9adae] font-medium capitalize">{dateLabel}</span>
        </div>
        <Clock />
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] flex items-center gap-4"
          >
            <k.icon className={`h-9 w-9 shrink-0 ${k.color}`} />
            <div className="flex flex-col">
              <span className="text-4xl font-black font-mono tabular-nums text-[#f1ede5]">
                {k.value}
              </span>
              <span className="text-[13px] text-[#8a9092] font-semibold">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        {/* Agenda */}
        <section className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.08] flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#d3a548] flex items-center gap-2">
            <Car className="h-4 w-4" />
            Agenda de Hoje
          </h2>
          {data.appointments.length === 0 ? (
            <p className="text-lg text-[#5a6062] py-10 text-center">
              Sem marcações para hoje
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {data.appointments.map((a) => (
                <div key={a.id} className="flex items-center gap-5 py-3">
                  <span className="text-2xl font-black font-mono text-[#f7d46d] tabular-nums w-24">
                    {a.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xl font-bold text-[#f1ede5] block truncate">
                      {a.plate} — {a.vehicle}
                    </span>
                    <span className="text-sm text-[#8a9092] block truncate">
                      {a.customer} · {a.bay} · {a.technician}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${STATUS_COLOR[a.status] ?? "text-[#a9adae]"}`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Produção */}
        <section className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.08] flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#d3a548] flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Produção em Curso
          </h2>
          {data.workOrders.length === 0 ? (
            <p className="text-lg text-[#5a6062] py-10 text-center">
              Nenhuma ordem em produção
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.05] overflow-y-auto max-h-[520px]">
              {data.workOrders.map((w) => (
                <div key={w.id} className="py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xl font-bold text-[#f1ede5] truncate">
                      {w.plate} — {w.vehicle}
                    </span>
                    <span
                      className={`text-sm font-bold shrink-0 ${STATUS_COLOR[w.status] ?? "text-[#a9adae]"}`}
                    >
                      {w.status}
                    </span>
                  </div>
                  <span className="text-sm text-[#8a9092] truncate">
                    {w.number} · {w.service} · {w.technician}
                  </span>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d] transition-all duration-500"
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="text-center text-[11px] text-[#5a6062]">
        Atualiza automaticamente a cada 60 segundos
      </footer>
    </div>
  );
}
