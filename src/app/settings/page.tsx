"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Building,
  ShieldCheck,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  // Financial parameters
  const [hourlyRate, setHourlyRate] = useState("33.00");
  const [vatRate, setVatRate] = useState("23.00");
  const [minMargin, setMinMargin] = useState("55.00");

  // Workshop identity
  const [companyName, setCompanyName] = useState("X-Motion Performance Detailing, Unipessoal Lda.");
  const [nif, setNif] = useState("PT514998877");
  const [address, setAddress] = useState("Zona Industrial de Barcelos, Lote 14, Barcelos, Portugal");
  const [email, setEmail] = useState("geral@x-motion.pt");

  // Operational rules
  const [roofMandatory, setRoofMandatory] = useState(true);
  const [qcGateMandatory, setQcGateMandatory] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Configurações da Oficina
          </h1>
          <p className="text-xs text-[#a9adae]">
            Parâmetros fiscais, custo horário de referência, regras operacionais e dados institucionais.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-bold"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saved ? "Configurações Guardadas!" : "Guardar Alterações"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Financial and Cost Parameters */}
        <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <DollarSign className="h-5 w-5 text-[#d3a548]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Parâmetros Financeiros & Mão de Obra
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Custo/Hora Base (€)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
              />
              <span className="text-[11px] text-[#8a9092]">Valor de referência X-Flow</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Taxa de IVA (%)</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
              />
              <span className="text-[11px] text-[#8a9092]">IVA Normal Portugal</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Margem Alvo (%)</label>
              <input
                type="number"
                value={minMargin}
                onChange={(e) => setMinMargin(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
              />
              <span className="text-[11px] text-[#8a9092]">Margem mínima em orçamentos</span>
            </div>
          </div>
        </Card>

        {/* Section 2: Operational Quality Rules */}
        <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <ShieldCheck className="h-5 w-5 text-[#68a46b]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Regras Operacionais Inegociáveis
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-md bg-[#15191a] border border-white/[0.04] cursor-pointer">
              <div className="flex flex-col">
                <strong className="text-[#f1ede5]">Regra do Tejadilho no Check-in</strong>
                <span className="text-[12px] text-[#a9adae]">
                  Bloqueia a submissão de receção se a fotografia superior do tejadilho faltar.
                </span>
              </div>
              <input
                type="checkbox"
                checked={roofMandatory}
                onChange={(e) => setRoofMandatory(e.target.checked)}
                className="h-4 w-4 accent-[#d3a548]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-[#15191a] border border-white/[0.04] cursor-pointer">
              <div className="flex flex-col">
                <strong className="text-[#f1ede5]">Gate de Qualidade (QC Pass) Obrigatório</strong>
                <span className="text-[12px] text-[#a9adae]">
                  Proíbe o levantamento e entrega ao cliente de viaturas com QC pendente ou reprovado.
                </span>
              </div>
              <input
                type="checkbox"
                checked={qcGateMandatory}
                onChange={(e) => setQcGateMandatory(e.target.checked)}
                className="h-4 w-4 accent-[#d3a548]"
              />
            </label>
          </div>
        </Card>

        {/* Section 3: Workshop Legal Identity */}
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <Building className="h-5 w-5 text-[#d3a548]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Identidade Institucional da Empresa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Designação Social</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">NIF / Número de Contribuinte</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Morada Fiscal & Oficina</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#a9adae] font-semibold">Email Geral</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
