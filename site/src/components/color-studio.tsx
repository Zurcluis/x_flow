"use client";

import { ArrowUpRight, Check, MoveHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  studioColors as colors,
  studioFinishes as finishes,
  studioViews as views,
} from "@/lib/studio";

const URL_CHANGE_EVENT = "xmotion:urlchange";

function subscribeToSearch(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_CHANGE_EVENT, callback);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSearchSnapshot() {
  return "";
}

type ColorStudioProps = {
  showHeading?: boolean;
};

export function ColorStudio({ showHeading = true }: ColorStudioProps) {
  const [compare, setCompare] = useState(50);
  const search = useSyncExternalStore(
    subscribeToSearch,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );

  const params = new URLSearchParams(search);
  const corParam = params.get("cor")?.trim().toLowerCase();
  const acabamentoParam = params.get("acabamento")?.trim().toLowerCase();
  const vistaParam = params.get("vista")?.trim().toLowerCase();

  const matchedColor = corParam
    ? colors.findIndex((c) => c.name.toLowerCase() === corParam)
    : -1;
  const matchedFinish = acabamentoParam
    ? finishes.findIndex((f) => f.name.toLowerCase() === acabamentoParam)
    : -1;
  const matchedView = vistaParam
    ? views.findIndex((v) => v.label.toLowerCase() === vistaParam)
    : -1;

  const colorIndex = matchedColor !== -1 ? matchedColor : 1;
  const finishIndex = matchedFinish !== -1 ? matchedFinish : 0;
  const viewIndex = matchedView !== -1 ? matchedView : 0;

  useEffect(() => {
    views.forEach((view) => {
      const image = new window.Image();
      image.src = view.src;
    });
  }, []);

  function syncUrl(nextView: number, nextColor: number, nextFinish: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("cor", colors[nextColor].name);
    url.searchParams.set("acabamento", finishes[nextFinish].name);
    url.searchParams.set("vista", views[nextView].label);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  }

  function selectView(next: number) {
    syncUrl(next, colorIndex, finishIndex);
  }

  function selectColor(next: number) {
    syncUrl(viewIndex, next, finishIndex);
  }

  function selectFinish(next: number) {
    syncUrl(viewIndex, colorIndex, next);
  }

  const activeView = views[viewIndex];
  const activeColor = colors[colorIndex];
  const activeFinish = finishes[finishIndex];
  const baseFilter = "grayscale(1) contrast(1.05) brightness(.98)";
  const simulatedFilter = `${baseFilter} ${activeFinish.filter}`;
  const originalClip = `inset(0 ${100 - compare}% 0 0)`;
  const proposalHref = `/orcamento?servico=${encodeURIComponent("Car Wrap")}&cor=${encodeURIComponent(activeColor.name)}&acabamento=${encodeURIComponent(activeFinish.name)}&origem=estudio`;

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
        <span className="studio-view-label" aria-live="polite">
          {activeView.label} / {activeFinish.name}
        </span>
      </div>
      <div className="studio-layout">
        <div className="studio-main">
          <div className="studio-frame">
            <Image
              className="studio-sim"
              src={activeView.src}
              alt={`Porsche demonstrativo, ${activeView.alt}, ${activeColor.name.toLowerCase()}`}
              fill
              sizes="(max-width: 800px) 100vw, 70vw"
              style={{ objectFit: "cover", filter: simulatedFilter }}
            />
            <span
              className="studio-sim-tint"
              style={{
                backgroundColor: activeColor.hex,
                opacity: activeFinish.tintOpacity,
              }}
              aria-hidden="true"
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
              aria-valuetext={`${compare}% simulação`}
              aria-describedby="studio-disclaimer"
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
              aria-label={`Ver vista ${view.label.toLowerCase()}`}
              aria-pressed={index === viewIndex}
              onClick={() => selectView(index)}
            >
              <div className="studio-frame">
                <Image
                  className="studio-sim"
                  src={view.src}
                  alt={`Porsche demonstrativo, ${view.alt}, ${activeColor.name.toLowerCase()}`}
                  fill
                  sizes="170px"
                  style={{ objectFit: "cover", filter: simulatedFilter }}
                />
                <span
                  className="studio-sim-tint"
                  style={{
                    backgroundColor: activeColor.hex,
                    opacity: activeFinish.tintOpacity,
                  }}
                  aria-hidden="true"
                />
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
            Cor <span aria-live="polite">{activeColor.name}</span>
          </legend>
          {colors.map((color, index) => (
            <button
              key={color.name}
              type="button"
              className={index === colorIndex ? "selected" : undefined}
              aria-label={color.name}
              aria-pressed={index === colorIndex}
              title={color.name}
              style={{ "--swatch": color.hex } as CSSProperties}
              onClick={() => selectColor(index)}
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
                onClick={() => selectFinish(index)}
              >
                {finish.name}
              </button>
            ))}
          </div>
        </fieldset>
        <Link
          className="button gold studio-proposal"
          href={proposalHref}
          aria-label={`Pedir orçamento com a cor ${activeColor.name}, acabamento ${activeFinish.name}`}
        >
          Pedir orçamento com esta cor
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <p className="studio-disclaimer" id="studio-disclaimer">
        <MoveHorizontal size={15} aria-hidden="true" /> A barra de comparação e a cor atualizam
        todas as vistas. Imagens demonstrativas; simulação 2D aproximada. A cor no ecrã pode variar
        com o dispositivo. Confirme a cor e o acabamento em amostra física.
      </p>
    </section>
  );
}
