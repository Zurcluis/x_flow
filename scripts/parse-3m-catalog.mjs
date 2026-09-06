// Extrator do catálogo 3M (public/catalogos/3M.pdf — Colour Card 1080).
// Extrai código, nome, série e cor real (amostragem do swatch renderizado) para
// scripts/catalog-data/3m-1080.json, usado pelo seed-films.mjs.
//
// Uso: node scripts/parse-3m-catalog.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const PDF_PATH = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "public", "catalogos", "3M.pdf");
const OUT_PATH = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "catalog-data", "3m-1080.json");

const SCALE = 2;
const CODE_RE = /^1080-[A-Z]+\d+$/;

function finishOf(code, name) {
  const n = name.toLowerCase();
  if (code.includes("CFS")) return "carbon";
  if (code.includes("BR")) return "satin";
  if (code.includes("MX") || code.includes("SB")) return "matte";
  if (n.startsWith("matte") || n.includes("dead matte")) return "matte";
  if (n.startsWith("satin") || n.startsWith("brushed")) return "satin";
  return "gloss"; // gloss, sparkle, flip, chrome — acabamento brilhante
}

function seriesOf(code) {
  if (code.includes("GP")) return "Sparkle / Flip";
  if (code.includes("SP")) return "Satin Flip / Pearl";
  if (code.includes("GC")) return "Chrome";
  if (code.includes("CFS")) return "Carbon Fiber";
  if (code.includes("BR")) return "Brushed";
  if (code.includes("MX")) return "Matrix";
  if (code.includes("SB")) return "Shadow";
  if (/[GS]3\d\d/.test(code)) return "Series 300";
  if (code.includes("DM")) return "Dead Matte";
  if (code.startsWith("M") || code.includes("M") === false) return "Metallic";
  return "Standard";
}

function quantile(arr, q) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
}

/** Cor base de uma região (percentil 25: ignora realces brilhantes do swatch gloss), excluindo quase branco/preto */
function sampleRegion(imgData, w, x0, y0, x1, y1) {
  const rs = [], gs = [], bs = [];
  for (let y = Math.max(0, y0 | 0); y < Math.min(imgData.height, y1); y++) {
    for (let x = Math.max(0, x0 | 0); x < Math.min(imgData.width, x1); x++) {
      const i = (y * w + x) * 4;
      const r = imgData.data[i], g = imgData.data[i + 1], b = imgData.data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max > 246 && min > 240) continue; // branco página
      if (max < 12) continue; // preto texto puro
      rs.push(r); gs.push(g); bs.push(b);
    }
  }
  if (rs.length < 20) return null;
  return [quantile(rs, 0.25), quantile(gs, 0.25), quantile(bs, 0.25)];
}

const data = new Uint8Array(fs.readFileSync(PDF_PATH));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

const films = [];

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();

  // Agrupar itens de texto por linhas (y) com x para ordem de leitura
  const items = tc.items
    .filter((it) => it.str.trim())
    .map((it) => ({
      str: it.str.trim(),
      x: it.transform[4],
      y: it.transform[5],
      w: it.width,
      h: it.height,
    }));

  // Juntar linhas: item código + nome nas linhas seguintes
  const entries = [];
  for (let i = 0; i < items.length; i++) {
    const m = items[i].str.match(/^1080-([A-Z]+\d+)$/);
    if (!m) continue;
    const code = `1080-${m[1]}`;
    // nome: itens à direita na mesma linha + linhas abaixo (até próximo código)
    let name = items[i].str.replace(/^1080-\S+\s*/, "");
    const baseY = items[i].y;
    for (let j = i + 1; j < Math.min(items.length, i + 8); j++) {
      const t = items[j];
      if (CODE_RE.test(t.str)) break;
      if (t.str === "NEW!" || /NEW/i.test(t.str)) continue;
      if (t.y > baseY + 2 || t.y < baseY - 60) break; // só linhas imediatamente abaixo
      if (t.x < items[i].x - 20) break;
      name += (name ? " " : "") + t.str;
    }
    name = name.replace(/\s+/g, " ").trim();
    if (!name) name = m[1];
    entries.push({ code, name, x: items[i].x, y: baseY, w: items[i].w, h: items[i].h });
  }

  // Renderizar página e amostrar a cor do swatch acima de cada código
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (const e of entries) {
    // caixa do texto em px do canvas (y do PDF cresce para cima)
    const tx = e.x * SCALE;
    const ty = (viewport.height / SCALE - e.y) * SCALE;
    const tw = Math.max(e.w * SCALE, 60);
    const th = e.h * SCALE;

    // Layout da colour card: swatch IMEDIATAMENTE acima da legenda.
    // Candidatos por ordem de preferência: acima (estreito), abaixo, direita.
    const candidates = [
      sampleRegion(imgData, canvas.width, tx - tw * 0.15, ty - th * 2.2, tx + tw * 1.05, ty - th * 0.35),
      sampleRegion(imgData, canvas.width, tx - tw * 0.15, ty + th * 0.6, tx + tw * 1.05, ty + th * 2.2),
      sampleRegion(imgData, canvas.width, tx + tw * 1.1, ty - th * 1.6, tx + tw * 3.2, ty + th * 0.8),
    ].filter(Boolean);

    const best = candidates[0];
    if (!best) continue;
    const hex = "#" + best.map((v) => v.toString(16).padStart(2, "0")).join("");
    films.push({ code: e.code, name: e.name, hex, finish: finishOf(e.code, e.name), series: seriesOf(e.code), page: p });
  }
  page.cleanup();
  console.log(`página ${p}: ${entries.length} códigos`);
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(films, null, 2));
console.log(`\nTotal: ${films.length} películas extraídas → ${OUT_PATH}`);
