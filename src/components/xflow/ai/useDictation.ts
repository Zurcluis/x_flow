"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
  length: number;
}

interface RecognitionResultList {
  length: number;
  [index: number]: RecognitionResult;
}

interface RecognitionEvent {
  resultIndex: number;
  results: RecognitionResultList;
}

interface RecognitionErrorEvent {
  error: string;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionLike;

export interface DictationCallbacks {
  onPartial?: (text: string) => void;
  onResult?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

function dictationErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "O microfone está bloqueado. Autoriza o microfone no navegador ou escreve a pergunta.";
    case "no-speech":
      return "Não ouvi nada. Tenta outra vez.";
    case "audio-capture":
      return "Não encontrei um microfone disponível.";
    case "network":
      return "O ditado precisa de ligação à Internet neste navegador.";
    default:
      return "Não consegui transcrever. Tenta outra vez ou escreve a pergunta.";
  }
}

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const globalWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition ?? null;
}

export function useDictation() {
  const [Constructor] = useState<RecognitionConstructor | null>(getRecognitionConstructor);
  const supported = Constructor !== null;
  const [listening, setListening] = useState(false);
  // Verdadeiro entre o fim da fala (ou o pedido de parar) e o resultado final.
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const sessionRef = useRef(0);

  const abort = useCallback(() => {
    sessionRef.current += 1;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onspeechend = null;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    }
    setListening(false);
    setTranscribing(false);
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      setTranscribing(true);
      recognition.stop();
    } catch {
      setListening(false);
      setTranscribing(false);
    }
  }, []);

  const start = useCallback(
    (callbacks: DictationCallbacks = {}): boolean => {
      if (!Constructor) {
        callbacks.onError?.(
          "Este navegador não suporta ditado. Escreve a pergunta em vez de falar."
        );
        return false;
      }

      abort();
      sessionRef.current += 1;
      const session = sessionRef.current;

      const recognition = new Constructor();
      recognitionRef.current = recognition;
      recognition.lang = "pt-PT";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = "";

      recognition.onresult = (event) => {
        if (session !== sessionRef.current) return;
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript ?? "";
          if (result.isFinal) {
            finalText = `${finalText} ${transcript}`.trim();
          } else {
            interim = `${interim} ${transcript}`.trim();
          }
        }
        const combined = `${finalText} ${interim}`.trim();
        if (combined) callbacks.onPartial?.(combined);
      };

      recognition.onspeechend = () => {
        if (session !== sessionRef.current) return;
        setTranscribing(true);
      };

      recognition.onerror = (event) => {
        if (session !== sessionRef.current) return;
        if (event.error === "aborted") return;
        setListening(false);
        setTranscribing(false);
        callbacks.onError?.(dictationErrorMessage(event.error));
      };

      recognition.onend = () => {
        if (session !== sessionRef.current) return;
        setListening(false);
        setTranscribing(false);
        callbacks.onEnd?.();
        if (finalText.trim()) callbacks.onResult?.(finalText.trim());
      };

      try {
        recognition.start();
        setListening(true);
        setTranscribing(false);
        return true;
      } catch {
        setListening(false);
        setTranscribing(false);
        callbacks.onError?.(
          "Não consegui iniciar o microfone. Tenta novamente ou escreve a pergunta."
        );
        return false;
      }
    },
    [abort, Constructor]
  );

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { supported, listening, transcribing, start, stop, abort };
}
