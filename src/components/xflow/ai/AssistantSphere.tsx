"use client";

import React, { useEffect, useRef } from "react";

export type AssistantVisualState =
  | "idle"
  | "requesting-mic"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "paused"
  | "error";

interface AssistantSphereProps {
  state: AssistantVisualState;
  /** Nível de áudio real (0–1): microfone ao ouvir, eventos da voz ao falar. */
  levelRef: React.RefObject<number>;
  /** Intensidade da luz. Referência do plano: 0.65. */
  intensity?: number;
  reducedMotion?: boolean;
  className?: string;
}

type Rgb = readonly [number, number, number];

const GOLD: Rgb = [211, 165, 72];
const GOLD_LIGHT: Rgb = [240, 202, 118];
const BRIGHT: Rgb = [255, 246, 222];
const COPPER: Rgb = [190, 92, 72];
const COPPER_LIGHT: Rgb = [226, 138, 110];
const COPPER_BRIGHT: Rgb = [250, 214, 200];
const TAU = Math.PI * 2;
const REFERENCE_INTENSITY = 0.65;

/** Parâmetros visuais interpolados entre estados (evita saltos e flashes). */
interface Motion {
  energy: number; // amplitude das ondas internas
  ring: number; // velocidade dos anéis
  orbit: number; // velocidade da órbita/satélite
  glow: number; // brilho do núcleo
  tempo: number; // escala temporal global (pausa = movimento reduzido)
  busy: number; // arcos de processamento
  waiting: number; // indicação de espera pela escolha do utilizador
  error: number; // mistura para a cor de erro
}

const MOTION_KEYS: ReadonlyArray<keyof Motion> = [
  "energy",
  "ring",
  "orbit",
  "glow",
  "tempo",
  "busy",
  "waiting",
  "error",
];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function mix(a: Rgb, b: Rgb, t: number): string {
  const k = clamp(t);
  return `${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(
    a[1] + (b[1] - a[1]) * k
  )}, ${Math.round(a[2] + (b[2] - a[2]) * k)}`;
}

function rgba(color: string, alpha: number): string {
  return `rgba(${color}, ${clamp(alpha).toFixed(3)})`;
}

/**
 * Alvo visual de cada estado real. Só o nível de áudio (`level`) e o relógio
 * da pulsação discreta entram aqui: não há temporizadores a simular escuta.
 */
function targetsFor(state: AssistantVisualState, level: number, clock: number): Motion {
  const breath = 0.5 + 0.5 * Math.sin(clock * 0.9);
  switch (state) {
    case "requesting-mic":
      return { energy: 0.08, ring: 0.12, orbit: 0.06, glow: 0.62, tempo: 1, busy: 0, waiting: 1, error: 0 };
    case "listening":
      return {
        energy: 0.1 + level * 0.9,
        ring: 0.18,
        orbit: 0.1,
        glow: 0.78 + level * 0.3,
        tempo: 1,
        busy: 0,
        waiting: 0,
        error: 0,
      };
    case "transcribing":
      return { energy: 0.07, ring: 0.45, orbit: 0.22, glow: 0.8, tempo: 1, busy: 0.45, waiting: 0, error: 0 };
    case "thinking":
      return { energy: 0.05, ring: 2.2, orbit: 1.4, glow: 0.84, tempo: 1, busy: 1, waiting: 0, error: 0 };
    case "speaking":
      return {
        energy: 0.2 + level * 0.8,
        ring: 0.4,
        orbit: 0.32,
        glow: 0.88 + level * 0.25,
        tempo: 1,
        busy: 0,
        waiting: 0,
        error: 0,
      };
    case "paused":
      return { energy: 0.1, ring: 0.04, orbit: 0.03, glow: 0.58, tempo: 0.15, busy: 0, waiting: 0, error: 0 };
    case "error":
      return { energy: 0.05, ring: 0, orbit: 0, glow: 0.5, tempo: 0.5, busy: 0, waiting: 0, error: 1 };
    case "idle":
    default:
      return {
        energy: 0.12 + breath * 0.05,
        ring: 0.25,
        orbit: 0.14,
        glow: 0.72 + breath * 0.08,
        tempo: 1,
        busy: 0,
        waiting: 0,
        error: 0,
      };
  }
}

export function AssistantSphere({
  state,
  levelRef,
  intensity = REFERENCE_INTENSITY,
  reducedMotion = false,
  className,
}: AssistantSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AssistantVisualState>(state);
  const intensityRef = useRef(intensity);
  const redrawRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    stateRef.current = state;
    intensityRef.current = intensity;
    redrawRef.current();
  }, [state, intensity]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const context = canvasElement.getContext("2d");
    if (!context) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const shouldReduce = reducedMotion;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTimestamp = 0;
    let stopped = false;

    let clock = 0;
    let level = 0;
    let wavePhase = 0;
    let ringAngle = 0;
    let orbitAngle = 0.95;
    const motion: Motion = targetsFor(stateRef.current, 0, 0);

    function strokeCircle(radius: number, color: string, lineWidth: number): void {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
    }

    function drawSatellite(
      x: number,
      y: number,
      depth: number,
      R: number,
      tint: string,
      base: string,
      bright: string,
      strength: number
    ): void {
      const front = (depth + 1) / 2;
      const radius = R * 0.026 * (0.8 + 0.25 * front);
      const alpha = 0.45 + 0.55 * front;

      const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.5);
      halo.addColorStop(0, rgba(tint, 0.42 * alpha * strength));
      halo.addColorStop(1, rgba(base, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4.5, 0, TAU);
      ctx.fill();

      const body = ctx.createRadialGradient(
        x - radius * 0.35,
        y - radius * 0.35,
        radius * 0.1,
        x,
        y,
        radius
      );
      body.addColorStop(0, rgba(bright, alpha));
      body.addColorStop(0.55, rgba(tint, alpha));
      body.addColorStop(1, rgba(base, alpha * 0.9));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }

    function draw(): void {
      if (width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.46;
      const m = motion;

      const tint = mix(GOLD_LIGHT, COPPER_LIGHT, m.error);
      const base = mix(GOLD, COPPER, m.error);
      const bright = mix(BRIGHT, COPPER_BRIGHT, m.error);
      const strength = clamp(intensityRef.current, 0.2, 1) / REFERENCE_INTENSITY;
      const light = clamp(strength * m.glow, 0, 1.4);

      // Halo ambiente, muito ténue, para integrar a esfera no fundo escuro.
      const ambient = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.18);
      ambient.addColorStop(0, rgba(base, 0.1 * light));
      ambient.addColorStop(0.6, rgba(base, 0.035 * light));
      ambient.addColorStop(1, rgba(base, 0));
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);

      // Anel exterior fino e arcos parciais.
      strokeCircle(R * 0.97, rgba(tint, 0.14), 1);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rgba(tint, 0.55);
      for (const [start, end] of [
        [-1.38, -0.18],
        [1.76, 2.96],
      ] as const) {
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.97, start + ringAngle * 0.6, end + ringAngle * 0.6);
        ctx.stroke();
      }

      // Marcadores cardeais. Ao aguardar a autorização do microfone, respiram
      // suavemente (sem piscar) como indicação de que falta a escolha do utilizador.
      const waitPulse = 1 - m.waiting * 0.5 * (0.5 + 0.5 * Math.cos(clock * 2.2));
      ctx.fillStyle = rgba(tint, 0.78 * waitPulse);
      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * TAU - Math.PI / 2;
        const px = Math.cos(angle) * R * 1.03;
        const py = Math.sin(angle) * R * 1.03;
        ctx.beginPath();
        if (index % 2 === 0) {
          const s = R * 0.016;
          ctx.moveTo(px, py - s);
          ctx.lineTo(px + s * 0.7, py);
          ctx.lineTo(px, py + s);
          ctx.lineTo(px - s * 0.7, py);
          ctx.closePath();
        } else {
          ctx.arc(px, py, R * 0.009, 0, TAU);
        }
        ctx.fill();
      }

      // Luneta graduada.
      const bezelInner = R * 0.77;
      const bezelOuter = R * 0.87;
      strokeCircle(bezelOuter, rgba(tint, 0.2), 1);
      strokeCircle(bezelInner, rgba(tint, 0.5), 1.2);
      const tickCount = 120;
      const span = bezelOuter - bezelInner;
      const tickClasses = [
        { path: new Path2D(), alpha: 0.62, width: 1.3 },
        { path: new Path2D(), alpha: 0.38, width: 1 },
        { path: new Path2D(), alpha: 0.2, width: 1 },
      ];
      for (let index = 0; index < tickCount; index += 1) {
        const angle = (index / tickCount) * TAU + ringAngle;
        const cls = index % 10 === 0 ? 0 : index % 5 === 0 ? 1 : 2;
        const length = span * (cls === 0 ? 0.72 : cls === 1 ? 0.5 : 0.3);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const startR = bezelInner + span * 0.08;
        tickClasses[cls].path.moveTo(cos * startR, sin * startR);
        tickClasses[cls].path.lineTo(cos * (startR + length), sin * (startR + length));
      }
      for (const tick of tickClasses) {
        ctx.strokeStyle = rgba(tint, tick.alpha);
        ctx.lineWidth = tick.width;
        ctx.stroke(tick.path);
      }

      // Arcos de processamento (a consultar / a transcrever).
      if (m.busy > 0.01) {
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for (let arc = 0; arc < 2; arc += 1) {
          const start = ringAngle * (2.4 + arc * 0.9) + arc * Math.PI;
          ctx.beginPath();
          ctx.strokeStyle = rgba(bright, m.busy * (0.55 - arc * 0.2));
          ctx.arc(0, 0, R * 0.82, start, start + Math.PI * 0.32);
          ctx.stroke();
        }
        ctx.lineCap = "butt";
      }

      // Disco interior.
      const discRadius = R * 0.74;
      ctx.beginPath();
      ctx.fillStyle = "rgba(7, 7, 6, 0.92)";
      ctx.arc(0, 0, discRadius, 0, TAU);
      ctx.fill();
      strokeCircle(discRadius, rgba(tint, 0.42), 1);
      strokeCircle(R * 0.7, rgba(tint, 0.07), 1);

      ctx.globalCompositeOperation = "lighter";

      // Brilho volumétrico do núcleo.
      const volume = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.64);
      volume.addColorStop(0, rgba(bright, 0.5 * light));
      volume.addColorStop(0.2, rgba(tint, 0.32 * light));
      volume.addColorStop(0.55, rgba(base, 0.1 * light));
      volume.addColorStop(1, rgba(base, 0));
      ctx.fillStyle = volume;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.64, 0, TAU);
      ctx.fill();

      // Órbita inclinada.
      const rx = R * 0.64;
      const ry = R * 0.17;
      const tilt = -0.38;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.strokeStyle = rgba(tint, 0.12);
      ctx.ellipse(0, 0, rx, ry, tilt, Math.PI, TAU);
      ctx.stroke();

      const sinO = Math.sin(orbitAngle);
      const cosO = Math.cos(orbitAngle);
      const ex = rx * cosO;
      const ey = ry * sinO;
      const satX = ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const satY = ex * Math.sin(tilt) + ey * Math.cos(tilt);
      const depth = sinO;
      if (depth < 0) drawSatellite(satX, satY, depth, R, tint, base, bright, strength);

      // Ondas internas: fuso de filamentos entrelaçados.
      const half = R * 0.7;
      const hairline = ctx.createLinearGradient(-discRadius, 0, discRadius, 0);
      hairline.addColorStop(0, rgba(tint, 0.18));
      hairline.addColorStop(0.5, rgba(bright, 0.75));
      hairline.addColorStop(1, rgba(tint, 0.18));
      ctx.beginPath();
      ctx.strokeStyle = hairline;
      ctx.lineWidth = 1;
      ctx.moveTo(-discRadius, 0);
      ctx.lineTo(discRadius, 0);
      ctx.stroke();

      const glowStroke = ctx.createLinearGradient(-half, 0, half, 0);
      glowStroke.addColorStop(0, rgba(tint, 0));
      glowStroke.addColorStop(0.5, rgba(tint, 0.16));
      glowStroke.addColorStop(1, rgba(tint, 0));
      const coreStroke = ctx.createLinearGradient(-half, 0, half, 0);
      coreStroke.addColorStop(0, rgba(tint, 0.15));
      coreStroke.addColorStop(0.3, rgba(tint, 0.85));
      coreStroke.addColorStop(0.5, rgba(bright, 1));
      coreStroke.addColorStop(0.7, rgba(tint, 0.85));
      coreStroke.addColorStop(1, rgba(tint, 0.15));

      const amp = R * (0.04 + m.energy * 0.24);
      const strands = 9;
      const points = 96;
      for (let strand = 0; strand < strands; strand += 1) {
        const offset = (strand / strands) * TAU;
        const freq = 2.1 + (strand % 3) * 0.18;
        const drift = wavePhase * (1 + (strand % 2 === 0 ? 0.16 : -0.12));
        const path = new Path2D();
        for (let index = 0; index <= points; index += 1) {
          const nx = (index / points) * 2 - 1;
          const envelope =
            Math.pow(Math.max(0, 1 - nx * nx), 1.8) *
            (0.45 + 0.55 * Math.exp(-nx * nx * 5));
          const y =
            amp * envelope * Math.sin(offset + nx * freq * Math.PI - drift) +
            amp * 0.18 * envelope * Math.sin(nx * freq * 2.3 * Math.PI + drift * 1.3 + offset);
          const x = nx * half;
          if (index === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        const strandAlpha = (1 - (strand / strands) * 0.55) * (0.6 + 0.4 * clamp(m.glow));
        ctx.globalAlpha = strandAlpha;
        ctx.strokeStyle = glowStroke;
        ctx.lineWidth = 3.2;
        ctx.stroke(path);
        ctx.strokeStyle = coreStroke;
        ctx.lineWidth = strand === 0 ? 1.3 : 0.9;
        ctx.stroke(path);
      }
      ctx.globalAlpha = 1;

      // Reflexo horizontal e ponto nuclear.
      ctx.save();
      ctx.scale(1, 0.14);
      const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.55);
      flare.addColorStop(0, rgba(bright, 0.32 * light));
      flare.addColorStop(1, rgba(bright, 0));
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.55, 0, TAU);
      ctx.fill();
      ctx.restore();

      const coreRadius = R * 0.13;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
      core.addColorStop(0, `rgba(255, 255, 250, ${clamp(0.95 * light).toFixed(3)})`);
      core.addColorStop(0.18, rgba(bright, 0.55 * light));
      core.addColorStop(0.6, rgba(tint, 0.12 * light));
      core.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, TAU);
      ctx.fill();

      // Metade frontal da órbita e satélite à frente das ondas.
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.strokeStyle = rgba(tint, 0.3);
      ctx.ellipse(0, 0, rx, ry, tilt, 0, Math.PI);
      ctx.stroke();
      if (depth >= 0) drawSatellite(satX, satY, depth, R, tint, base, bright, strength);

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    function step(dt: number): void {
      const currentState = stateRef.current;
      clock += dt * motion.tempo;

      const raw = clamp(levelRef.current ?? 0);
      level += (raw - level) * (1 - Math.exp(-dt * 14));

      const target = targetsFor(currentState, level, clock);
      const ease = 1 - Math.exp(-dt * 3.2);
      for (const key of MOTION_KEYS) {
        motion[key] += (target[key] - motion[key]) * ease;
      }

      wavePhase += dt * (0.6 + motion.energy * 2.4) * motion.tempo;
      ringAngle += dt * motion.ring * 0.1;
      orbitAngle += dt * motion.orbit * 0.5;

      // O nível da voz chega por eventos pontuais; decai entre eventos.
      if (currentState !== "listening" && levelRef.current > 0) {
        levelRef.current = Math.max(0, levelRef.current - dt * 2.6);
      }
    }

    function renderStatic(): void {
      const target = targetsFor(stateRef.current, 0, 0);
      for (const key of MOTION_KEYS) motion[key] = target[key];
      draw();
    }

    function loop(timestamp: number): void {
      if (stopped) return;
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;
      step(dt);
      draw();
      frame = window.requestAnimationFrame(loop);
    }

    function start(): void {
      if (stopped) return;
      if (shouldReduce) {
        renderStatic();
        return;
      }
      if (frame === 0) frame = window.requestAnimationFrame(loop);
    }

    function stop(): void {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      lastTimestamp = 0;
    }

    function resize(): void {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (shouldReduce) renderStatic();
      else draw();
    }

    function handleVisibility(): void {
      if (document.hidden) stop();
      else start();
    }

    redrawRef.current = () => {
      if (shouldReduce) renderStatic();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      stop();
      redrawRef.current = () => undefined;
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion, levelRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      role="presentation"
    />
  );
}
