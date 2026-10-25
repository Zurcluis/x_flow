"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

export interface AssistantSpeakOptions {
  kind?: "briefing" | "answer" | "sample";
  token?: string;
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export function useAssistantSpeech(levelRef: RefObject<number>) {
  const browser = useSpeechSynthesis(levelRef);
  const [serverSpeaking, setServerSpeaking] = useState(false);
  const [serverPaused, setServerPaused] = useState(false);
  const [usingServer, setUsingServer] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);
  const serverDisabledRef = useRef(false);
  const serverRetryAtRef = useRef(0);

  const clearAnalyser = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (contextRef.current && contextRef.current.state !== "closed") {
      contextRef.current.close().catch(() => undefined);
    }
    contextRef.current = null;
  }, []);

  const clearServerAudio = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.onplay = null;
      audio.onplaying = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }

    clearAnalyser();
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    levelRef.current = 0;
    setServerSpeaking(false);
    setServerPaused(false);
    setPreparing(false);
  }, [clearAnalyser, levelRef]);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    clearServerAudio();
    setUsingServer(false);
    browser.stop();
  }, [browser, clearServerAudio]);

  const playServerAudio = useCallback(
    async (
      blob: Blob,
      session: number,
      options: AssistantSpeakOptions
    ): Promise<void> => {
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audio.preload = "auto";
      audioRef.current = audio;

      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (AudioContextClass) {
        try {
          const context = new AudioContextClass();
          contextRef.current = context;
          if (context.state === "suspended") await context.resume();

          const source = context.createMediaElementSource(audio);
          sourceRef.current = source;
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.6;
          analyserRef.current = analyser;
          source.connect(analyser);
          analyser.connect(context.destination);
        } catch {
          clearAnalyser();
        }
      }

      const tick = (): void => {
        if (session !== sessionRef.current) return;
        const analyser = analyserRef.current;
        if (!analyser) return;
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let index = 0; index < data.length; index += 1) {
          const value = (data[index] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        levelRef.current = Math.min(1, rms * 5);
        frameRef.current = window.requestAnimationFrame(tick);
      };

      audio.onplay = () => {
        if (session !== sessionRef.current) return;
        setUsingServer(true);
        setServerSpeaking(true);
        setServerPaused(false);
        setPreparing(false);
        tick();
        options.onStart?.();
      };

      audio.onpause = () => {
        if (session !== sessionRef.current) return;
        levelRef.current = 0;
        setServerPaused(true);
      };

      audio.onplaying = () => {
        if (session !== sessionRef.current) return;
        setServerPaused(false);
      };

      audio.onended = () => {
        if (session !== sessionRef.current) return;
        clearServerAudio();
        options.onEnd?.();
      };

      audio.onerror = () => {
        if (session !== sessionRef.current) return;
        clearServerAudio();
        options.onError?.("Não consegui reproduzir a voz da IA.");
      };

      await audio.play();
    },
    [clearAnalyser, clearServerAudio, levelRef]
  );

  const speak = useCallback(
    async (text: string, options: AssistantSpeakOptions = {}) => {
      sessionRef.current += 1;
      const session = sessionRef.current;
      clearServerAudio();
      browser.stop();

      const wantsServer =
        Boolean(options.kind || options.token) &&
        !serverDisabledRef.current &&
        Date.now() >= serverRetryAtRef.current;
      if (wantsServer) {
        setPreparing(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const response = await fetch("/api/assistant/speech", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              kind: options.kind ?? "answer",
              token: options.token,
              voice: options.voice ?? browser.voiceId,
            }),
            signal: controller.signal,
            cache: "no-store",
          });

          if (session !== sessionRef.current) return;

          if (response.status === 503) {
            serverDisabledRef.current = true;
          } else if (response.status === 429) {
            serverRetryAtRef.current = Date.now() + 60_000;
            options.onError?.(
              "A voz neural está no limite agora. A usar a voz do dispositivo."
            );
          } else if (!response.ok) {
            if (response.status === 403) {
              setPreparing(false);
              options.onError?.("A resposta expirou. Pede novamente ao assistente.");
              return;
            }
            serverRetryAtRef.current = Date.now() + 30_000;
          } else {
            const blob = await response.blob();
            if (session !== sessionRef.current) return;
            if (blob.size > 0) {
              try {
                await playServerAudio(blob, session, options);
                return;
              } catch {
                if (session !== sessionRef.current) return;
                clearServerAudio();
                serverRetryAtRef.current = Date.now() + 30_000;
              }
            }
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          serverRetryAtRef.current = Date.now() + 30_000;
        }
      }

      setPreparing(false);
      if (session !== sessionRef.current) return;
      if (!browser.supported) {
        options.onError?.("Este navegador não suporta leitura por voz. O texto está no ecrã.");
        return;
      }

      setUsingServer(false);
      browser.speak(text, {
        onStart: options.onStart,
        onEnd: options.onEnd,
        onError: options.onError,
      });
    },
    [browser, clearServerAudio, playServerAudio]
  );

  const pause = useCallback(() => {
    if (usingServer) {
      audioRef.current?.pause();
      levelRef.current = 0;
      setServerPaused(true);
      return;
    }
    browser.pause();
  }, [browser, levelRef, usingServer]);

  const resume = useCallback(() => {
    if (usingServer) {
      audioRef.current
        ?.play()
        .then(() => setServerPaused(false))
        .catch(() => undefined);
      return;
    }
    browser.resume();
  }, [browser, usingServer]);

  const setVoice = useCallback(
    (id: string) => {
      browser.setVoice(id);
    },
    [browser]
  );

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      clearServerAudio();
    };
  }, [clearServerAudio]);

  const speaking = usingServer ? serverSpeaking : browser.speaking;
  const paused = usingServer ? serverPaused : browser.paused;
  const activeVoiceName = usingServer
    ? `Gemini · ${browser.voice.label}`
    : browser.activeVoiceName;

  return {
    supported: true,
    speaking,
    paused,
    preparing,
    gender: browser.gender,
    voice: browser.voice,
    voiceId: browser.voiceId,
    activeVoiceName,
    setVoice,
    speak,
    pause,
    resume,
    stop,
  };
}
