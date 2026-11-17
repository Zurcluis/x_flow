"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  Eye,
  ImagePlus,
  Layers,
  LoaderCircle,
  Paintbrush,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nearestAspectRatio, type AspectRatio } from "@/lib/config-schema";
import {
  turboXChromeFinishes as chromeFinishes,
  turboXChromeZones as chromeZones,
  turboXColors as colors,
  turboXFinishes as finishes,
  turboXHeadlights as headlightsList,
  turboXServices as services,
} from "@/lib/studio";

type ChromeZoneKey = (typeof chromeZones)[number]["key"];

type Config = {
  service: "vinil" | "ppf" | "color-ppf";
  color: string;
  finish: string;
  headlights: string;
  chromeDelete: {
    doors: boolean;
    front: boolean;
    rear: boolean;
    mirrors: boolean;
    finish: "Preto brilho" | "Preto mate";
  };
  model: string;
};

const initial: Config = {
  service: "vinil",
  color: "original",
  finish: "Brilhante",
  headlights: "Original",
  chromeDelete: {
    doors: false,
    front: false,
    rear: false,
    mirrors: false,
    finish: "Preto brilho",
  },
  model: "nano-banana-pro",
};

type ModelOption = { value: string; name: string; vendor: string };

const openRouterModels: readonly ModelOption[] = [
  { value: "nano-banana-pro", name: "Nano Banana Pro", vendor: "Google" },
  { value: "gpt-image-2", name: "GPT Image 2", vendor: "OpenAI" },
];

const huggingFaceModels: readonly ModelOption[] = [
  { value: "flux-kontext", name: "FLUX.1 Kontext", vendor: "Black Forest Labs · HF" },
  { value: "qwen-image-edit", name: "Qwen Image Edit", vendor: "Alibaba Qwen · HF" },
];

const lightSwatches = new Set(["#f4f4f0", "#acb4bb", "#ecc53d", "#90becf"]);

async function encodeImageToJpeg(src: string) {
  const img = new window.Image();
  img.src = src;
  await img.decode();
  if (img.width < 200 || img.height < 200) {
    throw new Error("Utilize uma fotografia com pelo menos 200 × 200 píxeis.");
  }
  const scale = Math.min(1, 2048 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    aspectRatio: nearestAspectRatio(img.width, img.height),
  };
}

export function TurboXStudio() {
  const [config, setConfig] = useState<Config>(initial);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileName, setFileName] = useState("Modelo demonstrativo");
  const [result, setResult] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Config | null>(null);
  const [view, setView] = useState("original");
  const [compare, setCompare] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [drag, setDrag] = useState(false);
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState<"openrouter" | "huggingface" | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:2");

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const versionRef = useRef(0);

  const serviceObj = services.find((s) => s.value === config.service) ?? services[0];
  const paint = colors.find((c) => c.hex === config.color) ?? colors[0];
  const finishObj = finishes.find((f) => f.value === config.finish) ?? finishes[0];
  const activeChromeZones = chromeZones.filter((z) => config.chromeDelete[z.key]);
  const hasChromeDelete = activeChromeZones.length > 0;
  const allChromeSelected = activeChromeZones.length === chromeZones.length;
  const changed = !!generated && JSON.stringify(config) !== JSON.stringify(generated);
  const modelOptions = provider === "huggingface" ? huggingFaceModels : openRouterModels;
  const visibleFinishes =
    config.service === "ppf"
      ? finishes.filter((f) => f.value === "Brilhante" || f.value === "Fosco")
      : finishes;

  useEffect(() => {
    fetch("/api/status")
      .then(
        (r) =>
          r.json() as Promise<{ ready: boolean; provider?: "openrouter" | "huggingface" | null }>,
      )
      .then((d) => {
        setReady(d.ready === true);
        const activeProvider = d.provider ?? null;
        setProvider(activeProvider);
        if (activeProvider === "huggingface") {
          setConfig((c) =>
            c.model === "nano-banana-pro" ? { ...c, model: "flux-kontext" } : c,
          );
        }
      })
      .catch(() => {});
    return () => abortRef.current?.abort();
  }, []);

  function update<K extends keyof Config>(key: K, value: Config[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setError("");
  }

  function selectService(next: Config["service"]) {
    setConfig((c) => {
      if (next === "ppf") {
        const nextFinish =
          c.finish === "Acetinado" || c.finish === "Metálico" ? "Brilhante" : c.finish;
        return { ...c, service: next, color: "original", finish: nextFinish };
      }
      return { ...c, service: next };
    });
    setError("");
  }

  function toggleChromeZone(zone: ChromeZoneKey) {
    setConfig((c) => ({
      ...c,
      chromeDelete: {
        ...c.chromeDelete,
        [zone]: !c.chromeDelete[zone],
      },
    }));
    setError("");
  }

  function toggleAllChromeZones() {
    const nextValue = !allChromeSelected;
    setConfig((c) => ({
      ...c,
      chromeDelete: {
        ...c.chromeDelete,
        doors: nextValue,
        front: nextValue,
        rear: nextValue,
        mirrors: nextValue,
      },
    }));
    setError("");
  }

  function setChromeFinish(finish: Config["chromeDelete"]["finish"]) {
    setConfig((c) => ({
      ...c,
      chromeDelete: { ...c.chromeDelete, finish },
    }));
    setError("");
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Escolha uma fotografia JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("A fotografia deve ter até 10 MB.");
      return;
    }

    const id = ++versionRef.current;
    abortRef.current?.abort();
    setBusy(false);
    setError("");

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      const encoded = await encodeImageToJpeg(data);

      if (id !== versionRef.current) return;
      setAspectRatio(encoded.aspectRatio);
      setPhoto(encoded.dataUrl);
      setFileName(file.name);
      setResult(null);
      setGenerated(null);
      setView("original");
    } catch (e) {
      if (id === versionRef.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível abrir essa fotografia. Tente outra imagem.",
        );
      }
    }
  }

  async function generate() {
    if (busy) return;
    setError("");
    if (!ready) {
      setError(
        "A geração por IA requer configuração da chave no servidor (consulte CONFIGURACAO.md). Pode continuar a montar a sua configuração e pedir orçamento.",
      );
      return;
    }

    const snapshot = { ...config };
    const id = versionRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);

    try {
      const target = photo
        ? { dataUrl: photo, aspectRatio }
        : await encodeImageToJpeg("/images/turbo-x/car.webp");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: target.dataUrl,
          config: snapshot,
          aspectRatio: target.aspectRatio,
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as { error?: string; image: string };
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar. Tente novamente.");
      }
      if (id !== versionRef.current) return;
      setResult(data.image);
      setGenerated(snapshot);
      setView("result");
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      if (id === versionRef.current) {
        setBusy(false);
      }
    }
  }

  function reset() {
    setConfig(initial);
    setError("");
  }

  async function download() {
    if (!result) return;
    try {
      const response = await fetch(result);
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      const ext = result.startsWith("data:image/jpeg")
        ? "jpg"
        : result.startsWith("data:image/webp")
          ? "webp"
          : "png";
      a.download = `x-motion-estudio.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Não foi possível descarregar a imagem. Abra a pré-visualização ampliada para guardar.");
    }
  }

  const hasPaintChange = config.service === "ppf" || config.color !== "original";
  const selectedServiceSlug =
    config.service === "ppf"
      ? "PPF"
      : config.service === "color-ppf"
        ? "Color PPF"
        : hasPaintChange
          ? "Car Wrap"
          : hasChromeDelete || config.headlights !== "Original"
            ? "Detalhes e óticas"
            : "Car Wrap";

  const proposalParams = new URLSearchParams({
    servico: selectedServiceSlug,
    origem: "estudio-ia",
  });
  if (hasPaintChange) {
    proposalParams.set("revestimento", config.service);
    if (config.service !== "ppf" && config.color !== "original") {
      proposalParams.set("cor", paint.name);
    }
    proposalParams.set("acabamento", finishObj.name);
  }
  if (config.headlights !== "Original") {
    proposalParams.set("oticas", config.headlights);
  }
  if (hasChromeDelete) {
    const slugMap: Record<ChromeZoneKey, string> = {
      doors: "frisos",
      front: "frente",
      rear: "traseira",
      mirrors: "espelhos",
    };
    proposalParams.set(
      "chrome",
      activeChromeZones.map((z) => slugMap[z.key]).join(","),
    );
    proposalParams.set("chromeAcab", config.chromeDelete.finish);
  }
  const proposalHref = `/orcamento?${proposalParams.toString()}`;
  const source = photo || "/images/turbo-x/car.webp";

  return (
    <div className="turbox-studio">
      <div className="turbox-header-bar">
        <div className="turbox-steps" aria-label="Etapas do estúdio">
          <span>
            <b>1</b> A sua foto
          </span>
          <ChevronRight size={14} aria-hidden="true" />
          <span>
            <b>2</b> O seu estilo
          </span>
          <ChevronRight size={14} aria-hidden="true" />
          <span>
            <b>3</b> O seu novo visual
          </span>
        </div>
        <button type="button" className="turbox-help-button" onClick={() => setHelp(true)}>
          <CircleHelp size={16} aria-hidden="true" /> Como funciona
        </button>
      </div>

      <div className="turbox-workspace">
        <section className="turbox-preview-column" aria-label="Fotografia e resultado">
          <div
            className="turbox-photo-panel"
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void upload(e.dataTransfer.files[0]);
            }}
          >
            <div className="turbox-photo-toolbar">
              <div className="turbox-photo-title">
                <span className="turbox-section-number">01</span>
                <strong>O seu carro, em destaque</strong>
              </div>
              <button
                type="button"
                className="turbox-quiet-button"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={15} aria-hidden="true" />
                {photo ? "Trocar foto" : "Carregar foto"}
              </button>
            </div>

            <div className={`turbox-car-stage ${drag ? "dragging" : ""}`}>
              <div className="turbox-stage-top">
                <span className="turbox-image-label">
                  {view === "original"
                    ? "FOTOGRAFIA ORIGINAL"
                    : view === "compare"
                      ? "ANTES E DEPOIS"
                      : "NOVO VISUAL IA"}
                </span>
                <span className="turbox-example-label">
                  {photo ? "A sua fotografia" : "Explore com o modelo de exemplo"}
                </span>
              </div>

              <button
                type="button"
                className="turbox-image-expand"
                aria-label="Ampliar imagem do carro"
                onClick={() => setZoom(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="turbox-car-image"
                  src={view === "result" && result ? result : source}
                  alt={
                    view === "result"
                      ? "Carro personalizado no estúdio X-Motion"
                      : "Fotografia original do carro"
                  }
                />
              </button>

              {view === "compare" && result ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="turbox-comparison-image"
                    src={result}
                    style={{ clipPath: `inset(0 0 0 ${compare}%)` }}
                    alt="Carro personalizado"
                  />
                  <div className="turbox-comparison-line" style={{ left: `${compare}%` }}>
                    <ArrowLeftRight size={18} aria-hidden="true" />
                  </div>
                </>
              ) : null}

              {drag ? (
                <div className="turbox-drop-overlay">
                  <ImagePlus size={36} aria-hidden="true" />
                  <strong>Largue a fotografia aqui</strong>
                </div>
              ) : null}

              {busy ? (
                <div className="turbox-loading-overlay">
                  <LoaderCircle className="spin" size={34} aria-hidden="true" />
                  <strong>O seu novo visual está a caminho</strong>
                  <span>A IA está a personalizar a fotografia. Isto pode levar alguns momentos.</span>
                  <button
                    type="button"
                    onClick={() => {
                      versionRef.current++;
                      abortRef.current?.abort();
                      setBusy(false);
                    }}
                  >
                    Cancelar espera
                  </button>
                </div>
              ) : null}

              <div className="turbox-stage-bottom">
                <span>
                  <ShieldCheck size={14} aria-hidden="true" />
                  {photo ? "Fotografia carregada" : "Imagem ilustrativa"}
                </span>
                <span>
                  X-MOTION <b>ESTÚDIO IA</b>
                </span>
              </div>
            </div>

            <div className="turbox-preview-footer">
              <Tabs value={view} onValueChange={setView}>
                <TabsList className="turbox-view-tabs">
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="result" disabled={!result}>
                    Resultado
                  </TabsTrigger>
                  <TabsTrigger value="compare" disabled={!result}>
                    <ArrowLeftRight size={13} aria-hidden="true" /> Comparar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <button
                type="button"
                className="turbox-download-button"
                disabled={!result}
                onClick={download}
                aria-label="Descarregar resultado"
              >
                <Download size={17} aria-hidden="true" />
              </button>
            </div>

            {view === "compare" && result ? (
              <div className="turbox-comparison-slider">
                <span>Antes</span>
                <Slider
                  aria-label="Comparação antes e depois"
                  value={[compare]}
                  onValueChange={(v) => setCompare(v[0])}
                  min={0}
                  max={100}
                />
                <span>Depois</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="turbox-upload-card"
            onClick={() => inputRef.current?.click()}
          >
            <span className="turbox-upload-icon">
              <ImagePlus size={22} aria-hidden="true" />
            </span>
            <span>
              <strong>
                {photo ? "Fotografia pronta para transformar" : "Tudo começa com uma foto sua"}
              </strong>
              <small>
                {photo
                  ? fileName
                  : "Arraste uma fotografia ou clique para escolher. JPG, PNG ou WebP · até 10 MB"}
              </small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Carregar fotografia do carro"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="turbox-selection-summary">
            <div className="turbox-summary-title">
              <Layers size={16} aria-hidden="true" />
              <strong>O seu projeto</strong>
              <span>Resumo das escolhas atuais</span>
            </div>
            <div className="turbox-summary-chips">
              <span>
                <i
                  style={{
                    background:
                      config.service === "ppf" || config.color === "original"
                        ? "#8c918d"
                        : config.color,
                  }}
                />
                {serviceObj.name}
                {config.service === "ppf"
                  ? ` · Transparente (${finishObj.name})`
                  : config.color !== "original"
                    ? ` · ${paint.name} (${finishObj.name})`
                    : " · Cor original"}
              </span>
              <span>
                <Eye size={13} aria-hidden="true" />
                {config.headlights === "Original"
                  ? "Óticas originais"
                  : `Óticas ${config.headlights.toLowerCase()}`}
              </span>
              <span>
                <WandSparkles size={13} aria-hidden="true" />
                {hasChromeDelete
                  ? `Chrome Delete: ${activeChromeZones.map((z) => z.name.toLowerCase()).join(", ")} (${config.chromeDelete.finish.toLowerCase()})`
                  : "Frisos & espelhos originais"}
              </span>
            </div>
            <div className="turbox-summary-cta">
              <Link href={proposalHref} className="button gold">
                Pedir orçamento com esta configuração
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <p className="turbox-photo-tip">
            <Sparkles size={15} aria-hidden="true" />
            <span>
              <strong>Dica para melhor resultado:</strong> utilize uma fotografia bem iluminada,
              com os frisos das portas, frente, óticas e espelhos bem visíveis.
            </span>
          </p>
        </section>

        <aside className="turbox-customizer" aria-label="Opções de personalização">
          <div className="turbox-customizer-heading">
            <div>
              <span className="turbox-section-number">02</span>
              <h2>Personalizar ao seu gosto</h2>
            </div>
            <button
              type="button"
              title="Repor escolhas"
              aria-label="Repor escolhas"
              onClick={reset}
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="turbox-option-section">
            <legend>
              <Paintbrush size={16} aria-hidden="true" /> Revestimento &amp; Cor{" "}
              <span>
                {serviceObj.name}
                {config.service !== "ppf" && config.color !== "original" ? ` · ${paint.name}` : ""}
              </span>
            </legend>

            <RadioGroup
              value={config.service}
              onValueChange={(v) => selectService(v as Config["service"])}
              className="turbox-service-grid"
              aria-label="Serviço de revestimento da carroçaria"
            >
              {services.map((s) => (
                <label
                  key={s.value}
                  title={s.description}
                  className={`turbox-service-choice ${
                    config.service === s.value ? "selected" : ""
                  }`}
                >
                  <RadioGroupItem className="turbox-choice-input" value={s.value} />
                  <strong>{s.name}</strong>
                  <small>{s.subtitle}</small>
                </label>
              ))}
            </RadioGroup>

            {config.service === "ppf" ? (
              <p className="turbox-fineprint" style={{ marginTop: 0, marginBottom: 12 }}>
                PPF transparente protege a pintura original em Brilho ou Stealth Mate. Para mudar de
                cor, selecione <strong>Vinil</strong> ou <strong>PPF de Cor</strong>.
              </p>
            ) : null}

            <RadioGroup
              value={config.color}
              onValueChange={(v) => update("color", v)}
              className={`turbox-color-grid ${config.service === "ppf" ? "inactive" : ""}`}
              aria-label="Cor da carroçaria"
              disabled={config.service === "ppf"}
            >
              {colors.map((c, i) => (
                <label
                  className={`turbox-swatch-wrap ${config.color === c.hex ? "selected" : ""}`}
                  key={c.hex}
                  title={c.name}
                >
                  <RadioGroupItem className="turbox-choice-input" value={c.hex} />
                  <span
                    className={`turbox-swatch ${i === 0 ? "turbox-original-swatch" : ""}`}
                    style={i ? { background: c.hex } : {}}
                  >
                    {config.color === c.hex ? (
                      <Check
                        size={14}
                        color={lightSwatches.has(c.hex) ? "#101211" : "#f2f2ee"}
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                  <span className="sr-only">{c.name}</span>
                </label>
              ))}
            </RadioGroup>

            <div className="turbox-field-label">
              {config.service === "ppf" ? "Acabamento PPF" : "Acabamento"}
            </div>
            <RadioGroup
              value={config.finish}
              onValueChange={(v) => update("finish", v)}
              className="turbox-finish-grid"
              style={
                config.service === "ppf" ? { gridTemplateColumns: "repeat(2, 1fr)" } : undefined
              }
              aria-label="Acabamento do revestimento"
              disabled={config.service !== "ppf" && config.color === "original"}
            >
              {visibleFinishes.map((f, i) => {
                const inactive = config.service !== "ppf" && config.color === "original";
                return (
                  <label
                    key={f.value}
                    className={`turbox-finish-choice ${
                      config.finish === f.value ? "selected" : ""
                    } ${inactive ? "inactive" : ""}`}
                  >
                    <RadioGroupItem className="turbox-choice-input" value={f.value} />
                    <span className={`turbox-finish-sample turbox-finish-${i}`} />
                    <span>{config.service === "ppf" && f.value === "Fosco" ? "Stealth Mate" : f.name}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <fieldset className="turbox-option-section">
            <legend>
              <Eye size={16} aria-hidden="true" /> Óticas
              <button
                onClick={() => update("headlights", "Original")}
                type="button"
                className="turbox-text-button"
              >
                {config.headlights === "Original" ? "Original" : "Manter original"}
              </button>
            </legend>
            <RadioGroup
              value={config.headlights}
              onValueChange={(v) => update("headlights", v)}
              className="turbox-tint-grid"
              aria-label="Película de proteção para óticas"
            >
              {headlightsList.map((item) => (
                <label
                  className={`turbox-tint-choice ${config.headlights === item.value ? "selected" : ""}`}
                  key={item.value}
                >
                  <RadioGroupItem className="turbox-choice-input" value={item.value} />
                  <span className="turbox-tint-sample" style={{ background: item.preview }}>
                    <span />
                  </span>
                  <span>{item.name}</span>
                  <small>{item.level}</small>
                </label>
              ))}
            </RadioGroup>
            <p className="turbox-fineprint">
              Proteção de faróis e farolins contra projeções de gravilha ou tonalidade fumada.
            </p>
          </fieldset>

          <fieldset className="turbox-option-section">
            <legend>
              <Layers size={16} aria-hidden="true" /> Chrome Delete
              <button
                onClick={toggleAllChromeZones}
                type="button"
                className="turbox-text-button"
              >
                {allChromeSelected ? "Limpar" : "Aplicar em tudo"}
              </button>
            </legend>
            <div className="turbox-chrome-grid" role="group" aria-label="Zonas de Chrome Delete">
              {chromeZones.map((zone) => {
                const selected = config.chromeDelete[zone.key];
                return (
                  <button
                    key={zone.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleChromeZone(zone.key)}
                    className={`turbox-chrome-choice ${selected ? "selected" : ""}`}
                  >
                    <span className="turbox-chrome-check" aria-hidden="true">
                      <Check size={11} />
                    </span>
                    <strong>{zone.name}</strong>
                    <small>{zone.detail}</small>
                  </button>
                );
              })}
            </div>

            <RadioGroup
              value={config.chromeDelete.finish}
              onValueChange={(v) => setChromeFinish(v as Config["chromeDelete"]["finish"])}
              className="turbox-chrome-finish-row"
              aria-label="Acabamento do Chrome Delete"
              disabled={!hasChromeDelete}
            >
              {chromeFinishes.map((cf) => (
                <label
                  key={cf}
                  className={`turbox-chrome-finish-choice ${
                    config.chromeDelete.finish === cf ? "selected" : ""
                  } ${!hasChromeDelete ? "inactive" : ""}`}
                >
                  <RadioGroupItem className="turbox-choice-input" value={cf} />
                  <span className={`turbox-chrome-dot ${cf === "Preto brilho" ? "gloss" : "matte"}`} />
                  <span>{cf}</span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="turbox-generation-section">
            <div className="turbox-field-label">
              <span>Motor de geração visual</span>
              <Sparkles size={13} aria-hidden="true" />
            </div>
            <RadioGroup
              value={config.model}
              onValueChange={(v) => update("model", v)}
              className="turbox-model-grid"
              aria-label="Modelo de inteligência artificial"
            >
              {modelOptions.map((option) => (
                <label
                  key={option.value}
                  className={`turbox-model-choice ${
                    config.model === option.value ? "selected" : ""
                  }`}
                >
                  <RadioGroupItem value={option.value} />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.vendor}</small>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <button
              type="button"
              className="turbox-generate-button"
              onClick={generate}
              disabled={busy}
            >
              <WandSparkles size={18} aria-hidden="true" />
              {busy ? "A personalizar o seu carro…" : "Gerar novo visual com IA"}
              {!busy ? <ArrowRight size={17} aria-hidden="true" /> : null}
            </button>
            <p className="turbox-generate-note">
              {ready
                ? "A sua fotografia + as suas escolhas = simulação personalizada."
                : "Modo de pré-visualização · geração por IA aguarda chave no servidor."}
            </p>
          </div>
        </aside>
      </div>

      {error ? (
        <div className="turbox-feedback" role="alert">
          <CircleHelp size={18} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Fechar aviso">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {changed ? (
        <div className="turbox-result-notice" role="status">
          Alterou as opções selecionadas. Gere novamente para atualizar o resultado.
        </div>
      ) : null}

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="turbox-dialog">
          <DialogTitle>Ao seu gosto, em três passos.</DialogTitle>
          <DialogDescription>
            Visualize possibilidades para o seu carro antes de avançar para a aplicação.
          </DialogDescription>
          <ol className="turbox-help-steps">
            <li>
              <b>1. Carregue a sua fotografia</b>
              <p>
                Escolha uma imagem nítida, de preferência num ângulo que mostre a frente, os frisos
                das portas, óticas e espelhos.
              </p>
            </li>
            <li>
              <b>2. Escolha os serviços X-Motion</b>
              <p>
                Alterne entre Vinil, PPF ou PPF de Cor, proteja ou escureça as óticas e ative o
                Chrome Delete nos frisos das portas, frente, traseira e espelhos.
              </p>
            </li>
            <li>
              <b>3. Gere, compare e peça orçamento</b>
              <p>
                Compare o antes e depois, descarregue a imagem gerada ou envie a configuração
                diretamente para orçamento com a X-Motion.
              </p>
            </li>
          </ol>
          <p className="turbox-fineprint">
            As imagens são simulações aproximadas. Cores, acabamentos e películas devem ser
            confirmados numa amostra física no nosso espaço em Barcelos.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="turbox-dialog turbox-zoom-dialog">
          <DialogTitle>{view === "result" ? "Novo visual IA" : "Fotografia original"}</DialogTitle>
          <DialogDescription>Visualização ampliada do veículo.</DialogDescription>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={view === "result" && result ? result : source}
            alt="Veículo em tamanho ampliado"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
