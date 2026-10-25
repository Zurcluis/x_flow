"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

export type MicLevelResult = "ok" | "unsupported" | "denied" | "error";

export function useMicLevel(levelRef: RefObject<number>) {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (contextRef.current && contextRef.current.state !== "closed") {
      contextRef.current.close().catch(() => undefined);
      contextRef.current = null;
    }
    levelRef.current = 0;
  }, [levelRef]);

  const start = useCallback(async (): Promise<MicLevelResult> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }

    stop();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") return "denied";
      return "error";
    }

    streamRef.current = stream;

    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return "ok";

    try {
      const context = new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);
      const tick = (): void => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const value = (buffer[index] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / buffer.length);
        levelRef.current = Math.min(1, rms * 5);
        frameRef.current = window.requestAnimationFrame(tick);
      };
      tick();
      return "ok";
    } catch {
      return "ok";
    }
  }, [levelRef, stop]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}
