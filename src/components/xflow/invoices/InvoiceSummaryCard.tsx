import React from "react";
import { Invoice } from "@/domains/finance/types";
import { formatCurrency } from "@/lib/formatting";
import { Logo } from "@/components/xflow/Logo";
import { Badge } from "@/components/ui/badge";

interface InvoiceSummaryCardProps {
  invoice: Invoice;
}

const ISSUER_NAME = "Fábio Domingos da Costa Pereira, Unip., Lda";
const ISSUER_NIF = "PT518035247";
const ISSUER_ADDRESS = "Rua da Devesa Nº114, 4755-417 Barcelos, Portugal";
const ISSUER_EMAIL = "geral@x-art.pt";
const ISSUER_IBAN = "PT50.0036.0096.99100129889.26";
const ISSUER_BIC = "MPIOPTPL";

const STATUS_LABELS: Record<Invoice["paymentStatus"], { label: string; variant: "success" | "gold" | "danger" }> = {
  paid: { label: "Fatura Liquidada", variant: "success" },
  pending: { label: "Pendente de Cobrança", variant: "gold" },
  overdue: { label: "Em Incumprimento", variant: "danger" },
  cancelled: { label: "Anulada", variant: "danger" },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

export function InvoiceSummaryCard({ invoice }: InvoiceSummaryCardProps) {
  const status = STATUS_LABELS[invoice.paymentStatus];
  const isPaid = invoice.paymentStatus === "paid";

  return (
    <div className="flex flex-col gap-6 p-8 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-2xl text-xs text-[#f1ede5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex flex-col gap-1">
          <Logo variant="full" />
          <span className="text-[12px] text-[#8a9092] mt-2">
            {ISSUER_NAME} · NIF: {ISSUER_NIF}
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {ISSUER_ADDRESS} · {ISSUER_EMAIL}
          </span>
        </div>

        <div className="flex flex-col sm:items-end">
          <Badge variant={status.variant} className="text-xs self-start sm:self-auto mb-2">
            {status.label}
          </Badge>
          <span className="font-mono font-black text-xl text-[#f7d46d]">
            {invoice.invoiceNumber}
          </span>
          <span className="text-[12px] text-[#a9adae]">
            Data de Emissão: {formatDate(invoice.issuedAt)}
          </span>
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-md bg-[#0c0f10] border border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Dados do Cliente:
          </span>
          <strong className="text-sm text-[#f1ede5]">{invoice.customerName}</strong>
          <span className="text-[#a9adae] font-mono">NIF: {invoice.customerNif}</span>
          {invoice.customerAddress && (
            <span className="text-[#8a9092]">{invoice.customerAddress}</span>
          )}
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Viatura & Matrícula:
          </span>
          <strong className="text-sm text-[#f1ede5]">{invoice.vehicleModel}</strong>
          <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5] mt-1">
            <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
            <span>{invoice.vehiclePlate}</span>
          </div>
        </div>
      </div>

      {/* Invoice Lines Table */}
      <div className="flex flex-col">
        <div className="grid grid-cols-12 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a9092] border-b border-white/[0.06]">
          <span className="col-span-6">Descrição do Serviço / Material</span>
          <span className="col-span-2 text-right">Qtd</span>
          <span className="col-span-2 text-right">Preço Unit.</span>
          <span className="col-span-2 text-right">Total s/ IVA</span>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.03]">
          {invoice.lines.map((line) => (
            <div key={line.id} className="grid grid-cols-12 py-3 text-xs items-center">
              <span className="col-span-6 font-medium text-[#f1ede5] pr-2">
                {line.description}
              </span>
              <span className="col-span-2 text-right font-mono text-[#a9adae]">
                {line.quantity}
              </span>
              <span className="col-span-2 text-right font-mono text-[#a9adae]">
                {formatCurrency(line.unitPrice)}
              </span>
              <span className="col-span-2 text-right font-mono font-bold text-[#f1ede5]">
                {formatCurrency(line.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Totals */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-white/[0.08]">
        <div className="flex flex-col gap-1">
          <span className="text-[#8a9092]">Método de Pagamento:</span>
          <span className="font-bold text-[#f7d46d] uppercase">
            {invoice.paymentMethod === "bank_transfer"
              ? "Transferência Bancária Imediata"
              : invoice.paymentMethod === "mbway"
              ? "MB WAY"
              : invoice.paymentMethod === "multibanco"
              ? "Terminal Multibanco"
              : invoice.paymentMethod === "cash"
              ? "Dinheiro"
              : invoice.paymentMethod}
          </span>
          {isPaid ? (
            <span className="text-[11px] text-[#68a46b]">
              Liquidado a {formatDate(invoice.paidAt || invoice.issuedAt)}
            </span>
          ) : invoice.paymentStatus === "overdue" ? (
            <span className="text-[11px] text-[#c96a6a]">
              Vencida desde {formatDate(invoice.dueAt)} — juros de mora aplicáveis (DL 32/2003)
            </span>
          ) : (
            <span className="text-[11px] text-[#a9adae]">
              Data limite de pagamento: {formatDate(invoice.dueAt)}
            </span>
          )}
          <span className="text-[11px] text-[#8a9092] font-mono pt-1">
            IBAN: {ISSUER_IBAN} · BIC: {ISSUER_BIC}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-64">
          <div className="flex items-center justify-between text-[#a9adae]">
            <span>Incidência (Subtotal):</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-[#a9adae]">
            <span>IVA Normal ({invoice.vatRate}%):</span>
            <span className="font-mono">{formatCurrency(invoice.vatAmount)}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-base font-black text-[#f1ede5]">
            <span>Total da Fatura:</span>
            <span className="font-mono text-[#f7d46d] text-lg">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
