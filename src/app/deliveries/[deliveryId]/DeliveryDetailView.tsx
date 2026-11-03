"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  ExternalLink,
  CreditCard,
  MessageCircle,
  Star,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BelongingsChecklist } from "@/components/xflow/deliveries/BelongingsChecklist";
import { formatCheckinDate } from "@/domains/checkins/presentation";
import { Delivery, Invoice } from "@/domains/finance/types";
import { formatCurrency } from "@/lib/formatting";
import type { DeliveryWithAftersales } from "@/server/deliveries";

interface DeliveryDetailViewProps {
  delivery: Delivery & Partial<DeliveryWithAftersales>;
  linkedInvoice?: (Pick<Invoice, "id" | "invoiceNumber"> & Partial<Invoice>) | null;
}

const subscribeToOrigin = () => () => {};

function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) {
    return `351${digits}`;
  }
  return digits;
}

export function DeliveryDetailView({
  delivery,
  linkedInvoice,
}: DeliveryDetailViewProps) {
  const appOrigin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => ""
  );

  const cleanPhone = formatWhatsAppPhone(delivery.customerPhone);
  const passportUrl = `${appOrigin}/passport/${encodeURIComponent(delivery.vehiclePlate)}`;
  const feedbackUrl = `${appOrigin}/feedback/${delivery.token}`;

  const whatsappPassportMsg = encodeURIComponent(
    `Olá ${delivery.customerName}! A entrega da sua viatura ${delivery.vehicleModel} (${delivery.vehiclePlate}) na X-Motion foi concluída. Pode consultar o seu Passaporte Digital, Certificado QC e Garantia aqui:\n${passportUrl}`
  );
  const whatsappFeedbackMsg = encodeURIComponent(
    `Olá ${delivery.customerName}! Obrigado por confiar na X-Motion para cuidar do seu ${delivery.vehicleModel} (${delivery.vehiclePlate}). Gostaríamos muito de conhecer a sua avaliação rápida (30 seg) sobre o serviço:\n${feedbackUrl}`
  );

  const whatsappPassportHref = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${whatsappPassportMsg}`
    : `https://wa.me/?text=${whatsappPassportMsg}`;
  const whatsappFeedbackHref = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${whatsappFeedbackMsg}`
    : `https://wa.me/?text=${whatsappFeedbackMsg}`;

  const depositPaidAmount =
    delivery.depositPaidAmount != null && Number(delivery.depositPaidAmount) > 0
      ? Number(delivery.depositPaidAmount)
      : 0;
  const hasPaidDeposit = depositPaidAmount > 0;
  const linkedInvoiceTotal =
    linkedInvoice && typeof linkedInvoice.totalAmount === "number"
      ? linkedInvoice.totalAmount
      : undefined;
  const serviceTotalAmount =
    delivery.serviceTotalAmount != null && delivery.serviceTotalAmount > 0
      ? delivery.serviceTotalAmount
      : linkedInvoiceTotal != null
        ? linkedInvoiceTotal + depositPaidAmount
        : depositPaidAmount;
  const remainingBalanceAmount =
    delivery.remainingBalanceAmount != null
      ? delivery.remainingBalanceAmount
      : Math.max(0, serviceTotalAmount - depositPaidAmount);
  const invoiceStatus =
    delivery.invoicePaymentStatus ??
    linkedInvoice?.paymentStatus ??
    (remainingBalanceAmount === 0 ? "paid" : "pending");
  const isInvoicePaid = invoiceStatus === "paid" || remainingBalanceAmount === 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Entregas</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[20px] bg-[#101314] border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#68a46b]/20 text-[#68a46b]">
              <Key className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f1ede5]">
              Ficha de Levantamento e Entrega
            </h1>
            <Badge variant="success" className="text-xs">
              Entrega concluída
            </Badge>
            {delivery.satisfactionRating && (
              <Badge variant="gold" className="text-xs">
                Satisfação: {delivery.satisfactionRating}/5 ★
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9adae] mt-1">
            <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-1.5 py-0.5 font-mono font-bold text-[#f1ede5]">
              <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
              <span>{delivery.vehiclePlate}</span>
            </div>
            <span className="font-bold text-[#f1ede5]">{delivery.vehicleModel}</span>
            <span>·</span>
            <span>Cliente: {delivery.customerName}</span>
            <span>·</span>
            <span>Data: {formatCheckinDate(delivery.deliveredAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={whatsappPassportHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className: "bg-[#15191a]",
            })}
          >
            <MessageCircle className="h-4 w-4 text-[#68a46b]" />
            <span>Enviar Passaporte / Entrega por WhatsApp</span>
          </a>

          <a
            href={whatsappFeedbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className: "bg-[#15191a]",
            })}
          >
            <Star className="h-4 w-4 text-[#f7d46d]" />
            <span>Enviar Inquérito + Google Review por WhatsApp</span>
          </a>

          {linkedInvoice && (
            <Link
              href={`/invoices/${linkedInvoice.id}`}
              className={buttonStyles({
                variant: "outline",
                size: "sm",
                className: "bg-[#15191a]",
              })}
            >
              <CreditCard className="h-4 w-4 text-[#d3a548]" />
              <span>Ver Fatura {linkedInvoice.invoiceNumber}</span>
            </Link>
          )}

          <Link
            href={`/passport/${delivery.vehiclePlate}`}
            target="_blank"
            className={buttonStyles({
              variant: "primary",
              size: "sm",
              className:
                "bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-bold",
            })}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Passaporte Digital</span>
          </Link>
        </div>
      </div>

      {hasPaidDeposit && (
        <Card className="p-6 flex flex-col gap-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#d3a548]" />
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                Resumo Financeiro e Abatimento de Sinal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[11px]">
                Sinal abatido na fatura
              </Badge>
              <Badge
                variant={isInvoicePaid ? "success" : "gold"}
                className="text-[11px]"
              >
                {isInvoicePaid ? "Saldo liquidado" : "Saldo a liquidar na entrega"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-[#0c0f10] border border-white/[0.06] flex flex-col gap-1">
              <span className="text-[11px] text-[#a9adae]">
                Valor Total do Serviço
              </span>
              <span className="text-lg font-mono font-bold text-[#f1ede5]">
                {formatCurrency(serviceTotalAmount)}
              </span>
            </div>

            <div className="p-4 rounded-md bg-[#68a46b]/10 border border-[#68a46b]/30 flex flex-col gap-1">
              <span className="text-[11px] text-[#68a46b] font-semibold">
                Sinal já Liquidado
              </span>
              <span className="text-lg font-mono font-bold text-[#68a46b]">
                - {formatCurrency(depositPaidAmount)}
              </span>
            </div>

            <div
              className={
                isInvoicePaid
                  ? "p-4 rounded-md bg-[#68a46b]/10 border border-[#68a46b]/30 flex flex-col gap-1"
                  : "p-4 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/35 flex flex-col gap-1"
              }
            >
              <span
                className={
                  isInvoicePaid
                    ? "text-[11px] text-[#68a46b] font-semibold"
                    : "text-[11px] text-[#f7d46d] font-semibold"
                }
              >
                Saldo na Entrega
              </span>
              <span
                className={
                  isInvoicePaid
                    ? "text-lg font-mono font-bold text-[#68a46b]"
                    : "text-lg font-mono font-bold text-[#f7d46d]"
                }
              >
                {formatCurrency(remainingBalanceAmount)}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
              Dados de Quem Levantou a Viatura
            </span>
            <Badge
              variant={delivery.signatureDataUrl ? "gold" : "outline"}
              className="text-[11px]"
            >
              {delivery.signatureDataUrl ? "Assinatura recolhida" : "Sem assinatura"}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Nome do Responsável:</span>
              <strong className="text-[#f1ede5]">{delivery.receiverName}</strong>
            </div>

            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Documento de Identificação:</span>
              <span className="font-mono text-[#f1ede5]">
                {delivery.receiverIdDocument || "Não indicado"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#a9adae]">
              <span>Entregue pelo Técnico:</span>
              <span className="text-[#f1ede5]">{delivery.deliveredByName}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-3 border-t border-white/[0.04]">
            <span className="font-semibold text-[#a9adae]">
              Assinatura Recolhida no Levantamento:
            </span>
            {delivery.signatureDataUrl ? (
              <div className="p-3 rounded-md bg-[#0c0f10] border border-[#d3a548]/30 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={delivery.signatureDataUrl}
                  alt={`Assinatura de ${delivery.receiverName}`}
                  className="max-h-28 w-auto"
                />
              </div>
            ) : (
              <div
                role="alert"
                className="p-3 rounded-md bg-[#1d1810] border border-[#d3a548]/40 text-[12px] text-[#f1ede5]"
              >
                Não existe assinatura guardada para esta entrega.
              </div>
            )}
          </div>

          {delivery.notes && (
            <div className="p-3 rounded-sm bg-[#15191a] border border-white/[0.04] text-[12px] text-[#a9adae]">
              <strong>Notas:</strong> {delivery.notes}
            </div>
          )}
        </Card>

        <BelongingsChecklist
          belongings={delivery.belongings}
          onToggleBelonging={() => {}}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
