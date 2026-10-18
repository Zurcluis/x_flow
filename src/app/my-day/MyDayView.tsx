"use client";

import React from "react";
import Link from "next/link";
import { Camera, ExternalLink, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import type { MyDayData } from "@/server/myday";

interface MyDayViewProps {
  data: MyDayData;
}

export function MyDayView({ data }: MyDayViewProps) {
  const task = data.activeTask;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full pb-24 selection:bg-[#d3a548]/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-[#d3a548]/20 border border-[#d3a548]/40 flex items-center justify-center text-sm font-bold text-[#f7d46d]">
            {data.technicianName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              O Meu Dia · {data.technicianName}
            </h1>
            <span className="text-xs text-[#a9adae]">
              Tarefas e marcações atribuídas a ti
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className={
            task
              ? "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30 text-xs px-3 py-1 font-mono"
              : "bg-[#15191a] text-[#a9adae] border-white/10 text-xs px-3 py-1 font-mono"
          }
        >
          {task ? "Tarefa ativa" : "Sem tarefa ativa"}
        </Badge>
      </div>

      {task ? (
        <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#1b2021] via-[#101314] to-[#080a0b] border-2 border-[#d3a548]/40 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className="bg-[#d3a548]/20 text-[#f7d46d] border-[#d3a548]/40 text-xs font-bold"
                >
                  Trabalho em curso
                </Badge>
                {task.bayName && (
                  <span className="text-xs text-[#8a9092]">{task.bayName}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#f1ede5]">{task.vehicleModel}</h2>
              <span className="font-mono text-xs font-bold text-[#d3a548]">
                {task.plate} · Ordem {task.workOrderNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {task.checkinToken && (
                <Link
                  href={`/checkins/report/${task.checkinToken}`}
                  className={buttonStyles({
                    variant: "outline",
                    size: "sm",
                    className:
                      "bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]",
                  })}
                >
                  <Camera className="h-4 w-4 text-[#d3a548]" />
                  <span>Ver danos do check-in</span>
                </Link>
              )}
              <Link
                href={`/production/${task.workOrderId}`}
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Abrir produção</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-md bg-[#101314] border border-white/[0.06] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[12px] text-[#8a9092] uppercase font-bold tracking-wider block mb-1">
                  Fase {task.currentPhaseIndex || 1}/{task.totalPhases}
                  {task.currentPhaseName ? ` · ${task.currentPhaseName}` : ""}
                </span>
                <span className="text-sm font-bold text-[#f1ede5] block">
                  {task.serviceTitle}
                </span>
                {task.materialName && (
                  <span className="text-xs text-[#a9adae] mt-0.5 block">
                    Material: {task.materialName}
                    {task.batchNumber ? ` (Lote: ${task.batchNumber})` : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[11px] text-[#8a9092] uppercase font-bold">
                  Tempo registado
                </span>
                <span className="font-mono text-2xl font-bold text-[#f7d46d] tracking-wider">
                  {task.actualHours.toFixed(1)} h
                </span>
                <span className="text-[11px] text-[#68a46b]">
                  Estimado: {task.estimatedHours.toFixed(1)} h
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#8a9092]">
                <span>Progresso da ordem</span>
                <span className="font-mono">{task.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d3a548] to-[#f7d46d]"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#8a9092]">
            O registo de tempo e a conclusão de fases são feitos na página de produção da ordem.
          </p>
        </div>
      ) : (
        <div className="p-8 rounded-[20px] bg-[#101314] border border-white/[0.08] text-center">
          <p className="text-sm text-[#a9adae]">
            Sem tarefas ativas atribuídas. As ordens de trabalho atribuídas aparecem aqui.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase font-bold tracking-wider text-[#8a9092]">
          Marcações de Hoje
        </span>

        {data.upcoming.length === 0 ? (
          <Card className="p-4 bg-[#101314] border-white/[0.08]">
            <span className="text-xs text-[#8a9092]">Sem marcações para hoje.</span>
          </Card>
        ) : (
          data.upcoming.map((appointment) => (
            <Card
              key={appointment.id}
              className="p-4 bg-[#101314] border-white/[0.08] flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-sm bg-[#15191a] flex items-center justify-center text-[#d3a548]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#f1ede5] block">
                    {appointment.vehicleModel} ({appointment.plate})
                  </span>
                  <span className="text-xs text-[#a9adae]">
                    {appointment.bayName} · {appointment.status}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-[#a9adae]">
                {appointment.time} ({appointment.estimatedHours} h)
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
