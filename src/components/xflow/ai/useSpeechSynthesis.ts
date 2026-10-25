"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  assistantVoiceOrDefault,
  DEFAULT_ASSISTANT_VOICE,
  findAssistantVoice,
  type AssistantVoiceGender,
} from "@/domains/assistant/voices";

export type VoiceGender = AssistantVoiceGender;

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: () => void;
  onError?: (message: string) => void;
}

const STORAGE_VOICE_KEY = "xflow_assistant_voice_v3";

/**
 * Divide o texto em blocos naturais de fala, preservando pausas e pontuação
 * para dar uma cadência humana e respiração real.
 */
function splitSpeech(text: string, maxLength = 160): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLength) return [clean];

  const sentences = clean.match(/[^.!?;:]+[.!?;:]*/g) ?? [clean];
  const chunks: string[] = [];

  const push = (value: string): void => {
    const trimmed = value.trim();
    if (trimmed) chunks.push(trimmed);
  };

  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      push(current);
      current = "";
      let piece = "";
      for (const word of sentence.split(" ")) {
        if (`${piece} ${word}`.trim().length > maxLength) {
          push(piece);
          piece = word;
        } else {
          piece = `${piece} ${word}`.trim();
        }
      }
      push(piece);
      continue;
    }
    if (`${current} ${sentence}`.trim().length > maxLength) {
      push(current);
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }
  push(current);
  return chunks;
}

/**
 * Classifica e seleciona a melhor voz neural/natural disponível no sistema
 * de acordo com o género pretendido (feminina ou masculina) e preferência por pt-PT.
 */
function resolveBestVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Filtra vozes em português
  const ptVoices = voices.filter((v) => {
    const lang = v.lang.toLowerCase();
    return lang.startsWith("pt");
  });

  if (ptVoices.length === 0) {
    // Se não houver voz pt, retorna a primeira disponível
    return voices[0] ?? null;
  }

  // Palavras-chave indicativas de voz feminina e masculina
  const femaleKeywords = [
    "raquel",
    "francisca",
    "catarina",
    "joana",
    "maria",
    "leticia",
    "yara",
    "vitória",
    "vitoria",
    "luciana",
    "inês",
    "ines",
    "female",
    "mulher",
  ];
  const maleKeywords = [
    "duarte",
    "antonio",
    "antónio",
    "dinis",
    "jorge",
    "daniel",
    "fabio",
    "fábio",
    "male",
    "homem",
  ];

  const targetKeywords = gender === "female" ? femaleKeywords : maleKeywords;
  const oppositeKeywords = gender === "female" ? maleKeywords : femaleKeywords;

  // Função de pontuação de qualidade
  function scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();

    // Preferência forte por pt-PT sobre pt-BR
    if (lang === "pt-pt") score += 50;
    else if (lang.startsWith("pt")) score += 20;

    // Preferência gigante por vozes neurais / naturais modernas
    if (name.includes("natural") || name.includes("online") || name.includes("neural")) {
      score += 100;
    }

    // Correspondência de género
    const matchesTarget = targetKeywords.some((kw) => name.includes(kw));
    const matchesOpposite = oppositeKeywords.some((kw) => name.includes(kw));

    if (matchesTarget) score += 80;
    if (matchesOpposite) score -= 80;

    return score;
  }

  const sorted = [...ptVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sorted[0] ?? ptVoices[0];
}

function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
      return "O navegador bloqueou a voz. Toca em Ouvir para autorizar o áudio.";
    case "audio-busy":
      return "O dispositivo está a usar o áudio noutra aplicação. Tenta novamente.";
    case "language-unavailable":
    case "voice-unavailable":
      return "Este dispositivo não tem uma voz portuguesa instalada.";
    default:
      return "Não foi possível reproduzir a voz. Podes ler a resposta no ecrã.";
  }
}

export function useSpeechSynthesis(levelRef: RefObject<number>) {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceId, setVoiceIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return assistantVoiceOrDefault(localStorage.getItem(STORAGE_VOICE_KEY)).id;
    }
    return DEFAULT_ASSISTANT_VOICE;
  });
  const [activeVoiceName, setActiveVoiceName] = useState<string>(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const initial = assistantVoiceOrDefault(
        localStorage.getItem(STORAGE_VOICE_KEY)
      );
      const browserVoice = resolveBestVoice(initial.gender);
      return browserVoice?.name ?? "";
    }
    return "";
  });
  const voice = assistantVoiceOrDefault(voiceId);
  const gender = voice.gender;
  const sessionRef = useRef(0);

  // Subscreve a atualizações do catálogo de vozes do navegador
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoiceInfo = () => {
      const current = assistantVoiceOrDefault(
        localStorage.getItem(STORAGE_VOICE_KEY)
      );
      const browserVoice = resolveBestVoice(current.gender);
      if (browserVoice) setActiveVoiceName(browserVoice.name);
    };

    window.speechSynthesis.addEventListener("voiceschanged", updateVoiceInfo);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoiceInfo);
    };
  }, []);

  const setVoice = useCallback((id: string) => {
    const next = findAssistantVoice(id) ?? assistantVoiceOrDefault(null);
    setVoiceIdState(next.id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_VOICE_KEY, next.id);
    }
    const browserVoice = resolveBestVoice(next.gender);
    if (browserVoice) setActiveVoiceName(browserVoice.name);
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    levelRef.current = 0;
    setSpeaking(false);
    setPaused(false);
  }, [levelRef]);

  const pause = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (!window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    levelRef.current = 0;
    setPaused(true);
  }, [levelRef]);

  const resume = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (!window.speechSynthesis.paused) return;
    window.speechSynthesis.resume();
    levelRef.current = 0.75;
    setPaused(false);
  }, [levelRef]);

  const speak = useCallback(
    (text: string, callbacks: SpeechCallbacks = {}) => {
      if (!("speechSynthesis" in window)) {
        callbacks.onError?.("Este navegador não suporta leitura por voz.");
        return;
      }

      const synth = window.speechSynthesis;
      const chunks = splitSpeech(text);
      sessionRef.current += 1;
      const session = sessionRef.current;
      synth.cancel();
      levelRef.current = 0;

      if (chunks.length === 0) {
        callbacks.onEnd?.();
        return;
      }

      setSpeaking(true);
      setPaused(false);

      const voice = resolveBestVoice(gender);
      if (voice) setActiveVoiceName(voice.name);

      let index = 0;
      let boundaryTick = 0;

      const run = (): void => {
        if (session !== sessionRef.current) return;
        if (index >= chunks.length) {
          setSpeaking(false);
          setPaused(false);
          levelRef.current = 0;
          callbacks.onEnd?.();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = voice?.lang || "pt-PT";

        // Ajuste de cadência para maior humanidade e fluidez
        if (gender === "female") {
          utterance.rate = 1.01;
          utterance.pitch = 1.02;
        } else {
          utterance.rate = 0.98;
          utterance.pitch = 0.95;
        }

        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          if (session !== sessionRef.current) return;
          levelRef.current = 0.85;
          if (index === 0) callbacks.onStart?.();
        };

        utterance.onboundary = () => {
          if (session !== sessionRef.current) return;
          boundaryTick += 1;
          // Modula o nível de energia dinamicamente ao ritmo das palavras
          levelRef.current = 0.6 + (boundaryTick % 4) * 0.12;
          callbacks.onBoundary?.();
        };

        utterance.onend = () => {
          if (session !== sessionRef.current) return;
          index += 1;
          // Pausa suave de respiração humana entre orações (140ms)
          window.setTimeout(() => {
            if (session === sessionRef.current) run();
          }, 140);
        };

        utterance.onerror = (event) => {
          if (session !== sessionRef.current) return;
          if (event.error === "canceled" || event.error === "interrupted") return;
          setSpeaking(false);
          setPaused(false);
          levelRef.current = 0;
          callbacks.onError?.(speechErrorMessage(event.error));
        };

        synth.speak(utterance);
      };

      run();
    },
    [levelRef, gender]
  );

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    supported,
    speaking,
    paused,
    gender,
    voice,
    voiceId: voice.id,
    activeVoiceName,
    setVoice,
    speak,
    pause,
    resume,
    stop,
  };
}
