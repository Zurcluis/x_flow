"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Key,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  PackageCheck,
  FileCheck,
  MessageCircle,
  Star,
  CalendarClock,
  Check,
  Loader2,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCheckinDate } from "@/domains/checkins/presentation";
import { Delivery } from "@/domains/finance/types";
import type { DeliveryWithAftersales } from "@/server/deliveries";
import { markAftersalesStepAction } from "@/app/actions/deliveries";

type DeliveryItem = Delivery & Partial<DeliveryWithAftersales>;

const subscribeToOrigin = () => () => {};

function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) {
    return `351${digits}`;
  }
  return digits;
}

export function DeliveriesView({
  initialDeliveries,
}: {
  initialDeliveries: DeliveryItem[];
}) {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "aftersales">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const appOrigin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => ""
  );

  const filtered = deliveries.filter(
    (d) =>
      d.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signedCount = deliveries.filter((d) => Boolean(d.signatureDataUrl)).length;
  const belongingsCount = deliveries.reduce(
    (total, delivery) => total + delivery.belongings.length,
    0
  );
  const ratedCount = deliveries.filter(
    (d) => typeof d.satisfactionRating === "number"
  ).length;
  const d30PendingCount = deliveries.filter((d) => !d.reviewD30CompletedAt).length;

  const handleSendD7WhatsApp = async (del: DeliveryItem) => {
    const cleanPhone = formatWhatsAppPhone(del.customerPhone);
    const feedbackUrl = `${appOrigin}/feedback/${del.token}`;
    const text = encodeURIComponent(
      `Olá ${del.customerName}! Já passou uma semana desde a entrega do seu ${del.vehicleModel} (${del.vehiclePlate}) na X-Motion. Como se tem portado o acabamento? Deixe-nos a sua avaliação rápida (30 seg) aqui:\n${feedbackUrl}`
    );
    const href = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(href, "_blank", "noopener,noreferrer");

    setBusyId(`d7-${del.id}`);
    const res = await markAftersalesStepAction(del.id, "d7_sent");
    setBusyId(null);
    if (res.ok) {
      const nowIso = new Date().toISOString();
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === del.id
            ? { ...item, followupD7SentAt: item.followupD7SentAt ?? nowIso }
            : item
        )
      );
      router.refresh();
    }
  };

  const handleSendD30InviteWhatsApp = (del: DeliveryItem) => {
    const cleanPhone = formatWhatsAppPhone(del.customerPhone);
    const text = encodeURIComponent(
      `Olá ${del.customerName}! Está a chegar o 30.º dia após a entrega do seu ${del.vehicleModel} (${del.vehiclePlate}). Convidamo-lo para a Revisão Gratuita de 15 minutos na X-Motion para inspeção de remates e cura final. Qual o melhor dia e hora para passar cá?`
    );
    const href = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleCompleteD30Review = async (del: DeliveryItem) => {
    setBusyId(`d30-${del.id}`);
    const res = await markAftersalesStepAction(
      del.id,
      "d30_completed",
      "Revisão gratuita D+30 concluída — bordos e acabamento validados."
    );
    setBusyId(null);
    if (res.ok) {
      const nowIso = new Date().toISOString();
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === del.id
            ? { ...item, reviewD30CompletedAt: item.reviewD30CompletedAt ?? nowIso }
            : item
        )
      );
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Entregas de Viaturas & Pós-Venda
          </h1>
          <p className="text-xs text-[#a9adae]">
            Registo de levantamentos com assinatura digital, garantia automática,
            inquérito de satisfação D+7 e revisão gratuita aos 30 dias (D+30).
          </p>
        </div>

        <Link
          href="/deliveries/new"
          className={buttonStyles({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          <span>Nova Entrega ao Cliente</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Entregas Registadas</span>
            <Key className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {deliveries.length}
            </span>
            <span className="block text-[12px] text-[#8a9092] mt-0.5">
              {deliveries.length === 1 ? "viatura" : "viaturas"} entregues
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Assinaturas Recolhidas</span>
            <CheckCircle2 className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {signedCount}
              <span className="text-sm text-[#8a9092] font-normal"> / {deliveries.length}</span>
            </span>
            <span className="block text-[12px] text-[#8a9092] mt-0.5">
              Entregas com assinatura digital guardada
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Pertences Conferidos</span>
            <PackageCheck className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {belongingsCount}
            </span>
            <span className="block text-[12px] text-[#8a9092] mt-0.5">
              Itens conferidos nas entregas
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Pós-Venda D+7 & D+30</span>
            <Star className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {ratedCount}
              <span className="text-sm text-[#8a9092] font-normal"> avaliações</span>
            </span>
            <span className="block text-[12px] text-[#8a9092] mt-0.5">
              {d30PendingCount} revisão(ões) D+30 por concluir
            </span>
          </div>
        </Card>
      </div>

      {/* Barra de Pesquisa e Seletor de Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por matrícula, modelo, cliente ou levantador..."
            className="h-10 w-full pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
          />
        </div>

        <div className="inline-flex rounded-md bg-[#101314] p-1 border border-white/[0.08] self-start">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#d3a548] text-[#050606]"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Entregas ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aftersales")}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "aftersales"
                ? "bg-[#d3a548] text-[#050606]"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Pós-Venda: Satisfação (D+7) & Revisão 30 Dias (D+30)
          </button>
        </div>
      </div>

      {/* Listagem de Entregas */}
      {activeTab === "all" && (
        <>
          {filtered.length === 0 ? (
            <div className="p-8 rounded-[18px] bg-[#101314] border border-white/[0.06] text-sm text-[#a9adae]">
              {deliveries.length === 0
                ? "Ainda não existem entregas registadas nesta organização."
                : "Nenhuma entrega corresponde à pesquisa."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((del) => (
                <Card
                  key={del.id}
                  className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5]">
                        <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                        <span>{del.vehiclePlate}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {del.satisfactionRating && (
                          <Badge variant="gold" className="text-[11px]">
                            {del.satisfactionRating}/5 ★
                          </Badge>
                        )}
                        <Badge variant="success" className="text-[11px]">
                          Levantamento Concluído
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[#f1ede5]">{del.vehicleModel}</h3>
                      <span className="text-xs text-[#a9adae]">
                        Cliente: {del.customerName}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 rounded-sm bg-[#15191a] border border-white/[0.03] text-xs">
                      <span className="text-[#a9adae]">
                        Levantado por:{" "}
                        <strong className="text-[#f1ede5]">{del.receiverName}</strong>{" "}
                        {del.receiverIdDocument && `(${del.receiverIdDocument})`}
                      </span>
                      <span className="text-[12px] text-[#8a9092]">
                        Entregue por: {del.deliveredByName}
                      </span>
                      <span className="text-[12px] text-[#68a46b] font-medium mt-0.5">
                        Pertences e chaves conferidos ({del.belongings.length} itens)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04] text-xs">
                    <span className="text-[11px] text-[#8a9092]">
                      {formatCheckinDate(del.deliveredAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/deliveries/${del.id}`}
                        className={buttonStyles({
                          variant: "outline",
                          size: "sm",
                          className: "bg-[#15191a]",
                        })}
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Ver Ficha</span>
                      </Link>
                      <Link
                        href={`/passport/${del.vehiclePlate}`}
                        target="_blank"
                        className={buttonStyles({
                          variant: "primary",
                          size: "sm",
                          className: "bg-[#d3a548] text-[#050606] font-bold",
                        })}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Passaporte</span>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Secção Pós-Venda: Satisfação (D+7) & Revisão 30 Dias (D+30) */}
      <section className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-5 w-5 text-[#f7d46d]" />
            <h2 className="text-lg font-bold text-[#f1ede5]">
              Pós-Venda: Satisfação (D+7) & Revisão 30 Dias (D+30)
            </h2>
          </div>
          <span className="text-xs text-[#a9adae]">
            Follow-up proativo via WhatsApp, inquérito de satisfação + Google Review e revisão de controlo aos 30 dias
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 rounded-[18px] bg-[#101314] border border-white/[0.06] text-xs text-[#a9adae]">
            Sem entregas para acompanhamento pós-venda.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((del) => {
              const d7Sent = Boolean(del.followupD7SentAt);
              const d30Done = Boolean(del.reviewD30CompletedAt);
              return (
                <Card
                  key={`aftersales-${del.id}`}
                  className="p-5 flex flex-col justify-between gap-4 bg-[#101314] border border-white/[0.08]"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-[4px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono font-bold text-xs text-[#f1ede5]">
                          <span className="text-[#6e93b5] mr-1 text-[11px] font-sans">P</span>
                          <span>{del.vehiclePlate}</span>
                        </div>
                        <span className="font-bold text-sm text-[#f1ede5]">
                          {del.vehicleModel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={d7Sent ? "success" : "gold"}
                          className="text-[11px]"
                        >
                          {d7Sent ? "D+7 Enviado" : "D+7 Pendente"}
                        </Badge>
                        <Badge
                          variant={d30Done ? "success" : "outline"}
                          className="text-[11px]"
                        >
                          {d30Done ? "Revisão D+30 Concluída" : "Revisão D+30 Agendada"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#a9adae]">
                      <span>
                        Cliente: <strong className="text-[#f1ede5]">{del.customerName}</strong>
                      </span>
                      {del.satisfactionRating ? (
                        <span className="text-[#f7d46d] font-bold">
                          Avaliação Cliente: {del.satisfactionRating}/5 ★
                        </span>
                      ) : (
                        <Link
                          href={`/feedback/${del.token}`}
                          target="_blank"
                          className="text-[#f7d46d] hover:underline font-medium"
                        >
                          Abrir Link de Inquérito
                        </Link>
                      )}
                    </div>

                    {del.reviewD30ScheduledAt && (
                      <div className="text-[11px] text-[#8a9092]">
                        Revisão gratuita D+30 prevista para:{" "}
                        <span className="font-mono text-[#f1ede5]">
                          {formatCheckinDate(del.reviewD30ScheduledAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.05]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendD7WhatsApp(del)}
                      disabled={busyId === `d7-${del.id}`}
                      className="bg-[#15191a]"
                    >
                      {busyId === `d7-${del.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#68a46b]" />
                      ) : (
                        <MessageCircle className="h-3.5 w-3.5 text-[#68a46b]" />
                      )}
                      <span>WhatsApp D+7 + Inquérito</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendD30InviteWhatsApp(del)}
                      className="bg-[#15191a]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#d3a548]" />
                      <span>WhatsApp Convite Revisão D+30</span>
                    </Button>

                    {!d30Done && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteD30Review(del)}
                        disabled={busyId === `d30-${del.id}`}
                      >
                        {busyId === `d30-${del.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Concluir Revisão D+30</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
