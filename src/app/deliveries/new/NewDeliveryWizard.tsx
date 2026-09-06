"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BelongingsChecklist } from "@/components/xflow/deliveries/BelongingsChecklist";
import { DeliverySignaturePad } from "@/components/xflow/deliveries/DeliverySignaturePad";
import { createDeliveryAction } from "@/app/actions/deliveries";
import { DeliveryCandidate } from "@/server/deliveries";

interface BelongingItem {
  id: string;
  name: string;
  isReturned: boolean;
}

export function NewDeliveryWizard({ candidates }: { candidates: DeliveryCandidate[] }) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedWoId, setSelectedWoId] = useState(candidates[0].workOrderId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const candidate = useMemo(
    () => candidates.find((c) => c.workOrderId === selectedWoId) ?? candidates[0],
    [candidates, selectedWoId]
  );

  const [belongings, setBelongings] = useState<BelongingItem[]>(() =>
    candidate.belongings.length > 0
      ? candidate.belongings.map((b) => ({ id: b.id, name: b.itemName, isReturned: true }))
      : [{ id: "bel-1", name: "Chave principal", isReturned: true }]
  );

  const [signerName, setSignerName] = useState("");
  const [idDocument, setIdDocument] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [notes, setNotes] = useState("");

  const handleSelectCandidate = (woId: string) => {
    setSelectedWoId(woId);
    const next = candidates.find((c) => c.workOrderId === woId);
    setBelongings(
      next && next.belongings.length > 0
        ? next.belongings.map((b) => ({ id: b.id, name: b.itemName, isReturned: true }))
        : [{ id: "bel-1", name: "Chave principal", isReturned: true }]
    );
  };

  const handleToggleBelonging = (id: string) => {
    setBelongings(
      belongings.map((b) => (b.id === id ? { ...b, isReturned: !b.isReturned } : b))
    );
  };

  const handleCompleteDelivery = async () => {
    setError(null);
    if (!signerName.trim()) {
      setError("Indique quem levanta a viatura.");
      return;
    }
    setSubmitting(true);
    const result = await createDeliveryAction({
      workOrderId: candidate.workOrderId,
      receiverName: signerName,
      receiverIdDocument: idDocument,
      signatureDataUrl: signatureData,
      belongings: belongings.map((b) => ({ name: b.name, isReturned: b.isReturned })),
      notes,
    });
    setSubmitting(false);
    if (result.ok) {
      router.push(`/deliveries/${result.deliveryId}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      {/* Seleção da OT (passo prévio) */}
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
          Ordem de Trabalho a Entregar
        </span>
        <div className="flex flex-wrap gap-2">
          {candidates.map((c) => (
            <button
              key={c.workOrderId}
              type="button"
              onClick={() => handleSelectCandidate(c.workOrderId)}
              className={`px-3 py-2 rounded-md text-xs border transition-all cursor-pointer text-left ${
                c.workOrderId === selectedWoId
                  ? "bg-[#d3a548]/10 border-[#d3a548] text-[#f1ede5]"
                  : "bg-[#101314] border-white/[0.08] text-[#a9adae] hover:border-white/20"
              }`}
            >
              <span className="font-bold">{c.workOrderNumber}</span>
              <span className="block text-[11px] font-mono">
                {c.plateDisplay} · {c.vehicleModel}
              </span>
            </button>
          ))}
        </div>
      </Card>

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
            className={`px-3 py-1 rounded-sm border transition-all cursor-pointer ${
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

      {/* Step 1: Vehicle & QC Gate Verification */}
      {currentStep === 1 && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Passo 1 · Validação de QC & Viatura Pronta para Entrega
            </span>
            <Badge variant="success" className="text-xs">
              {candidate.qcCertificateNumber ? "QC 100% Aprovado" : "QC sem registo"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-[#0c0f10] border border-white/[0.04]">
            <div className="flex flex-col gap-1">
              <span className="text-[#8a9092] text-xs">Viatura a Entregar:</span>
              <strong className="text-base text-[#f1ede5]">{candidate.vehicleModel}</strong>
              <div className="inline-flex items-center rounded-sm border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] self-start mt-1">
                <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                <span>{candidate.plateDisplay}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:items-end">
              <span className="text-[#8a9092] text-xs">Cliente / Entidade:</span>
              <strong className="text-base text-[#f1ede5]">{candidate.customerName}</strong>
              <span className="text-xs text-[#d3a548] font-mono">
                {candidate.qcCertificateNumber ?? "QC pendente"}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-4 rounded-md border text-xs ${
              candidate.qcCertificateNumber
                ? "bg-[#142618] border-[#68a46b]/40 text-[#f1ede5]"
                : "bg-[#1d1810] border-[#d3a548]/40 text-[#f1ede5]"
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 shrink-0 ${candidate.qcCertificateNumber ? "text-[#68a46b]" : "text-[#d3a548]"}`}
            />
            <span>
              {candidate.qcCertificateNumber ? (
                <>
                  <strong>Gate de Qualidade Aprovado:</strong> A OT {candidate.workOrderNumber} (
                  {candidate.serviceTitle}) está concluída e o QC foi aprovado. A viatura está apta
                  para levantamento.
                </>
              ) : (
                <>
                  <strong>Gate de Qualidade sem registo:</strong> A OT {candidate.workOrderNumber} (
                  {candidate.serviceTitle}) está concluída mas não tem certificado QC associado.
                  Confirma a inspeção antes de assinar a entrega.
                </>
              )}
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
          <BelongingsChecklist belongings={belongings} onToggleBelonging={handleToggleBelonging} />

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

          <div className="flex flex-col gap-1.5 p-5 rounded-lg bg-[#101314] border border-white/[0.08] text-xs">
            <label className="font-semibold text-[#a9adae]">Notas Finais de Entrega</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Estado da viatura na entrega, observações do cliente..."
              className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-sm bg-[#2a1214] border border-[#f05a50]/40 text-xs text-[#f78e85]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteDelivery}
              disabled={submitting}
              className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-black"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{submitting ? "A registar entrega…" : "Concluir Entrega e Ativar Passaporte Digital"}</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
