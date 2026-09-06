// Extrator da colour card oficial Avery Dennison Supreme Wrapping Film
// (public/catalogos/Avery.pdf, edição 2026) para scripts/catalog-data/avery-sw900.json.
// Cada chip tem legenda "acabamento / nome / código" (ex.: Matte Metallic, Silver, LB5190001);
// a cor real é amostrada do swatch renderizado acima da legenda.
//
// Uso: node scripts/parse-avery-catalog.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const PDF_PATH = path.join(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "public",
  "catalogos",
  "Avery.pdf"
);
const OUT_PATH = path.join(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "catalog-data",
  "avery-sw900.json"
);

const SCALE = 2;
const CODE_RE = /^[A-Z]{2}\d{7}$/;

function finishOf(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("gloss metallic")) return "gloss";
  if (l.includes("gloss pearl") || l.includes("pearl")) return "gloss";
  if (l.includes("diamond")) return "gloss";
  if (l.includes("colorflow") && l.includes("satin")) return "satin";
  if (l.includes("colorflow")) return "gloss";
  if (l.includes("satin")) return "satin";
  if (l.includes("matte")) return "matte";
  if (l.includes("rugged") || l.includes("extreme")) return "matte";
  if (l.includes("gloss")) return "gloss";
  return "gloss";
}

function quantile(arr, q) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
}

/** Cor base de uma região (percentil 25: ignora realces), excluindo branco página e texto preto */
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

  const items = tc.items
    .filter((it) => it.str.trim())
    .map((it) => ({
      str: it.str.trim(),
      x: it.transform[4],
      y: it.transform[5],
      w: it.width,
      h: it.height,
    }));

  // Acabamentos possíveis na colour card (normalizados, sem ™/case)
  const KNOWN = new Set([
    "GLOSS", "GLOSS METALLIC", "SATIN", "SATIN METALLIC", "EXTREME TEXTURE",
    "COLORFLOW GLOSS", "COLORFLOW SATIN", "RUGGED", "PEARL", "GLOSS PEARL",
    "MATTE", "MATTE METALLIC", "DIAMOND",
  ]);
  const norm = (s) => s.toUpperCase().replace(/™/g, "").replace(/\s+/g, " ").trim();

  // Cada entrada: percorre os itens anteriores até encontrar o acabamento conhecido;
  // os itens intermédios são o nome (podem ser nomes de 2+ palavras).
  const entries = [];
  for (let i = 0; i < items.length; i++) {
    const m = items[i].str.match(CODE_RE);
    if (!m) continue;
    const code = items[i].str;
    let finishLabel = null;
    const nameItems = [];
    for (let j = i - 1; j >= 0 && i - j <= 5; j--) {
      const t = items[j];
      if (CODE_RE.test(t.str)) break;
      if (Math.abs(t.y - items[i].y) > 140) break;
      if (KNOWN.has(norm(t.str))) {
        finishLabel = t.str;
        break;
      }
      nameItems.unshift(t);
    }
    const name = (nameItems.map((t) => t.str).join(" ") || code).replace(/\s+/g, " ").trim();
    const blockItems = [items[i], ...nameItems];
    entries.push({
      code,
      name,
      finishLabel: finishLabel ?? "",
      x: items[i].x,
      y: items[i].y,
      w: items[i].w,
      h: items[i].h,
      blockMinX: Math.min(...blockItems.map((t) => t.x)),
      blockMaxX: Math.max(...blockItems.map((t) => t.x + t.w)),
    });
  }

  // Fallback: entradas sem acabamento copiam o vizinho mais próximo da mesma coluna
  for (const e of entries) {
    if (e.finishLabel) continue;
    let best = null;
    let bestDist = Infinity;
    for (const o of entries) {
      if (o === e || !o.finishLabel) continue;
      if (Math.abs(o.x - e.x) > 40) continue;
      const d = Math.abs(o.y - e.y);
      if (d < bestDist) {
        bestDist = d;
        best = o;
      }
    }
    e.finishLabel = best ? best.finishLabel : "Gloss";
  }

  // Renderizar e amostrar o swatch
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Grelha: agrupar códigos por coluna (x) e estimar o pitch vertical por coluna.
  // O chip fica centrado entre o topo da legenda e o código da linha anterior.
  const columns = new Map();
  for (const e of entries) {
    const key = Math.round(e.x / 40);
    if (!columns.has(key)) columns.set(key, []);
    columns.get(key).push(e);
  }

  for (const [, colEntries] of columns) {
    colEntries.sort((a, b) => b.y - a.y); // PDF: y cresce para cima
    for (let i = 0; i < colEntries.length; i++) {
      const e = colEntries[i];
      let pitch = 120; // fallback pt
      if (i < colEntries.length - 1) pitch = e.y - colEntries[i + 1].y;
      const pitchNext = i > 0 ? colEntries[i - 1].y - e.y : pitch;
      e.pitch = Math.min(pitch, pitchNext);
    }
  }

  for (const e of entries) {
    const cx = ((e.blockMinX + e.blockMaxX) / 2) * SCALE;
    const cy = (viewport.height / SCALE - (e.y - e.pitch / 2)) * SCALE; // centro do chip
    const half = (e.pitch * SCALE) * 0.24;

    const best =
      sampleRegion(imgData, canvas.width, cx - half, cy - half, cx + half, cy + half) ??
      sampleRegion(imgData, canvas.width, cx - half * 1.6, cy - half * 1.6, cx + half * 1.6, cy + half * 1.6);
    if (!best) continue;
    const hex = "#" + best.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    films.push({
      code: e.code,
      name: e.name,
      finishLabel: e.finishLabel,
      finish: finishOf(e.finishLabel),
      hex,
      page: p,
    });
  }
  page.cleanup();
  console.log(`página ${p}: ${entries.length} códigos`);
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(films, null, 2));
console.log(`\nTotal: ${films.length} películas Avery extraídas → ${OUT_PATH}`);
