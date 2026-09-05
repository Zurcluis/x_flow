"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FileText,
  Sparkles,
  Phone,
  Award,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";

export default function ClientPortalPage() {
  const [revisionRequested, setRevisionRequested] = useState(false);

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center p-4 sm:p-6 lg:p-8 selection:bg-[#d3a548]/30">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-white/[0.08]">
        <Logo variant="full" size="md" />
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-[#d3a548]/10 text-[#f7d46d] border-[#d3a548]/30 px-3 py-1 font-mono text-xs"
          >
            Portal do Cliente
          </Badge>
          <a
            href="tel:+351912345678"
            className="flex items-center gap-1.5 text-xs text-[#a9adae] hover:text-[#f1ede5] transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-[#d3a548]" />
            <span>+351 912 345 678</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl flex flex-col gap-6 mt-6">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#15191a] via-[#101314] to-[#080a0b] border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d3a548]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-[#68a46b]/20 text-[#68a46b] border-[#68a46b]/30 text-xs font-semibold px-2.5 py-0.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Garantia Ativa de 10 Anos
                </Badge>
                <span className="text-xs text-[#8a9092]">OT-2026-001</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f1ede5]">
                BMW M4 Competition Coupe
              </h1>
              <p className="text-sm text-[#a9adae]">
                Serviço de Proteção Integral:{" "}
                <span className="text-[#f7d46d] font-semibold">
                  Full PPF Stek DYNOshield Gloss
                </span>
              </p>
            </div>

            {/* License Plate Graphic */}
            <div className="flex items-center self-start sm:self-auto bg-[#1b2021] border-2 border-white/20 rounded-[12px] px-4 py-2 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="h-6 w-3 bg-[#004b99] rounded-[2px] flex items-center justify-center text-[11px] font-bold text-white">
                  P
                </span>
                <span className="font-mono text-xl font-bold tracking-widest text-[#f1ede5]">
                  44-TX-88
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8a9092] block mb-4">
              Estado do Processo Digital
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "1. Orçamento", status: "Concluído", done: true },
                { label: "2. Check-in & Produção", status: "Concluído", done: true },
                { label: "3. Controlo QC Scangrip", status: "10/10 Aprovado", done: true },
                { label: "4. Entregue c/ Garantia", status: "Garantia 10 Anos", done: true },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-3 rounded-[12px] bg-[#101314] border border-[#d3a548]/30"
                >
                  <span className="text-[12px] text-[#a9adae] font-medium">
                    {step.label}
                  </span>
                  <span className="text-xs font-bold text-[#f7d46d] mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#68a46b]" />
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Links & Documents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/passport/44-TX-88">
            <Card className="p-5 bg-[#101314] border-white/[0.08] hover:border-[#d3a548]/50 transition-all flex flex-col justify-between h-full group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[10px] bg-[#d3a548]/10 text-[#d3a548] flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#8a9092] group-hover:text-[#f7d46d] transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f1ede5] group-hover:text-[#f7d46d] transition-colors">
                  Passaporte Digital 360°
                </h3>
                <p className="text-xs text-[#a9adae] mt-1">
                  Linha temporal completa com os 7 marcos certificados da viatura.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/warranties/certificate/tok-war-44tx88-2026">
            <Card className="p-5 bg-[#101314] border-white/[0.08] hover:border-[#d3a548]/50 transition-all flex flex-col justify-between h-full group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[10px] bg-[#68a46b]/10 text-[#68a46b] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#8a9092] group-hover:text-[#f7d46d] transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f1ede5] group-hover:text-[#f7d46d] transition-colors">
                  Certificado de Garantia
                </h3>
                <p className="text-xs text-[#a9adae] mt-1">
                  Cobertura Stek DYNOshield 10 anos contra amarelecimento e descolagem.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/qc/certificate/QC-2026-44TX88-PASS">
            <Card className="p-5 bg-[#101314] border-white/[0.08] hover:border-[#d3a548]/50 transition-all flex flex-col justify-between h-full group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[10px] bg-[#6e93b5]/10 text-[#6e93b5] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#8a9092] group-hover:text-[#f7d46d] transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f1ede5] group-hover:text-[#f7d46d] transition-colors">
                  Certificado QC Scangrip
                </h3>
                <p className="text-xs text-[#a9adae] mt-1">
                  Inspeção ótica 10/10 a 30cm sem bolhas, estiramentos ou pó.
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Post-Care Guidelines */}
        <Card className="p-6 bg-[#101314] border-white/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#d3a548]" />
            <h2 className="text-base font-bold text-[#f1ede5]">
              Guia de Manutenção & Cuidados Pós-Aplicação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#a9adae]">
            <div className="p-4 rounded-[12px] bg-[#15191a] border border-white/[0.04]">
              <span className="font-bold text-[#f1ede5] block mb-1">
                1. Período de Cura (72h)
              </span>
              Não lavar o veículo com água pressurizada nem expor a lavagens automáticas nos primeiros 3 dias.
            </div>
            <div className="p-4 rounded-[12px] bg-[#15191a] border border-white/[0.04]">
              <span className="font-bold text-[#f1ede5] block mb-1">
                2. Lavagem Manual pH Neutro
              </span>
              Utilizar champô automóvel neutro e luva de microfibra de alta densidade.
            </div>
            <div className="p-4 rounded-[12px] bg-[#15191a] border border-white/[0.04]">
              <span className="font-bold text-[#f1ede5] block mb-1">
                3. Distância de Pressão (&gt;1,5m)
              </span>
              Manter o jato de água a mais de 1,5 metros das arestas e bordos da película.
            </div>
          </div>

          {/* Action to book 30-day revision */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#f1ede5]">
                Revisão Gratuita aos 30 Dias Incluída
              </span>
              <span className="text-[12px] text-[#8a9092]">
                Inspeção de conformidade e assentamento dos bordos na oficina.
              </span>
            </div>

            {revisionRequested ? (
              <Badge
                variant="outline"
                className="bg-[#68a46b]/20 text-[#68a46b] border-[#68a46b]/30 py-2 px-4 text-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Pedido de Revisão Registado! Entraremos em contacto.
              </Badge>
            ) : (
              <Button
                variant="primary"
                onClick={() => setRevisionRequested(true)}
                className="bg-[#d3a548] text-[#050606] font-semibold text-xs h-10 px-5"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Revisão de 30 Dias
              </Button>
            )}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-6 mt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8a9092] gap-2">
        <span>© 2026 X-Flow by X-Motion — Todos os direitos reservados.</span>
        <span>Oficina Oficial: Barcelos, Portugal</span>
      </footer>
    </div>
  );
}
