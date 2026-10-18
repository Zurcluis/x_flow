import React from "react";
import {
  Award,
  CheckCircle2,
  MinusCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Logo } from "@/components/xflow/Logo";

export interface QcCertificateItem {
  id: string;
  criterionName: string;
  category: string;
  status: "pass" | "fail" | "na";
}

export interface QcCertificatePublicData {
  certificateNumber: string;
  status: "passed" | "failed" | "in_rework";
  inspectorName: string;
  createdAt: string;
  approvedAt: string | null;
  overallNotes: string | null;
  workOrderNumber: string;
  serviceTitle: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerName: string;
  items: QcCertificateItem[];
  materialName: string | null;
  batchNumber: string | null;
  warrantyYears: number | null;
  warrantyStartsAt: string | null;
  warrantyExpiresAt: string | null;
}

function statusPresentation(status: QcCertificatePublicData["status"]) {
  if (status === "passed") {
    return {
      label: "QC Aprovado",
      description: "Certificado de conformidade técnica",
      className: "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30",
      validLabel: "CERTIFICADO DIGITAL VÁLIDO",
    };
  }
  if (status === "failed") {
    return {
      label: "QC Reprovado",
      description: "Inspeção não aprovada",
      className: "bg-[#f05a50]/15 text-[#f05a50] border-[#f05a50]/30",
      validLabel: "CERTIFICADO NÃO APROVADO",
    };
  }
  return {
    label: "Em correção",
    description: "Inspeção em correção de qualidade",
    className: "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30",
    validLabel: "CERTIFICADO PENDENTE",
  };
}

function itemPresentation(status: QcCertificateItem["status"]) {
  if (status === "pass") {
    return {
      Icon: CheckCircle2,
      className: "bg-[#68a46b]/20 text-[#68a46b]",
      label: "Aprovado",
    };
  }
  if (status === "fail") {
    return {
      Icon: XCircle,
      className: "bg-[#f05a50]/20 text-[#f05a50]",
      label: "Reprovado",
    };
  }
  return {
    Icon: MinusCircle,
    className: "bg-white/[0.06] text-[#8a9092]",
    label: "Não aplicável",
  };
}

export function QcCertificateView({
  certificate,
}: {
  certificate: QcCertificatePublicData;
}) {
  const meta = statusPresentation(certificate.status);

  return (
    <div className="print-light min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-[#a9adae]">
              Certificado Oficial de Controlo de Qualidade
            </span>
            <span className="font-mono font-black text-sm text-[#f7d46d]">
              {certificate.certificateNumber}
            </span>
          </div>
        </header>

        {/* Certificate */}
        <div className="relative p-8 rounded-[24px] bg-gradient-to-b from-[#141819] to-[#0c0f10] border-2 border-[#d3a548]/40 shadow-[0_20px_60px_rgba(211,165,72,0.15)] flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#d3a548]/20 text-[#f7d46d] shadow-md border border-[#d3a548]/40">
                <Award className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#d3a548]">
                  Certificação de Qualidade
                </span>
                <h1 className="text-2xl font-black text-[#f1ede5]">
                  Certificado de Conformidade Técnica
                </h1>
                <span className="text-xs text-[#8a9092] mt-0.5">
                  {meta.description}
                </span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-bold text-xs ${meta.className}`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{meta.label}</span>
            </div>
          </div>

          {/* Vehicle + service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-[#050606]/60 border border-white/[0.04] text-xs">
            <div className="flex flex-col">
              <span className="text-[#8a9092]">Viatura certificada</span>
              <span className="font-bold text-sm text-[#f1ede5] mt-0.5">
                {certificate.vehicleModel}
              </span>
              <span className="text-[11px] text-[#8a9092] mt-0.5">
                Cliente: {certificate.customerName}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Matrícula oficial</span>
              <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] self-start mt-0.5">
                <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                <span>{certificate.vehiclePlate}</span>
              </div>
              <span className="text-[11px] text-[#8a9092] mt-1">
                Ordem: {certificate.workOrderNumber}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Película & lote</span>
              <span className="font-bold text-[#f7d46d] mt-0.5">
                {certificate.materialName ?? "Não registado"}
              </span>
              <span className="text-[11px] font-mono text-[#a9adae]">
                Lote: {certificate.batchNumber ?? "Não registado"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[#8a9092]">Garantia</span>
              <span
                className={`font-bold mt-0.5 ${
                  certificate.warrantyYears ? "text-[#68a46b]" : "text-[#8a9092]"
                }`}
              >
                {certificate.warrantyYears
                  ? `${certificate.warrantyYears} anos`
                  : "Sem garantia registada"}
              </span>
              {certificate.warrantyExpiresAt && (
                <span className="text-[11px] text-[#a9adae] mt-0.5">
                  Até {certificate.warrantyExpiresAt}
                </span>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Pontos de inspeção registados ({certificate.items.length})
            </span>

            {certificate.items.length === 0 ? (
              <p className="text-xs text-[#8a9092]">
                Sem pontos de inspeção registados para este certificado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {certificate.items.map((item) => {
                  const itemMeta = itemPresentation(item.status);
                  const Icon = itemMeta.Icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-sm bg-[#15191a]/60 border border-white/[0.04]"
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${itemMeta.className}`}
                        aria-label={itemMeta.label}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#f1ede5] font-medium text-[12px] truncate">
                          {item.criterionName}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[#8a9092]">
                          {item.category} · {itemMeta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {certificate.overallNotes && (
            <div className="p-4 rounded-md bg-[#15191a] border border-white/[0.04] text-xs">
              <span className="text-[#8a9092]">Notas da inspeção</span>
              <p className="text-[#f1ede5] mt-1 leading-relaxed">
                {certificate.overallNotes}
              </p>
            </div>
          )}

          {/* Inspector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs text-[#a9adae]">
            <div className="flex flex-col">
              <span>Inspeção realizada por:</span>
              <strong className="text-[#f1ede5]">{certificate.inspectorName}</strong>
              <span className="text-[11px] text-[#8a9092]">
                {certificate.approvedAt
                  ? `Data de aprovação: ${certificate.approvedAt}`
                  : "Aguarda aprovação"}
              </span>
              <span className="text-[11px] text-[#8a9092]">
                Serviço: {certificate.serviceTitle}
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#15191a] border border-[#d3a548]/30 font-mono text-[12px] text-[#f7d46d] text-center">
              {meta.validLabel} · {certificate.certificateNumber}
            </div>
          </div>
        </div>

        <footer className="flex flex-col items-center justify-center gap-1 pt-6 pb-12 text-xs text-[#8a9092] text-center">
          <span>Documento público emitido pela organização responsável.</span>
          <span className="font-mono">
            Criado em {certificate.createdAt}
          </span>
        </footer>
      </div>
    </div>
  );
}
