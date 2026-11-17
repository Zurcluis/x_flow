"use client";

import { Layers, Sparkles } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { ColorStudio } from "@/components/color-studio";
import { TurboXStudio } from "@/components/turbo-x-studio";

type StudioMode = "ia" | "2d";

function subscribeToSearch(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSearchSnapshot() {
  return "";
}

export function StudioExperience() {
  const [selectedMode, setSelectedMode] = useState<StudioMode | null>(null);
  const search = useSyncExternalStore(
    subscribeToSearch,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );

  const params = new URLSearchParams(search);
  const urlMode: StudioMode =
    params.get("modo") === "2d" || params.has("vista") ? "2d" : "ia";
  const mode = selectedMode ?? urlMode;

  return (
    <div id="estudio" className="turbox-experience-wrap">
      <div className="turbox-mode-bar">
        <div className="turbox-mode-copy">
          <span className="eyebrow">MODO DE SIMULAÇÃO</span>
          <p>
            {mode === "ia"
              ? "Simule na fotografia real do seu carro: Vinil, PPF, PPF de Cor, Óticas e Chrome Delete."
              : "Explore instantaneamente 4 ângulos no modelo demonstrativo sem carregar fotografia."}
          </p>
        </div>
        <div className="turbox-mode-tabs" role="tablist" aria-label="Modo do estúdio de cor">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "ia"}
            className={`turbox-mode-tab ${mode === "ia" ? "active" : ""}`}
            onClick={() => setSelectedMode("ia")}
          >
            <Sparkles size={15} aria-hidden="true" />
            Estúdio IA · A sua foto
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "2d"}
            className={`turbox-mode-tab ${mode === "2d" ? "active" : ""}`}
            onClick={() => setSelectedMode("2d")}
          >
            <Layers size={15} aria-hidden="true" />
            Simulação 2D · 4 ângulos
          </button>
        </div>
      </div>

      {mode === "ia" ? (
        <section className="turbox-section section-pad" aria-label="Estúdio de personalização IA">
          <TurboXStudio />
        </section>
      ) : (
        <ColorStudio showHeading={false} />
      )}
    </div>
  );
}
