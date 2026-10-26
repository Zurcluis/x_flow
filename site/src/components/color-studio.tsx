"use client";

import { ArrowUpRight, Check, MoveHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

const views = [
  { src: "/images/studio-0.webp", label: "Três quartos", alt: "vista três quartos" },
  { src: "/images/studio-1.webp", label: "Frente", alt: "vista frente" },
  { src: "/images/studio-2.webp", label: "Lateral", alt: "vista lateral" },
  { src: "/images/studio-3.webp", label: "Traseira", alt: "vista traseira" },
];

const colors = [
  {
    name: "Azul profundo",
    hex: "#1e3c69",
    filter: "hue-rotate(195deg) saturate(.9) contrast(1.05)",
  },
  {
    name: "Verde petróleo",
    hex: "#24524b",
    filter: "hue-rotate(-55deg) saturate(.65) contrast(1.06)",
  },
  {
    name: "Bordeaux",
    hex: "#6c2a3d",
    filter: "hue-rotate(130deg) saturate(.8) contrast(1.05)",
  },
  {
    name: "Grafite",
    hex: "#505254",
    filter: "grayscale(1) brightness(.82) contrast(1.08)",
  },
  {
    name: "Prata",
    hex: "#bec1c3",
    filter: "grayscale(1) brightness(1.35) contrast(.95)",
  },
];

const finishes = [
  { name: "Brilho", filter: "contrast(1.06)" },
  { name: "Acetinado", filter: "saturate(.9) brightness(1.02)" },
  { name: "Mate", filter: "saturate(.65) brightness(.94) contrast(.96)" },
];

type ColorStudioProps = {
  showHeading?: boolean;
};

export function ColorStudio({ showHeading = true }: ColorStudioProps) {
  const [viewIndex, setViewIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(1);
  const [finishIndex, setFinishIndex] = useState(0);
  const [compare, setCompare] = useState(50);

  const activeView = views[viewIndex];
  const activeColor = colors[colorIndex];
  const activeFinish = finishes[finishIndex];
  const filter = `${activeColor.filter} ${activeFinish.filter}`;
  const originalClip = `inset(0 ${100 - compare}% 0 0)`;

  return (
    <section id="estudio" className="colour-studio section-pad">
      {showHeading ? (
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / ESTÚDIO DE COR</span>
            <h2>
              Imagine a mudança.
              <br />
              <em>Em todos os ângulos.</em>
            </h2>
          </div>
          <p>
            Explore cores e acabamentos.
            <br />
            A sua escolha começa aqui.
          </p>
        </div>
      ) : null}
      <div className="studio-toolbar">
        <span>
          PORSCHE 911 <small>MODELO DEMONSTRATIVO</small>
        </span>
        <span className="studio-view-label">
          {activeView.label} / {activeFinish.name}
        </span>
      </div>
      <div className="studio-layout">
        <div className="studio-main">
          <div className="studio-frame">
            <Image
              src={activeView.src}
              alt={`Porsche demonstrativo, ${activeView.alt}, ${activeColor.name.toLowerCase()}`}
              fill
              sizes="(max-width: 800px) 100vw, 70vw"
              style={{ objectFit: "cover", filter }}
            />
            <Image
              className="studio-original"
              src={activeView.src}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 800px) 100vw, 70vw"
              style={{
                objectFit: "cover",
                clipPath: originalClip,
                filter: "grayscale(1) brightness(.82)",
              }}
            />
            <span className="compare-line" style={{ left: `${compare}%` }}>
              <span>
                <MoveHorizontal size={19} aria-hidden="true" />
              </span>
            </span>
            <input
              className="compare-input"
              type="range"
              min="3"
              max="97"
              value={compare}
              aria-label="Comparar cor original e simulação em todas as vistas"
              onChange={(event) => setCompare(Number(event.target.value))}
            />
          </div>
          <div className="comparison-labels">
            <span>Original ilustrativo</span>
            <span>Simulação · {activeColor.name}</span>
          </div>
        </div>
        <div className="studio-thumbnails">
          {views.map((view, index) => (
            <button
              key={view.src}
              type="button"
              className={index === viewIndex ? "active" : undefined}
              aria-pressed={index === viewIndex}
              onClick={() => setViewIndex(index)}
            >
              <div className="studio-frame">
                <Image
                  src={view.src}
                  alt={`Porsche demonstrativo, ${view.alt}, ${activeColor.name.toLowerCase()}`}
                  fill
                  sizes="170px"
                  style={{ objectFit: "cover", filter }}
                />
                <Image
                  className="studio-original"
                  src={view.src}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="170px"
                  style={{
                    objectFit: "cover",
                    clipPath: "inset(0 50% 0 0)",
                    filter: "grayscale(1) brightness(.82)",
                  }}
                />
                <span className="compare-line" style={{ left: "50%" }}>
                  <span>
                    <MoveHorizontal size={12} aria-hidden="true" />
                  </span>
                </span>
              </div>
              <span>
                {view.label}
                <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="studio-options">
        <fieldset className="swatches">
          <legend>
            Cor <span>{activeColor.name}</span>
          </legend>
          {colors.map((color, index) => (
            <button
              key={color.name}
              type="button"
              className={index === colorIndex ? "selected" : undefined}
              aria-label={color.name}
              aria-pressed={index === colorIndex}
              style={{ "--swatch": color.hex } as CSSProperties}
              onClick={() => setColorIndex(index)}
            >
              {index === colorIndex ? <Check size={16} aria-hidden="true" /> : null}
            </button>
          ))}
        </fieldset>
        <fieldset className="finishes">
          <legend>Acabamento</legend>
          <div>
            {finishes.map((finish, index) => (
              <button
                key={finish.name}
                type="button"
                className={index === finishIndex ? "selected" : undefined}
                aria-pressed={index === finishIndex}
                onClick={() => setFinishIndex(index)}
              >
                {finish.name}
              </button>
            ))}
          </div>
        </fieldset>
        <Link className="text-link" href="/#proposta">
          Pedir proposta com esta inspiração
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <p className="studio-disclaimer">
        <MoveHorizontal size={15} aria-hidden="true" /> A barra de comparação e a cor atualizam
        todas as vistas. Imagens demonstrativas geradas; simulação 2D aproximada. Confirme a cor e
        o acabamento em amostra física.
      </p>
    </section>
  );
}
