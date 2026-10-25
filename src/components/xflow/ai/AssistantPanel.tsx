"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  CircleAlert,
  FileText,
  ListChecks,
  Loader2,
  Mic,
  MicOff,
  Package,
  Pause,
  Play,
  Send,
  Square,
  Truck,
  Volume2,
  VolumeX,
  Waves,
  Wrench,
  X,
  Layers,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantSphere, type AssistantVisualState } from "./AssistantSphere";
import { useSpeechSynthesis, type VoiceGender } from "./useSpeechSynthesis";
import { useDictation } from "./useDictation";
import { useMicLevel } from "./useMicLevel";
import {
  askAssistantAction,
  getAssistantBriefingAction,
} from "@/app/actions/assistant";
import type {
  AssistantBriefing,
  AssistantItem,
  AssistantReference,
  AssistantSource,
} from "@/domains/assistant/types";
import { cn } from "@/lib/utils";

interface AssistantPanelProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  references: AssistantReference[];
}

const QUICK_QUESTIONS = [
  "O que tenho planeado para hoje?",
  "Que trabalhos estão bloqueados?",
  "Que orçamentos precisam de seguimento?",
  "Que materiais estão abaixo do mínimo?",
];

const SEVERITY_DOT: Record<AssistantItem["severity"], string> = {
  danger: "bg-[#f05a50]",
  warning: "bg-[#d3a548]",
  info: "bg-[#6e93b5]",
};

const SOURCE_DOT: Record<AssistantSource["status"], string> = {
  available: "bg-[#68a46b]",
  empty: "bg-[#8a9092]",
  unavailable: "bg-[#f05a50]",
  not_applicable: "bg-[#8a9092]",
};

const STATUS_TEXT: Record<AssistantVisualState, string> = {
  idle: "A apresentar o teu dia",
  "requesting-mic": "Falta a tua autorização no navegador",
  listening: "A ouvir · microfone ativo",
  transcribing: "A processar a tua fala...",
  thinking: "A consultar os dados da oficina...",
  speaking: "A apresentar o teu dia",
  paused: "Leitura em pausa",
  error: "Não consegui concluir o pedido",
};

function formatDateKey(key: string): string {
  const [year, month, day] = key.split("-");
  if (!year || !month || !day) return key;
  return `${day}/${month}/${year}`;
}

function formatConsultedAt(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function sourceStatusLabel(source: AssistantSource): string {
  if (source.status === "unavailable") return "indisponível";
  if (source.status === "not_applicable") return "não aplicável";
  if (source.status === "empty") return "sem registos";
  const time = formatConsultedAt(source.consultedAt);
  return time ? `consultado às ${time}` : "disponível";
}

function SourceChips({ sources }: { sources: AssistantSource[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <span
          key={source.id}
          title={source.message ?? undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
            source.status === "unavailable"
              ? "border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f0a9a3]"
              : "border-white/[0.08] bg-[#15191a] text-[#a9adae]"
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", SOURCE_DOT[source.status])}
            aria-hidden="true"
          />
          <span className="font-medium text-[#f1ede5]">{source.label}</span>
          <span>{sourceStatusLabel(source)}</span>
        </span>
      ))}
    </div>
  );
}

function ItemList({
  title,
  icon: Icon,
  items,
  numbered = false,
  onNavigate,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: AssistantItem[];
  numbered?: boolean;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#d3a548]" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#a9adae]">
          {title}
        </h3>
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.2 text-[10px] text-[#8a9092]">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-white/[0.04] rounded-md border border-white/[0.06] bg-[#121516]">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="flex items-start gap-3 p-3 transition-colors hover:bg-white/[0.04]"
          >
            {numbered ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d3a548]/20 font-mono text-[11px] font-semibold text-[#f7d46d]">
                {index + 1}
              </span>
            ) : (
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  SEVERITY_DOT[item.severity]
                )}
                aria-hidden="true"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium text-[#f1ede5]">
                {item.title}
              </span>
              {item.detail ? (
                <span className="text-[11px] text-[#8a9092]">{item.detail}</span>
              ) : null}
            </div>
            {item.time ? (
              <span className="shrink-0 font-mono text-[11px] text-[#d3a548]">
                {item.time}
              </span>
            ) : null}
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#8a9092]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  onNavigate,
}: {
  message: ChatMessage;
  onNavigate: () => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-md px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-[#d3a548] font-medium text-[#050606]"
            : "border border-white/[0.06] bg-[#15191a] text-[#f1ede5]"
        )}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        {message.references.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1 border-t border-white/[0.08] pt-2">
            {message.references.map((reference) => (
              <Link
                key={`${reference.href}-${reference.label}`}
                href={reference.href}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#f7d46d] hover:underline"
              >
                <span className="truncate">{reference.label}</span>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AssistantPanel({ onClose }: AssistantPanelProps) {
  const [briefing, setBriefing] = useState<AssistantBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [dictationText, setDictationText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const levelRef = useRef(0);
  const requestIdRef = useRef(0);
  const messageIdRef = useRef(0);
  const mountedRef = useRef(true);
  const stopAllRef = useRef<() => void>(() => undefined);

  const speech = useSpeechSynthesis(levelRef);
  const dictation = useDictation();
  const micLevel = useMicLevel(levelRef);

  const stopAll = useCallback(() => {
    speech.stop();
    dictation.abort();
    micLevel.stop();
    levelRef.current = 0;
    setRequestingMic(false);
  }, [speech, dictation, micLevel]);

  const loadBriefing = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    try {
      const result = await getAssistantBriefingAction();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      if (result.ok) {
        setBriefing(result.briefing);
      } else {
        setError(result.error);
      }
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(
          "Não consegui ligar ao assistente. Verifica a ligação e tenta novamente."
        );
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current)
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBriefing();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBriefing]);

  useEffect(() => {
    stopAllRef.current = stopAll;
  }, [stopAll]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      stopAllRef.current();
    };
  }, []);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      30
    );

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const visualState = useMemo<AssistantVisualState>(() => {
    if (loading || asking) return "thinking";
    if (requestingMic) return "requesting-mic";
    if (dictation.transcribing) return "transcribing";
    if (dictation.listening) return "listening";
    if (speech.speaking) return speech.paused ? "paused" : "speaking";
    if (error || notice) return "error";
    return "idle";
  }, [
    loading,
    asking,
    requestingMic,
    dictation.transcribing,
    dictation.listening,
    speech.speaking,
    speech.paused,
    error,
    notice,
  ]);

  const handleSpeak = useCallback(
    (text: string) => {
      if (!speech.supported) {
        setNotice(
          "Este navegador não suporta leitura por voz. O resumo está no ecrã."
        );
        return;
      }
      setNotice(null);
      speech.speak(text, {
        onError: (message) => setNotice(message),
      });
    },
    [speech]
  );

  const handleStartDay = useCallback(() => {
    if (!briefing) return;
    dictation.abort();
    micLevel.stop();
    handleSpeak(briefing.narration);
  }, [briefing, dictation, micLevel, handleSpeak]);

  const handleAsk = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || asking) return;

      dictation.abort();
      micLevel.stop();
      speech.stop();
      setNotice(null);
      setInput("");
      setDictationText("");
      setAsking(true);
      setShowDetails(true);

      const userMessage: ChatMessage = {
        id: `user-${(messageIdRef.current += 1)}`,
        role: "user",
        text: question,
        references: [],
      };
      setMessages((current) => [...current, userMessage]);

      try {
        const result = await askAssistantAction(question);
        if (!mountedRef.current) return;
        if (result.ok) {
          setError(null);
          setMessages((current) => [
            ...current,
            {
              id: `assistant-${(messageIdRef.current += 1)}`,
              role: "assistant",
              text: result.answer.text,
              references: result.answer.references,
            },
          ]);
          if (soundOn) handleSpeak(result.answer.text);
        } else {
          setMessages((current) => [
            ...current,
            {
              id: `assistant-${(messageIdRef.current += 1)}`,
              role: "assistant",
              text: result.error,
              references: [],
            },
          ]);
        }
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${(messageIdRef.current += 1)}`,
            role: "assistant",
            text: "Não consegui responder agora. Tenta novamente.",
            references: [],
          },
        ]);
      } finally {
        if (mountedRef.current) setAsking(false);
      }
    },
    [asking, dictation, micLevel, speech, soundOn, handleSpeak]
  );

  const toggleDictation = useCallback(async () => {
    if (dictation.listening) {
      dictation.stop();
      return;
    }
    if (!dictation.supported) {
      setNotice(
        "Este navegador não suporta ditado. Escreve a pergunta em vez de falar."
      );
      return;
    }

    speech.stop();
    setNotice(null);
    setDictationText("");
    setRequestingMic(true);

    const level = await micLevel.start();
    setRequestingMic(false);

    if (!mountedRef.current) {
      micLevel.stop();
      return;
    }
    if (level === "denied") {
      setNotice(
        "O microfone está bloqueado. Autoriza o microfone no navegador ou escreve a pergunta."
      );
      return;
    }

    const started = dictation.start({
      onPartial: (text) => setDictationText(text),
      onResult: (text) => {
        setInput(text);
        setDictationText("");
        micLevel.stop();
        window.setTimeout(() => inputRef.current?.focus(), 30);
      },
      onError: (message) => {
        setNotice(message);
        setDictationText("");
        micLevel.stop();
      },
      onEnd: () => {
        micLevel.stop();
      },
    });

    if (!started) micLevel.stop();
  }, [dictation, micLevel, speech]);

  const toggleSound = useCallback(() => {
    if (soundOn) speech.stop();
    setSoundOn(!soundOn);
  }, [soundOn, speech]);

  const handleGenderToggle = useCallback(() => {
    const next: VoiceGender = speech.gender === "female" ? "male" : "female";
    speech.setGender(next);
  }, [speech]);

  const statusText = notice ?? STATUS_TEXT[visualState];
  const hasMessages = messages.length > 0;

  const greetingText = briefing
    ? `${briefing.greeting}, ${briefing.firstName}.`
    : "Bom dia, Luís.";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-between overflow-x-hidden bg-[#060809] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(211,165,72,0.14),transparent_70%)] text-[#f1ede5]">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="relative flex min-h-[100dvh] w-full flex-col justify-between px-4 sm:px-8 py-4 sm:py-6"
      >
        {/* Cabeçalho Superior estilo X-Flow by X-Motion */}
        <header className="flex w-full items-center justify-between border-b border-white/[0.06] pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            {/* Ícone geométrico da marca X-Motion (4 linhas entrelaçadas) */}
            <div className="relative flex h-8 w-8 items-center justify-center">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-7 w-7 text-[#d3a548]"
                aria-hidden="true"
              >
                <line x1="8" y1="8" x2="24" y2="24" stroke="currentColor" strokeWidth="2" />
                <line x1="24" y1="8" x2="8" y2="24" stroke="currentColor" strokeWidth="2" />
                <rect x="9" y="9" width="14" height="14" stroke="#f7d46d" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 id="assistant-title" className="text-sm font-bold tracking-wider text-[#f1ede5]">
                  X-FLOW
                </h1>
                <span className="rounded-full bg-[#d3a548]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f7d46d]">
                  Assistente
                </span>
              </div>
              <span className="text-[10px] tracking-wide text-[#8a9092]">
                by X-Motion {briefing ? `· ${formatDateKey(briefing.operationalDate)}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Seletor de Voz Feminina / Masculina com voz neural */}
            <button
              type="button"
              onClick={handleGenderToggle}
              title={`Voz atual: ${speech.gender === "female" ? "Feminina" : "Masculina"} (${speech.activeVoiceName || "Sistema"})`}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#121516]/80 px-3 py-1 text-[11px] font-medium text-[#f1ede5] transition-colors hover:border-[#d3a548]/50 hover:text-[#f7d46d]"
            >
              <User className="h-3 w-3 text-[#d3a548]" />
              <span>Voz {speech.gender === "female" ? "Feminina" : "Masculina"}</span>
            </button>

            {/* Mudo / Som */}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundOn ? "Silenciar som" : "Ativar som"}
              aria-pressed={!soundOn}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#121516] text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f1ede5]"
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Alternar detalhes da oficina */}
            <button
              type="button"
              onClick={() => setShowDetails((curr) => !curr)}
              className={cn(
                "hidden sm:inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                showDetails
                  ? "border-[#d3a548] bg-[#d3a548]/15 text-[#f7d46d]"
                  : "border-white/[0.08] bg-[#121516] text-[#a9adae] hover:text-[#f1ede5]"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showDetails ? "Ocultar detalhes" : "Ver detalhes"}</span>
            </button>

            {/* Fechar */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar assistente"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#121516] text-[#a9adae] transition-colors hover:bg-white/[0.08] hover:text-[#f1ede5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Palco Central Imersivo: Esfera Dourada, Saudação e Resumo */}
        <main className="my-auto flex flex-1 flex-col items-center justify-center py-4">
          {/* Indicador de Estado / Subtítulo */}
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                visualState === "error"
                  ? "bg-[#f05a50]"
                  : visualState === "speaking" || visualState === "listening"
                    ? "animate-pulse bg-[#f7d46d]"
                    : "bg-[#d3a548]"
              )}
              aria-hidden="true"
            />
            <span className="text-[12px] font-medium tracking-wide text-[#a9adae]">
              {statusText}
            </span>
          </div>

          {/* Esfera Dourada em Alta Fidelidade */}
          <div className="relative flex w-full max-w-[420px] items-center justify-center py-1">
            <AssistantSphere
              state={visualState}
              levelRef={levelRef}
              reducedMotion={reduceMotion}
              className="aspect-square w-full max-w-[280px] sm:max-w-[340px] md:max-w-[390px] drop-shadow-[0_0_35px_rgba(211,165,72,0.18)]"
            />
          </div>

          {/* Saudação Executiva X-Motion */}
          <div className="mt-2 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold tracking-[0.28em] text-[#d3a548] uppercase">
              X-MOTION
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#f1ede5]">
              {greetingText}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#8a9092]">
              Começamos pelo que precisa de ti.
            </p>
          </div>

          {/* Cartão Executivo: O TEU DIA NA OFICINA */}
          {loading ? (
            <div className="mt-5 flex w-full max-w-xl items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0e1112]/90 p-6 text-xs text-[#a9adae]">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-[#d3a548]" />
              A preparar o resumo do dia da oficina...
            </div>
          ) : briefing ? (
            <div className="mt-4 w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#0c0e10]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-widest text-[#d3a548] uppercase">
                O TEU DIA NA OFICINA
              </span>
              <p className="mt-2 text-[13px] sm:text-[14px] leading-relaxed text-[#eae6dd]">
                {briefing.narration}
              </p>

              {/* Botões rápidos de navegação */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="rounded-full border border-white/[0.08] bg-[#15191a] px-3 py-1 text-[11px] font-medium text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f7d46d]"
                >
                  Agenda ({briefing.agenda.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="rounded-full border border-white/[0.08] bg-[#15191a] px-3 py-1 text-[11px] font-medium text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f7d46d]"
                >
                  Produção ({briefing.activeWorks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="rounded-full border border-white/[0.08] bg-[#15191a] px-3 py-1 text-[11px] font-medium text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f7d46d]"
                >
                  Orçamentos ({briefing.quotes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="rounded-full border border-white/[0.08] bg-[#15191a] px-3 py-1 text-[11px] font-medium text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f7d46d]"
                >
                  Prioridades ({briefing.priorities.length})
                </button>
              </div>
            </div>
          ) : null}

          {/* Mensagem de fala/transcrição instantânea */}
          {dictationText ? (
            <p className="mt-3 rounded-full border border-[#d3a548]/30 bg-[#d3a548]/10 px-4 py-1.5 text-center text-xs text-[#f7d46d]">
              {dictationText}
            </p>
          ) : null}
        </main>

        {/* Rodapé e Barra de Ações Integrada */}
        <footer className="flex flex-col items-center gap-3 border-t border-white/[0.06] pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-2">
            {/* Controlo de reprodução principal: Ouvir / Pausar / Terminar */}
            {speech.speaking || speech.paused ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={speech.paused ? speech.resume : speech.pause}
                  className="min-h-[44px] min-w-[120px] rounded-full border-[#d3a548]/40 bg-[#15191a] text-xs font-semibold text-[#f1ede5] hover:border-[#d3a548]"
                >
                  {speech.paused ? (
                    <>
                      <Play className="mr-1.5 h-4 w-4 text-[#f7d46d]" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Pause className="mr-1.5 h-4 w-4 text-[#d3a548]" />
                      Pausar
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={speech.stop}
                  className="min-h-[44px] min-w-[120px] rounded-full border-white/[0.1] bg-[#15191a] text-xs font-semibold text-[#a9adae] hover:border-[#f05a50]/40 hover:text-[#f0a9a3]"
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" />
                  Terminar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleStartDay}
                disabled={loading || !briefing}
                className="min-h-[44px] rounded-full px-6 text-xs font-semibold shadow-lg shadow-[#d3a548]/20"
              >
                <Play className="mr-1.5 h-4 w-4" />
                {hasMessages ? "Ouvir o resumo" : "Começar o meu dia"}
              </Button>
            )}

            {/* Botão de Microfone com feedback ativo */}
            <button
              type="button"
              onClick={() => void toggleDictation()}
              aria-label={dictation.listening ? "Parar de ouvir" : "Falar com o assistente"}
              aria-pressed={dictation.listening}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                dictation.listening
                  ? "border-[#d3a548] bg-[#d3a548]/25 text-[#f7d46d] shadow-[0_0_15px_rgba(211,165,72,0.4)]"
                  : "border-white/[0.08] bg-[#15191a] text-[#a9adae] hover:border-[#d3a548]/50 hover:text-[#f1ede5]"
              )}
            >
              {dictation.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Alternar detalhes em ecrãs móveis */}
            <button
              type="button"
              onClick={() => setShowDetails((curr) => !curr)}
              className="inline-flex sm:hidden h-11 items-center justify-center rounded-full border border-white/[0.08] bg-[#15191a] px-3 text-xs text-[#a9adae]"
            >
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              {showDetails ? "Ocultar" : "Detalhes"}
            </button>
          </div>

          {/* Campo de Pergunta Rápida por Texto */}
          <div className="flex w-full max-w-xl items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleAsk(input);
                }
              }}
              maxLength={500}
              placeholder="Pergunta sobre a agenda, produção, orçamentos..."
              aria-label="Pergunta para o assistente"
              className="h-11 flex-1 rounded-full border border-white/[0.08] bg-[#121516] px-4 text-xs text-[#f1ede5] outline-none placeholder:text-[#8a9092] focus:border-[#d3a548]"
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void handleAsk(input)}
              disabled={asking || !input.trim()}
              aria-label="Enviar pergunta"
              className="h-11 w-11 shrink-0 rounded-full p-0"
            >
              {asking ? (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Rodapé discreto */}
          <div className="flex w-full max-w-xl items-center justify-between px-2 text-[10px] text-[#63686a]">
            <span>O teu negócio, em movimento.</span>
            <button
              type="button"
              onClick={() => setReduceMotion((curr) => !curr)}
              className="inline-flex items-center gap-1 hover:text-[#a9adae]"
            >
              <Waves className="h-3 w-3" />
              {reduceMotion ? "Retomar movimento" : "Reduzir movimento"}
            </button>
          </div>
        </footer>

        {/* Modal / Painel Deslizante de Detalhes da Oficina & Conversa */}
        {showDetails ? (
          <div className="fixed inset-y-0 right-0 z-20 flex w-full max-w-[480px] flex-col border-l border-white/[0.08] bg-[#0d1011]/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#d3a548]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f1ede5]">
                  Registos da Oficina & Perguntas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a9092] hover:bg-white/[0.06] hover:text-[#f1ede5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Mensagens de Conversa / Perguntas */}
              {hasMessages ? (
                <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d3a548]">
                    Conversa
                  </span>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onNavigate={onClose}
                    />
                  ))}
                  {asking ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#8a9092]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d3a548]" />
                      A consultar a oficina...
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Perguntas Rápidas */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9092]">
                  Sugestões Rápidas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void handleAsk(question)}
                      disabled={asking}
                      className="rounded-full border border-white/[0.08] bg-[#15191a] px-3 py-1.5 text-left text-[11px] text-[#a9adae] transition-colors hover:border-[#d3a548]/40 hover:text-[#f7d46d]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabelas e Listas de Dados */}
              {briefing ? (
                <div className="flex flex-col gap-5">
                  <ItemList
                    title="Prioridades do Dia"
                    icon={ListChecks}
                    items={briefing.priorities}
                    numbered
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Agenda de Hoje"
                    icon={Calendar}
                    items={briefing.agenda}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Trabalhos em Curso"
                    icon={Wrench}
                    items={briefing.activeWorks}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Bloqueios e Peças"
                    icon={CircleAlert}
                    items={briefing.blocked}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Controlo de Qualidade"
                    icon={BadgeCheck}
                    items={briefing.quality}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Prontas para Entrega"
                    icon={Truck}
                    items={briefing.deliveries}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Orçamentos Pendentes"
                    icon={FileText}
                    items={briefing.quotes}
                    onNavigate={onClose}
                  />
                  <ItemList
                    title="Stock Crítico"
                    icon={Package}
                    items={briefing.stock}
                    onNavigate={onClose}
                  />

                  <SourceChips sources={briefing.sources} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
