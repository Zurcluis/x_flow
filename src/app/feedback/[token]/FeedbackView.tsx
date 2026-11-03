"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertTriangle,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/xflow/Logo";
import type { PublicDeliveryFeedbackData } from "@/server/deliveries";
import { submitDeliveryFeedbackAction } from "@/app/actions/deliveries";

interface FeedbackViewProps {
  initialFeedback: PublicDeliveryFeedbackData;
}

const RATING_LABELS: Record<number, string> = {
  1: "Muito insatisfeito — aquém do esperado",
  2: "Insatisfeito — precisa de melhoria",
  3: "Razoável — cumpriu o básico",
  4: "Muito satisfeito — excelente acabamento",
  5: "Irrepreensível — padrão X-Motion de excelência!",
};

export function FeedbackView({ initialFeedback }: FeedbackViewProps) {
  const [feedback, setFeedback] = useState<PublicDeliveryFeedbackData>(initialFeedback);
  const [rating, setRating] = useState<number>(
    initialFeedback.satisfactionRating ?? 5
  );
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(
    initialFeedback.satisfactionComment ?? ""
  );
  const [submitted, setSubmitted] = useState<boolean>(
    Boolean(initialFeedback.satisfactionSubmittedAt)
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const displayRating = hoveredRating ?? rating;
  const isHighRating = (feedback.satisfactionRating ?? rating) >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await submitDeliveryFeedbackAction(feedback.token, {
      rating,
      comment,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setFeedback(res.feedback);
    setSubmitted(true);
  };

  const handleGoogleReviewClick = () => {
    void submitDeliveryFeedbackAction(feedback.token, {
      rating: feedback.satisfactionRating ?? rating,
      comment: feedback.satisfactionComment ?? comment,
      googleReviewClicked: true,
    });
    window.open(feedback.googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#050606] text-[#f1ede5] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <Logo variant="full" />
          <Badge variant="gold" className="text-xs">
            Inquérito Pós-Entrega
          </Badge>
        </header>

        <div className="p-6 sm:p-8 rounded-[24px] bg-[#101314] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col gap-6">
          {/* Viatura e Cliente */}
          <div className="flex flex-col gap-2 pb-5 border-b border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2.5">
              {feedback.vehiclePlate && (
                <div className="inline-flex items-center rounded-[5px] border border-white/20 bg-[#080a0b] px-2 py-0.5 font-mono text-xs font-bold text-[#f1ede5]">
                  <span className="text-[#6e93b5] mr-1 text-[10px] font-sans">P</span>
                  <span>{feedback.vehiclePlate}</span>
                </div>
              )}
              <span className="font-bold text-base text-[#f1ede5]">
                {feedback.vehicleModel}
              </span>
            </div>
            <p className="text-xs text-[#a9adae]">
              Olá <strong className="text-[#f1ede5]">{feedback.customerName}</strong>,
              agradecemos a confiança na <strong className="text-[#f7d46d]">X-Motion</strong>{" "}
              para realizar o serviço de{" "}
              <span className="text-[#f1ede5] font-medium">{feedback.serviceTitle}</span>.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#f1ede5]">
                  Como avalia o resultado final na sua viatura?
                </h1>
                <p className="text-xs text-[#a9adae] max-w-md">
                  A sua opinião ajuda-nos a manter o rigor de aplicação e detalhe em cada viatura entregue.
                </p>

                {/* Seletor de 1 a 5 estrelas */}
                <div
                  className="flex items-center gap-2 sm:gap-3 mt-2"
                  role="radiogroup"
                  aria-label="Classificação de 1 a 5 estrelas"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= displayRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                        aria-checked={rating === star}
                        role="radio"
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          active
                            ? "bg-[#d3a548]/20 border-[#d3a548] text-[#f7d46d] scale-105 shadow-[0_0_20px_rgba(211,165,72,0.25)]"
                            : "bg-[#15191a] border-white/[0.06] text-[#8a9092] hover:border-white/20"
                        }`}
                      >
                        <Star
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          fill={active ? "currentColor" : "none"}
                        />
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs font-semibold text-[#f7d46d] mt-1">
                  {RATING_LABELS[displayRating]}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="feedback-comment"
                  className="text-xs font-semibold text-[#a9adae]"
                >
                  Comentário ou sugestão sobre a experiência (opcional)
                </label>
                <textarea
                  id="feedback-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partilhe connosco o que mais gostou no acabamento ou atendimento..."
                  className="w-full rounded-md bg-[#0c0f10] border border-white/[0.08] focus:border-[#d3a548] p-3 text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 rounded-md bg-[#2a1714] border border-[#f05a50]/50 text-xs text-[#f78e85]"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#f05a50]" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                className="w-full justify-center bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] font-extrabold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>
                  {submitting ? "A enviar avaliação..." : "Submeter Avaliação"}
                </span>
              </Button>
            </form>
          ) : isHighRating ? (
            /* Destaque Dourado para 4 ou 5 estrelas + Botão Google Review */
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d3a548]/20 border border-[#d3a548]/50 text-[#f7d46d] shadow-[0_0_30px_rgba(211,165,72,0.3)]">
                <Sparkles className="h-8 w-8" />
              </div>

              <div className="flex flex-col gap-2 max-w-lg">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#d3a548]">
                  Avaliação de {feedback.satisfactionRating ?? rating} Estrelas Registada
                </span>
                <h2 className="text-2xl font-black text-[#f1ede5]">
                  Muito obrigado pela sua confiança!
                </h2>
                <p className="text-xs text-[#a9adae] leading-relaxed">
                  Ficamos muito orgulhosos por saber que o acabamento da sua viatura{" "}
                  <strong className="text-[#f1ede5]">{feedback.vehicleModel}</strong>{" "}
                  correspondeu ao padrão de excelência X-Motion. Se puder partilhar a sua
                  experiência no Google, ajuda-nos imenso a crescer!
                </p>
              </div>

              <div className="w-full p-5 rounded-[18px] bg-gradient-to-b from-[#1f1a10] to-[#13110c] border border-[#d3a548]/50 flex flex-col items-center gap-4">
                <div className="flex items-center gap-1 text-[#f7d46d]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-5 w-5" fill="currentColor" />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleGoogleReviewClick}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-black bg-gradient-to-r from-[#d3a548] to-[#f7d46d] text-[#050606] shadow-[0_12px_32px_rgba(211,165,72,0.35)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Avaliar a X-Motion no Google</span>
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-[11px] text-[#8a9092] hover:text-[#f7d46d] underline cursor-pointer"
              >
                Alterar a minha resposta
              </button>
            </div>
          ) : (
            /* Acompanhamento interno para 1 a 3 estrelas */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#68a46b]/15 border border-[#68a46b]/40 text-[#68a46b]">
                <HeartHandshake className="h-7 w-7" />
              </div>

              <div className="flex flex-col gap-2 max-w-md">
                <h2 className="text-xl font-bold text-[#f1ede5]">
                  Obrigado pelo seu feedback sincero
                </h2>
                <p className="text-xs text-[#a9adae] leading-relaxed">
                  A sua avaliação interna foi encaminhada diretamente para o{" "}
                  <strong className="text-[#f1ede5]">Luís (Direção X-Motion)</strong>.
                  Entraremos em contacto consigo muito brevemente para garantir que tudo
                  fica 100% ao seu gosto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-[11px] text-[#8a9092] hover:text-[#f7d46d] underline cursor-pointer"
              >
                Alterar a minha resposta
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/[0.06] text-[11px] text-[#8a9092]">
            <ShieldCheck className="h-4 w-4 text-[#d3a548]" />
            <span>
              Lembrete: A sua revisão gratuita de controlo pós-cura aos 30 dias (D+30) está incluída.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
