import React from "react";
import { Invoice } from "@/domains/finance/types";
import { formatCurrency } from "@/lib/formatting";
import { Logo } from "@/components/xflow/Logo";
import { Badge } from "@/components/ui/badge";

interface InvoiceSummaryCardProps {
  invoice: Invoice;
}

export function InvoiceSummaryCard({ invoice }: InvoiceSummaryCardProps) {
  return (
    <div className="flex flex-col gap-6 p-8 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-2xl text-xs text-[#f1ede5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex flex-col gap-1">
          <Logo variant="full" />
          <span className="text-[12px] text-[#8a9092] mt-2">
            X-Motion Performance Detailing, Unipessoal Lda. · NIF: PT514998877
          </span>
          <span className="text-[12px] text-[#8a9092]">
            Zona Industrial de Barcelos, Lote 14 · Barcelos, Portugal
          </span>
        </div>

        <div className="flex flex-col sm:items-end">
          <Badge variant="success" className="text-xs self-start sm:self-auto mb-2">
            Fatura Liquidada
          </Badge>
          <span className="font-mono font-black text-xl text-[#f7d46d]">
            {invoice.invoiceNumber}
          </span>
          <span className="text-[12px] text-[#a9adae]">
            Data de Emissão: {invoice.issuedAt}
          </span>
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-[14px] bg-[#0c0f10] border border-white/[0.04]">
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
              : invoice.paymentMethod}
          </span>
          <span className="text-[11px] text-[#68a46b]">
            Liquidado a {invoice.paidAt || invoice.issuedAt}
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
