"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { downsamplePcm, encodeWavBlob } from "@/lib/wav";

export type VoiceRecorderResult = "ok" | "denied" | "unsupported" | "error";

const TARGET_SAMPLE_RATE = 16000;
const MAX_DURATION_MS = 30_000;

interface RecorderCallbacks {
  onAutoStop?: (blob: Blob) => void;
}

function concatChunks(chunks: Float32Array[]): Float32Array {
  let length = 0;
  for (const chunk of chunks) length += chunk.length;

  const combined = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined;
}

export function useVoiceRecorder(levelRef: RefObject<number>) {
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    const contextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    return Boolean(navigator.mediaDevices && contextClass);
  });
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(TARGET_SAMPLE_RATE);
  const totalSamplesRef = useRef(0);
  const sessionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const callbacksRef = useRef<RecorderCallbacks>({});

  const teardown = useCallback(
    (returnBlob: boolean): Blob | null => {
      sessionRef.current += 1;

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (processorRef.current) {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      sourceRef.current?.disconnect();
      sourceRef.current = null;
      gainRef.current?.disconnect();
      gainRef.current = null;

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }

      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close().catch(() => undefined);
      }
      contextRef.current = null;

      levelRef.current = 0;
      setRecording(false);
      setRequesting(false);

      if (!returnBlob) {
        chunksRef.current = [];
        totalSamplesRef.current = 0;
        return null;
      }

      const chunks = chunksRef.current;
      const sampleRate = sampleRateRef.current;
      chunksRef.current = [];
      totalSamplesRef.current = 0;

      if (chunks.length === 0) return null;
      const combined = concatChunks(chunks);
      const resampled = downsamplePcm(combined, sampleRate, TARGET_SAMPLE_RATE);
      return encodeWavBlob(resampled, TARGET_SAMPLE_RATE);
    },
    [levelRef]
  );

  const cancel = useCallback(() => {
    teardown(false);
  }, [teardown]);

  const stop = useCallback(() => teardown(true), [teardown]);

  const start = useCallback(
    async (callbacks: RecorderCallbacks = {}): Promise<VoiceRecorderResult> => {
      if (!supported) return "unsupported";
      if (recording) return "ok";

      callbacksRef.current = callbacks;
      teardown(false);
      sessionRef.current += 1;
      const session = sessionRef.current;

      setRequesting(true);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: TARGET_SAMPLE_RATE,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (error) {
        if (session !== sessionRef.current) return "error";
        setRequesting(false);
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") return "denied";
        return "error";
      }

      if (session !== sessionRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return "error";
      }

      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        for (const track of stream.getTracks()) track.stop();
        setRequesting(false);
        return "unsupported";
      }

      try {
        const context = new AudioContextClass();
        contextRef.current = context;
        if (context.state === "suspended") await context.resume();
        sampleRateRef.current = context.sampleRate;
        streamRef.current = stream;
        chunksRef.current = [];
        totalSamplesRef.current = 0;

        const source = context.createMediaStreamSource(stream);
        sourceRef.current = source;

        const gain = context.createGain();
        gain.gain.value = 0;
        gainRef.current = gain;
        gain.connect(context.destination);

        const processor = context.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (session !== sessionRef.current) return;

          const input = event.inputBuffer;
          const channels = Math.max(1, input.numberOfChannels);
          const length = input.length;
          const chunk = new Float32Array(length);

          if (channels === 1) {
            chunk.set(input.getChannelData(0));
          } else {
            for (let channel = 0; channel < channels; channel += 1) {
              const data = input.getChannelData(channel);
              for (let index = 0; index < length; index += 1) {
                chunk[index] += data[index] / channels;
              }
            }
          }

          let sum = 0;
          for (let index = 0; index < length; index += 1) {
            sum += chunk[index] * chunk[index];
          }
          const rms = Math.sqrt(sum / length);
          const smoothed = levelRef.current * 0.7 + Math.min(1, rms * 6) * 0.3;
          levelRef.current = smoothed;

          chunksRef.current.push(chunk);
          totalSamplesRef.current += length;

          if (
            totalSamplesRef.current / sampleRateRef.current >=
            MAX_DURATION_MS / 1000
          ) {
            const blob = teardown(true);
            if (blob) callbacksRef.current.onAutoStop?.(blob);
          }
        };

        source.connect(processor);
        processor.connect(gain);
        setRequesting(false);
        setRecording(true);

        timerRef.current = window.setTimeout(() => {
          if (session !== sessionRef.current) return;
          const blob = teardown(true);
          if (blob) callbacksRef.current.onAutoStop?.(blob);
        }, MAX_DURATION_MS + 500);

        return "ok";
      } catch {
        teardown(false);
        return "error";
      }
    },
    [levelRef, recording, supported, teardown]
  );

  useEffect(() => {
    return () => {
      teardown(false);
    };
  }, [teardown]);

  return { supported, recording, requesting, start, stop, cancel };
}
