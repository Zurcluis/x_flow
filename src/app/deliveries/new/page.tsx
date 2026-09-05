"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BelongingsChecklist } from "@/components/xflow/deliveries/BelongingsChecklist";
import { DeliverySignaturePad } from "@/components/xflow/deliveries/DeliverySignaturePad";

export default function NewDeliveryPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [belongings, setBelongings] = useState([
    {
      id: "bel-1",
      name: "Chave Principal BMW M c/ capa em pele",
      isReturned: true,
    },
    {
      id: "bel-2",
      name: "Comando de garagem AutoStand",
      isReturned: true,
    },
  ]);

  const [signerName, setSignerName] = useState("Miguel Ângelo Costa");
  const [idDocument, setIdDocument] = useState("CC 14882991-2");
  const [, setSignatureData] = useState("");
  const [notes, setNotes] = useState(
    "Viatura entregue em perfeito estado estético. Cliente inspecionou acabamento do PPF sob luz natural e validou conformidade."
  );

  const handleToggleBelonging = (id: string) => {
    setBelongings(
      belongings.map((b) => (b.id === id ? { ...b, isReturned: !b.isReturned } : b))
    );
  };

  const handleCompleteDelivery = () => {
    // Navigate to Passport
    router.push(`/passport/44-TX-88`);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Entregas</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Processo Formal de Levantamento do Veículo
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Nova Entrega ao Cliente
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {[
            { step: 1, label: "1. Viatura & QC" },
            { step: 2, label: "2. Pertences" },
            { step: 3, label: "3. Assinatura" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`px-3 py-1 rounded-[8px] border transition-all cursor-pointer ${
                currentStep === s.step
                  ? "bg-[#d3a548] text-[#050606] font-bold border-[#d3a548]"
                  : currentStep > s.step
                  ? "bg-[#142618] text-[#68a46b] border-[#68a46b]/40"
                  : "bg-[#101314] text-[#8a9092] border-white/[0.04]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Vehicle & QC Gate Verification */}
      {currentStep === 1 && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 1 · Validação de QC & Viatura Pronta para Entrega
            </span>
            <Badge variant="success" className="text-xs">
              QC 100% Aprovado
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[14px] bg-[#0c0f10] border border-white/[0.04]">
            <div className="flex flex-col gap-1">
              <span className="text-[#8a9092] text-xs">Viatura a Entregar:</span>
              <strong className="text-base text-[#f1ede5]">BMW M4 Competition Coupe</strong>
              <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] self-start mt-1">
                <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                <span>44-TX-88</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:items-end">
              <span className="text-[#8a9092] text-xs">Cliente / Entidade:</span>
              <strong className="text-base text-[#f1ede5]">AutoStand Prime Barcelos</strong>
              <span className="text-xs text-[#d3a548] font-mono">
                Certificado QC: QC-2026-44TX88-PASS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[#142618] border border-[#68a46b]/40 text-xs text-[#f1ede5]">
            <ShieldCheck className="h-5 w-5 text-[#68a46b] shrink-0" />
            <span>
              <strong>Gate de Qualidade Aprovado:</strong> Todos os 10 pontos de acabamento, remates e cura térmica foram inspecionados com lâmpada Scangrip. A viatura está apta para levantamento.
            </span>
          </div>

          <div className="flex justify-end pt-3">
            <Button variant="primary" onClick={() => setCurrentStep(2)}>
              <span>Avançar para Devolução de Pertences</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Belongings Return */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-6">
          <BelongingsChecklist
            belongings={belongings}
            onToggleBelonging={handleToggleBelonging}
          />

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(3)}>
              <span>Avançar para Assinatura de Levantamento</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Signature & Finish */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-6">
          <DeliverySignaturePad
            signerName={signerName}
            idDocument={idDocument}
            onChangeSignerName={setSignerName}
            onChangeIdDocument={setIdDocument}
            onSaveSignature={setSignatureData}
          />

          <div className="flex flex-col gap-1.5 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
            <label className="font-semibold text-[#a9adae]">Notas Finais de Entrega</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="p-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteDelivery}
              className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-black"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Concluir Entrega e Ativar Passaporte Digital</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
