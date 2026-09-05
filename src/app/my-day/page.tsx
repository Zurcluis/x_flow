"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  CheckCircle2,
  Camera,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MyDayPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [seconds, setSeconds] = useState(7420); // ~2h 03m elapsed
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !completed) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, completed]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full pb-24 selection:bg-[#d3a548]/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-[#d3a548]/20 border border-[#d3a548]/40 flex items-center justify-center text-sm font-bold text-[#f7d46d]">
            JM
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              O Meu Dia — João Martins
            </h1>
            <span className="text-xs text-[#a9adae]">
              Instalador Master Certificado Stek / 3M
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30 text-xs px-3 py-1 font-mono"
        >
          ● Em Turno Ativo
        </Badge>
      </div>

      {/* Dominant Active Task Card */}
      <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#1b2021] via-[#101314] to-[#080a0b] border-2 border-[#d3a548]/40 shadow-2xl flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className="bg-[#d3a548]/20 text-[#f7d46d] border-[#d3a548]/40 text-xs font-bold"
              >
                Trabalho Atual em Curso
              </Badge>
              <span className="text-xs text-[#8a9092]">Baia 1 (Sala Limpa)</span>
            </div>
            <h2 className="text-2xl font-bold text-[#f1ede5]">
              BMW M4 Competition Coupe
            </h2>
            <span className="font-mono text-xs font-bold text-[#d3a548]">
              44-TX-88 • Ordem OT-2026-001
            </span>
          </div>

          <Link href="/checkins/report/tok-bmw-m4-2026">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs bg-[#15191a] border-white/[0.08] hover:border-[#d3a548] text-[#f1ede5]"
            >
              <Camera className="h-4 w-4 mr-1.5 text-[#d3a548]" />
              <span>Ver Danos Check-in</span>
            </Button>
          </Link>
        </div>

        {/* Task Details */}
        <div className="p-4 rounded-[14px] bg-[#101314] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[12px] text-[#8a9092] uppercase font-bold tracking-wider block mb-1">
              Fase 5/8 — Aplicação Técnica
            </span>
            <span className="text-sm font-bold text-[#f1ede5] block">
              Capô do Motor, Para-choques & Tejadilho Carbono
            </span>
            <span className="text-xs text-[#a9adae] mt-0.5 block">
              Material: Stek DYNOshield Gloss (Lote: STEK-DS-2026-04)
            </span>
          </div>

          {/* Stopwatch Display */}
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-[11px] text-[#8a9092] uppercase font-bold">
              Tempo Ativo
            </span>
            <span className="font-mono text-3xl font-bold text-[#f7d46d] tracking-wider">
              {formatTimer(seconds)}
            </span>
            <span className="text-[11px] text-[#68a46b]">Meta: 03:00:00</span>
          </div>
        </div>

        {/* Big Touch Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {completed ? (
            <div className="col-span-2 p-4 rounded-[12px] bg-[#68a46b]/20 border border-[#68a46b]/40 text-center text-sm font-bold text-[#68a46b] flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Tarefa Concluída e Enviada para Controlo de Qualidade (QC)!</span>
            </div>
          ) : (
            <>
              {isRunning ? (
                <Button
                  variant="outline"
                  onClick={() => setIsRunning(false)}
                  className="h-14 rounded-[14px] bg-[#15191a] border-white/10 hover:border-[#f05a50] text-sm font-bold text-[#f1ede5] cursor-pointer"
                >
                  <Pause className="h-5 w-5 mr-2 text-[#f05a50]" />
                  <span>Pausar Cronómetro</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsRunning(true)}
                  className="h-14 rounded-[14px] bg-[#15191a] border-white/10 hover:border-[#68a46b] text-sm font-bold text-[#68a46b] cursor-pointer"
                >
                  <Play className="h-5 w-5 mr-2" />
                  <span>Retomar Aplicação</span>
                </Button>
              )}

              <Button
                variant="primary"
                onClick={() => {
                  setIsRunning(false);
                  setCompleted(true);
                }}
                className="h-14 rounded-[14px] bg-[#d3a548] text-[#050606] text-sm font-bold shadow-lg hover:bg-[#e7c77c] cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span>Concluir & Enviar para QC</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Next Tasks of the Day */}
      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase font-bold tracking-wider text-[#8a9092]">
          Próximas Tarefas Agendadas para Hoje
        </span>

        <Card className="p-4 bg-[#101314] border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[10px] bg-[#15191a] flex items-center justify-center text-[#d3a548]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#f1ede5] block">
                Porsche 911 Carrera 4S (99-PZ-11)
              </span>
              <span className="text-xs text-[#a9adae]">
                Fase 6 — Cura Térmica dos Bordos a 90°C (Baia 2)
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#a9adae]">16:00 (1h 30m)</span>
        </Card>

        <Card className="p-4 bg-[#101314] border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[10px] bg-[#15191a] flex items-center justify-center text-[#6e93b5]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#f1ede5] block">
                Audi RS6 Avant (12-RS-66)
              </span>
              <span className="text-xs text-[#a9adae]">
                Inspeção Pré-Entrega & Limpeza de Acabamento
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#a9adae]">17:45 (30m)</span>
        </Card>
      </div>
    </div>
  );
}
