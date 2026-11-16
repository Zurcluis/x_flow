"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, Edit3, FileText, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendInboxReplyAction, suggestInboxReplyAction } from "@/app/actions/inbox";
import { CHANNEL_LABELS } from "@/components/xflow/inbox/inbox-labels";
import {
  GMAIL_REPLY_MAX_CHARS,
  INSTAGRAM_DM_MAX_CHARS,
  validateInboxReplyDraft,
} from "@/domains/inbox/rules";
import type {
  InboxMessageRecord,
  InboxShareableQuote,
  InboxThreadRecord,
  InstagramWindowStatus,
} from "@/domains/inbox/types";
import type { InboxSummaryCounts } from "@/server/inbox/repository";

interface InboxReplyComposerProps {
  thread: InboxThreadRecord;
  instagramWindow: InstagramWindowStatus | null;
  shareableQuotes: InboxShareableQuote[];
  appBaseUrl: string;
  aiEnabled?: boolean;
  onSent: (result: {
    thread: InboxThreadRecord;
    message: InboxMessageRecord;
    counts: InboxSummaryCounts;
  }) => void;
  onError: (message: string) => void;
}

export function InboxReplyComposer({
  thread,
  instagramWindow,
  shareableQuotes,
  appBaseUrl,
  aiEnabled = false,
  onSent,
  onError,
}: InboxReplyComposerProps) {
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");

  const maxChars =
    thread.channel === "instagram" ? INSTAGRAM_DM_MAX_CHARS : GMAIL_REPLY_MAX_CHARS;

  const isInstagramBlocked =
    thread.channel === "instagram" &&
    (!thread.participantExternalId ||
      instagramWindow?.state === "expired" ||
      instagramWindow?.state === "none");

  const isGmailMissingRecipient =
    thread.channel === "gmail" && !thread.participantHandle;

  const disabledComposer = isInstagramBlocked || isGmailMissingRecipient;

  function handleInsertQuoteLink(quoteId: string) {
    setSelectedQuoteId(quoteId);
    const quote = shareableQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const origin =
      appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const cleanOrigin = origin.replace(/\/$/, "");
    const publicUrl = `${cleanOrigin}/quotes/public/${quote.publicToken}`;
    const snippetLine = `Podes consultar e aprovar o orçamento ${quote.quoteNumber} aqui: ${publicUrl}`;

    setText((prev) => {
      const base = prev.trimEnd();
      return base ? `${base}\n\n${snippetLine}` : snippetLine;
    });
    setLocalError(null);
    setSelectedQuoteId("");
  }

  async function handleSuggestAi() {
    if (suggesting || sending) return;
    setSuggesting(true);
    setLocalError(null);
    try {
      const res = await suggestInboxReplyAction(thread.id);
      if (!res.ok) {
        setLocalError(res.error);
        return;
      }
      setText(res.draftText);
    } finally {
      setSuggesting(false);
    }
  }

  function handleReviewClick(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    const validation = validateInboxReplyDraft({
      channel: thread.channel,
      text,
      recipientHandle: thread.participantHandle,
      participantExternalId: thread.participantExternalId,
      lastInboundAt: thread.lastInboundAt,
    });

    if (!validation.ok) {
      setLocalError(validation.error);
      return;
    }

    setConfirming(true);
  }

  async function handleConfirmSend() {
    if (sending) return;
    setSending(true);
    setLocalError(null);
    try {
      const res = await sendInboxReplyAction({
        threadId: thread.id,
        text,
        confirmed: true,
      });

      if (!res.ok) {
        setLocalError(res.error);
        setConfirming(false);
        onError(res.error);
        return;
      }

      setText("");
      setConfirming(false);
      onSent({
        thread: res.thread,
        message: res.message,
        counts: res.counts,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      aria-label="Responder à conversa"
      className="rounded-md border border-white/[0.08] bg-[#131718] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#a9adae]">
          <Send className="h-3.5 w-3.5 text-[#d3a548]" aria-hidden="true" />
          <span>
            Responder por <strong className="text-[#f1ede5]">{CHANNEL_LABELS[thread.channel]}</strong>{" "}
            para <strong className="text-[#f7d46d]">{thread.participantHandle || "—"}</strong>
          </span>
        </div>

        <span
          className={`tabular-nums ${
            text.length > maxChars ? "text-[#f05a50]" : "text-[#8a9092]"
          }`}
        >
          {text.length} / {maxChars}
        </span>
      </div>

      {isInstagramBlocked ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-sm border border-[#f05a50]/30 bg-[#f05a50]/10 p-3 text-xs text-[#f8a19b]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {!thread.participantExternalId
              ? "Falta o identificador externo (PSID) deste contacto. Sincronize antes de responder."
              : "A janela de 24 horas da Meta para resposta por API expirou (ou não há mensagem recente recebida). Responde diretamente pela app Instagram ou contacta o cliente por telemóvel/e-mail."}
          </span>
        </div>
      ) : isGmailMissingRecipient ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-sm border border-[#f05a50]/30 bg-[#f05a50]/10 p-3 text-xs text-[#f8a19b]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Este tópico não tem um endereço de e-mail de destinatário válido.</span>
        </div>
      ) : confirming ? (
        <div className="space-y-3 rounded-sm border border-[#d3a548]/45 bg-[#1f1b14]/80 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#f7d46d]">
              Confirmar envio externo ({CHANNEL_LABELS[thread.channel]})
            </span>
            <span className="text-xs text-[#a9adae]">
              Destinatário: {thread.participantHandle}
            </span>
          </div>

          <p className="whitespace-pre-wrap break-words rounded-sm border border-white/[0.08] bg-[#080a0b] p-3 text-xs sm:text-sm text-[#f1ede5]">
            {text.trim()}
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={sending}
              onClick={() => setConfirming(false)}
              className="min-h-[38px]"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Editar</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={sending}
              onClick={handleConfirmSend}
              className="min-h-[38px]"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{sending ? "A enviar…" : "Confirmar envio"}</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReviewClick} className="space-y-3">
          <div>
            <label htmlFor={`reply-textarea-${thread.id}`} className="sr-only">
              Mensagem de resposta
            </label>
            <textarea
              id={`reply-textarea-${thread.id}`}
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (localError) setLocalError(null);
              }}
              disabled={disabledComposer}
              placeholder={
                thread.channel === "instagram"
                  ? "Escreve a tua resposta por Instagram Direct…"
                  : "Escreve a tua resposta por e-mail (a assinatura da conta Gmail será incluída)…"
              }
              className="w-full rounded-sm bg-[#080a0b] border border-white/[0.1] p-3 text-xs sm:text-sm text-[#f1ede5] placeholder-[#8a9092] focus:border-[#d3a548] focus:outline-none"
            />
          </div>

          {localError && (
            <div role="alert" className="text-xs text-[#f8a19b]">
              {localError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {aiEnabled && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={suggesting || sending}
                  onClick={handleSuggestAi}
                  className="min-h-[38px]"
                >
                  {suggesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d3a548]" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[#d3a548]" aria-hidden="true" />
                  )}
                  <span>{suggesting ? "A gerar minuta…" : "Sugerir resposta (IA)"}</span>
                </Button>
              )}

              {shareableQuotes.length > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#d3a548] shrink-0" aria-hidden="true" />
                  <label htmlFor={`insert-quote-${thread.id}`} className="sr-only">
                    Inserir link de orçamento
                  </label>
                  <select
                    id={`insert-quote-${thread.id}`}
                    value={selectedQuoteId}
                    onChange={(e) => handleInsertQuoteLink(e.target.value)}
                    className="h-9 rounded-sm bg-[#080a0b] border border-white/[0.1] px-2.5 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                  >
                    <option value="">Inserir link de orçamento…</option>
                    {shareableQuotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quoteNumber} ({q.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!aiEnabled && shareableQuotes.length === 0 && (
                <span className="text-[11px] text-[#8a9092]">
                  Envio protegido com confirmação prévia antes de sair da oficina.
                </span>
              )}
            </div>

            <Button type="submit" variant="primary" size="sm" className="min-h-[40px] self-end">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Rever e enviar</span>
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
