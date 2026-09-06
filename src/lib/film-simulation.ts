// Motor de simulação física de películas sobre fotografia real.
// Composição por pixel que preserva a luminância (sombras, reflexos e vãos da foto
// original) e aplica o modelo de refletância da película APENAS à viatura:
// a silhueta do carro é segmentada por ML (MediaPipe DeepLab v3), com fallback
// heurístico (flood-fill do fundo a partir das margens) quando o modelo falha.

import { segmentVehicle } from "@/lib/car-segmentation";

export interface FilmSimParams {
  /** Cor base da película em hex (#rrggbb) */
  colorHex: string;
  /** Brilho mediano a 60° em GU (0-100) */
  glossGu: number;
  /** Intensidade de flocado metálico (0-1) */
  metallic: number;
  /** Granulação do flocado (0-3) */
  flakeScale: number;
  /** PPF transparente — preserva o croma original e aplica só o modelo de brilho */
  transparent?: boolean;
  /** Isola a viatura do ambiente (default: true). false pinta a imagem toda. */
  isolateCar?: boolean;
  /**
   * "panels" (default): pinta só a chapa — exclui vidros, grelha, pneus e frisos.
   * "car": pinta toda a silhueta da viatura.
   */
  applyMode?: "panels" | "car";
}

const MAX_DIM = 1200;
/** Distância RGB² máxima entre vizinhos (na imagem suavizada) para o fundo continuar a expandir */
const BG_EDGE_T2 = 3 * 22 * 22;
/** Frações mínima/máxima de pixéis de viatura para confiar na segmentação */
const CAR_FRACTION_MIN = 0.08;
const CAR_FRACTION_MAX = 0.96;
/** Luminância sRGB abaixo da qual um pixel da viatura é pneu/grelha/friso escuro */
const DARK_TRIM_CUT = 30;
/** Distância RGB máx. ao fundo para considerar reflexo de vidro (vidro reflete o ambiente) */
const GLASS_BG_DIST2 = 42 * 42;
/** Densidade de arestas (gradiente médio 0-255) acima da qual há textura de grelha/vidro */
const EDGE_DENSITY_CUT = 26;

function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [
    Math.pow(((n >> 16) & 0xff) / 255, 2.2),
    Math.pow(((n >> 8) & 0xff) / 255, 2.2),
    Math.pow((n & 0xff) / 255, 2.2),
  ];
}

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function toSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Hash inteiro determinístico → [0,1) */
function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h >>> 0) / 4294967296;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar fotografia"));
    img.src = src;
  });
}

/**
 * Detecta o fundo por flood-fill a partir das margens da imagem (continuidade local
 * de cor, decidida sobre versão suavizada para ignorar ruído JPEG).
 * Devolve alpha por pixel: 255 = viatura, 0 = ambiente.
 */
function buildCarAlpha(d: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const n = w * h;

  // Cópia suavizada (box blur 3×3 ×2) só para decisões de segmentação
  let sr = new Float32Array(n);
  let sg = new Float32Array(n);
  let sb = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    sr[i] = d[i * 4];
    sg[i] = d[i * 4 + 1];
    sb[i] = d[i * 4 + 2];
  }
  for (let pass = 0; pass < 2; pass++) {
    const tr = new Float32Array(n);
    const tg = new Float32Array(n);
    const tb = new Float32Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let ar = 0, ag = 0, ab = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            const j = yy * w + xx;
            ar += sr[j]; ag += sg[j]; ab += sb[j]; c++;
          }
        }
        tr[i] = ar / c; tg[i] = ag / c; tb[i] = ab / c;
      }
    }
    sr = tr; sg = tg; sb = tb;
  }

  const isBg = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;

  const seed = (i: number) => {
    if (isBg[i] === 0) {
      isBg[i] = 1;
      stack[sp++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }

  while (sp > 0) {
    const i = stack[--sp];
    const x = i % w;
    const y = (i / w) | 0;
    const r = sr[i], g = sg[i], b = sb[i];

    if (x > 0) {
      const j = i - 1;
      const dr = sr[j] - r, dg = sg[j] - g, db = sb[j] - b;
      if (isBg[j] === 0 && dr * dr + dg * dg + db * db < BG_EDGE_T2) {
        isBg[j] = 1;
        stack[sp++] = j;
      }
    }
    if (x < w - 1) {
      const j = i + 1;
      const dr = sr[j] - r, dg = sg[j] - g, db = sb[j] - b;
      if (isBg[j] === 0 && dr * dr + dg * dg + db * db < BG_EDGE_T2) {
        isBg[j] = 1;
        stack[sp++] = j;
      }
    }
    if (y > 0) {
      const j = i - w;
      const dr = sr[j] - r, dg = sg[j] - g, db = sb[j] - b;
      if (isBg[j] === 0 && dr * dr + dg * dg + db * db < BG_EDGE_T2) {
        isBg[j] = 1;
        stack[sp++] = j;
      }
    }
    if (y < h - 1) {
      const j = i + w;
      const dr = sr[j] - r, dg = sg[j] - g, db = sb[j] - b;
      if (isBg[j] === 0 && dr * dr + dg * dg + db * db < BG_EDGE_T2) {
        isBg[j] = 1;
        stack[sp++] = j;
      }
    }
  }

  let carCount = 0;
  for (let i = 0; i < n; i++) if (!isBg[i]) carCount++;
  const carFraction = carCount / n;

  // Segmentação não fiável (fundo dominante ou viatura dominante) → aplica a toda a imagem
  if (carFraction < CAR_FRACTION_MIN || carFraction > CAR_FRACTION_MAX) {
    const all = new Uint8Array(n).fill(255);
    return all;
  }

  const alpha = new Uint8Array(n);
  for (let i = 0; i < n; i++) alpha[i] = isBg[i] ? 0 : 255;

  // Feather: 2 passagens de box blur 3×3 para transição suave nas bordas
  let src = alpha;
  let dst = new Uint8Array(n);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let acc = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            acc += src[yy * w + xx];
            count++;
          }
        }
        dst[i] = (acc / count) | 0;
      }
    }
    const tmp = src;
    src = dst;
    dst = tmp;
  }
  return src;
}

/**
 * Máscara "só chapa": dentro da silhueta da viatura, remove vidros, grelha,
 * pneus e frisos para o filme pintar apenas as superfícies metálicas.
 * Heurística por pixel (sobre a máscara da viatura):
 *  - escuro profundo → pneu/grelha/friso (DARK_TRIM_CUT)
 *  - densidade de arestas alta → textura de grelha/malha/borracha (EDGE_DENSITY_CUT)
 *  - cor próxima do céu/fundo na metade superior → reflexo de vidro (GLASS_BG_DIST2)
 */
function restrictToPanels(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  carAlpha: Uint8Array
): Uint8Array {
  const n = w * h;

  // Luminância e gradiente (Sobel simplificado |dx|+|dy|) por pixel
  const lum = new Uint8Array(n);
  const grad = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    lum[i] = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) | 0;
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = Math.abs(lum[i + 1] - lum[i - 1]);
      const gy = Math.abs(lum[i + w] - lum[i - w]);
      grad[i] = Math.min(255, gx + gy);
    }
  }

  // Densidade de arestas média em janela 7×7 (textura local)
  const R = 3;
  const edgeDensity = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      let c = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          acc += grad[yy * w + xx];
          c++;
        }
      }
      edgeDensity[y * w + x] = (acc / c) | 0;
    }
  }

  // Bounding box da silhueta (para delimitar a zona dos vidros)
  let by0 = h, by1 = 0, carCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (carAlpha[y * w + x] > 127) {
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
        carCount++;
      }
    }
  }
  if (carCount === 0) return carAlpha;
  const upperLimit = by0 + (by1 - by0) * 0.55; // vidros concentram-se no topo

  // Cor de referência do fundo: média dos pixéis não-viatura no topo da imagem
  // (céu/fundo de estúdio — os vidros refletem-na). Fallback: todo o fundo.
  let br = 0, bg = 0, bb = 0, bgCount = 0;
  const topRows = Math.max(1, Math.round(h * 0.2));
  for (let y = 0; y < topRows; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (carAlpha[i] > 127) continue;
      const p = i * 4;
      br += d[p]; bg += d[p + 1]; bb += d[p + 2];
      bgCount++;
    }
  }
  if (bgCount < w) {
    for (let i = 0; i < n; i++) {
      if (carAlpha[i] > 127) continue;
      const p = i * 4;
      br += d[p]; bg += d[p + 1]; bb += d[p + 2];
      bgCount++;
    }
  }
  br /= bgCount; bg /= bgCount; bb /= bgCount;

  // Classificação por pixel + medida de segurança: se a heurística de vidro
  // remover a maior parte da zona superior, está desativada (cor do carro ≈ fundo).
  let upperCar = 0;
  let upperGlass = 0;
  const glassLike = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    if (y >= upperLimit) break;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (carAlpha[i] < 128) continue;
      upperCar++;
      const p = i * 4;
      const dr = d[p] - br, dg = d[p + 1] - bg, dbb = d[p + 2] - bb;
      if (dr * dr + dg * dg + dbb * dbb < GLASS_BG_DIST2) {
        glassLike[i] = 1;
        upperGlass++;
      }
    }
  }
  const glassActive = upperCar > 0 && upperGlass / upperCar < 0.6;

  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (carAlpha[i] < 128) continue;
    let keep = true;
    if (lum[i] < DARK_TRIM_CUT || edgeDensity[i] > EDGE_DENSITY_CUT) {
      keep = false;
    } else if (glassActive && glassLike[i]) {
      keep = false;
    }
    mask[i] = keep ? 255 : 0;
  }

  // Feather: 2 passagens de box blur 3×3 para transição suave nas bordas
  let src = mask;
  let dst = new Uint8Array(n);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let acc = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            acc += src[yy * w + xx];
            count++;
          }
        }
        dst[i] = (acc / count) | 0;
      }
    }
    const tmp = src;
    src = dst;
    dst = tmp;
  }
  return src;
}

/**
 * Aplica uma película à fotografia devolvendo um dataURL JPEG.
 * Modelo: saída = cor_filme × difusão(Y normalizada, achatada consoante GU)
 *         + especular(Y, GU, metálico) + sparkle de flocos.
 * Com `isolateCar`, só os pixéis da viatura (segmentados) são alterados.
 * Com `applyMode: "panels"` (default), dentro da viatura pinta só a chapa.
 */
export async function simulateFilmOnPhoto(
  imgSrc: string,
  params: FilmSimParams
): Promise<string> {
  const img = await loadImage(imgSrc);
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const isolate = params.isolateCar !== false;
  const panelsOnly = params.applyMode !== "car";
  let carAlpha: Uint8Array | null = null;
  if (isolate) {
    carAlpha = await segmentVehicle(canvas);
    if (!carAlpha) carAlpha = buildCarAlpha(d, w, h);
    if (panelsOnly) carAlpha = restrictToPanels(d, w, h, carAlpha);
  }

  // Mediana da luminância para auto-exposição (só viatura quando segmentado)
  const bins = new Uint32Array(256);
  let sampleCount = 0;
  for (let i = 0; i < w * h; i++) {
    if (carAlpha && carAlpha[i] < 128) continue;
    const p = i * 4;
    const y = 0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2];
    bins[Math.min(255, y | 0)]++;
    sampleCount++;
  }
  let median = 128;
  if (sampleCount > 0) {
    const half = sampleCount / 2;
    let acc = 0;
    for (let b = 0; b < 256; b++) {
      acc += bins[b];
      if (acc >= half) {
        median = b;
        break;
      }
    }
  }
  const yScale = Math.min(1.8, Math.max(0.55, 110 / Math.max(30, median)));

  const gloss = Math.min(1, Math.max(0, params.glossGu / 100));
  const metallic = Math.min(1, Math.max(0, params.metallic));
  const flake = params.flakeScale;
  const transparent = params.transparent === true;

  // PPF transparente: matte achata realces; gloss adiciona especular sobre o original
  const matteAmount = transparent
    ? gloss < 0.35
      ? 0.6
      : 0
    : Math.min(0.85, (1 - gloss) * 0.95);

  const [fr, fg, fb] = hexToLinear(params.colorHex);
  const specTintR = 1 - metallic * 0.55 + fr * metallic * 0.55;
  const specTintG = 1 - metallic * 0.55 + fg * metallic * 0.55;
  const specTintB = 1 - metallic * 0.55 + fb * metallic * 0.55;
  const specStrength = transparent ? 0.25 + gloss * 0.18 : 0.04 + gloss * 0.75;
  const hiStart = transparent ? 0.72 : 0.88 - gloss * 0.25;
  const diffuseK = 1.25 * (0.9 + gloss * 0.25);
  const flakeThreshold = 1 - metallic * 0.16;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      const a = carAlpha ? carAlpha[py * w + px] / 255 : 1;
      if (a === 0) continue;

      const or = d[i], og = d[i + 1], ob = d[i + 2];

      const lr = toLinear(or / 255);
      const lg = toLinear(og / 255);
      const lb = toLinear(ob / 255);
      const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      const yn = Math.min(1, y * yScale);

      // Especular a partir dos realces originais (preserva forma/reflexos da foto)
      const spec = smoothstep(hiStart, 1, yn) * specStrength;

      // Flocos metálicos: sparkle determinístico em tons médios/altos
      let sparkle = 0;
      if (metallic > 0) {
        const nh = hash2(px, py);
        if (nh > flakeThreshold && yn > 0.3) {
          sparkle = (nh - flakeThreshold) * flake * 0.35 * yn;
        }
      }

      let sr: number, sg: number, sb: number;
      if (transparent) {
        const flat = yn * (1 - matteAmount) + (0.5 + (yn - 0.5) * 0.7) * matteAmount;
        const k = flat / Math.max(yn, 1e-4);
        sr = lr * k + spec * specTintR + sparkle;
        sg = lg * k + spec * specTintG + sparkle;
        sb = lb * k + spec * specTintB + sparkle;
      } else {
        // Difusão: shading original re-aplicado à cor do filme
        const s = yn * (1 - matteAmount) + (0.5 + (yn - 0.5) * 0.72) * matteAmount;
        sr = fr * s * diffuseK + spec * specTintR + sparkle;
        sg = fg * s * diffuseK + spec * specTintG + sparkle;
        sb = fb * s * diffuseK + spec * specTintB + sparkle;
      }

      // Mistura: viatura recebe a película; ambiente mantém a cor original
      const simR = toSrgb(sr);
      const simG = toSrgb(sg);
      const simB = toSrgb(sb);
      d[i] = Math.round(or * (1 - a) + simR * a);
      d[i + 1] = Math.round(og * (1 - a) + simG * a);
      d[i + 2] = Math.round(ob * (1 - a) + simB * a);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}
