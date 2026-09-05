"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QCInspectionGrid } from "@/components/xflow/production/QCInspectionGrid";
import { initialBMWQCInspection } from "@/lib/demo-data/production-phases-data";
import { QCInspection, QCItem } from "@/domains/production/types";
import { generateQCCertificateNumber } from "@/domains/production/qc-validator";

export default function QualityControlPage() {
  const params = useParams();
  const workOrderId = params?.workOrderId as string;

  const [inspection, setInspection] = useState<QCInspection>(initialBMWQCInspection);
  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState<string>(
    inspection.certificateNumber || generateQCCertificateNumber(inspection.vehiclePlate)
  );

  const handleApproveQC = () => {
    const certNum = generateQCCertificateNumber(inspection.vehiclePlate);
    setCertificateNumber(certNum);

    setInspection({
      ...inspection,
      status: "passed",
      certificateNumber: certNum,
      approvedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    });

    setIsApprovedModalOpen(true);
  };

  const handleUpdateItems = (updatedItems: QCItem[]) => {
    setInspection({
      ...inspection,
      items: updatedItems,
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href={`/production/${workOrderId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar à Ordem de Trabalho</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#d3a548]/15 text-[#f7d46d]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              Controlo de Qualidade Final (QC)
            </h1>
            <Badge variant="gold" className="text-xs">
              Inspeção de Entrega
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{inspection.vehiclePlate}</span>
            </div>
            <span className="font-bold text-[#f1ede5]">{inspection.vehicleModel}</span>
            <span>·</span>
            <span>Cliente: {inspection.customerName}</span>
          </div>
        </div>

        {inspection.status === "passed" && (
          <Link
            href={`/qc/certificate/${certificateNumber}`}
            target="_blank"
          >
            <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-extrabold">
              <ExternalLink className="h-4 w-4" />
              <span>Ver Certificado de Conformidade</span>
            </Button>
          </Link>
        )}
      </div>

      {/* QC Checklist & Inspection Component */}
      <QCInspectionGrid
        inspection={inspection}
        onChangeItems={handleUpdateItems}
        onApproveInspection={handleApproveQC}
      />

      {/* Success Modal on Approval */}
      {isApprovedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-[20px] bg-[#101314] border border-[#d3a548]/40 p-6 shadow-2xl text-[#f1ede5]"
            role="dialog"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#68a46b]/20 text-[#68a46b]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">Controlo de Qualidade Aprovado!</h3>
                <span className="text-xs text-[#a9adae]">Viatura 100% conforme para entrega</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 text-xs">
              <div className="p-3.5 rounded-[12px] bg-[#15191a] border border-white/[0.04] flex flex-col gap-1">
                <span className="text-[#8a9092]">Certificado de Conformidade Emitido:</span>
                <span className="font-mono font-black text-sm text-[#f7d46d]">
                  {certificateNumber}
                </span>
              </div>

              <p className="text-[#a9adae] leading-relaxed">
                O passaporte digital do veículo foi atualizado com o selo verde de aprovação QC e garantia de aplicação certificada.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  onClick={() => setIsApprovedModalOpen(false)}
                >
                  Fechar
                </Button>
                <Link href={`/qc/certificate/${certificateNumber}`} target="_blank">
                  <Button variant="primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>Abrir Certificado</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
