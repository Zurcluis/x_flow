// Motor de simulação física de películas sobre fotografia real.
// Substitui os blend modes CSS por composição por pixel que preserva a luminância
// (sombras, reflexos e vãos da foto original) e aplica o modelo de refletância da película:
// difusão pela cor do material, especular controlada pelo brilho GU e flocado metálico.

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
}

const MAX_DIM = 1200;

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
 * Aplica uma película à fotografia devolvendo um dataURL JPEG.
 * Modelo: saída = cor_filme × difusão(Y normalizada, achatada consoante GU)
 *         + especular(Y, GU, metálico) + sparkle de flocos.
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

  // Mediana da luminância para auto-exposição (fotos variam muito)
  const bins = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 16) {
    const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    bins[Math.min(255, y | 0)]++;
  }
  let median = 128;
  {
    const half = d.length / 16 / 2;
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
      const r = toLinear(d[i] / 255);
      const g = toLinear(d[i + 1] / 255);
      const b = toLinear(d[i + 2] / 255);
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const yn = Math.min(1, y * yScale);

      // Especular a partir dos realces originais (preserva forma/reflexos da foto)
      const spec = smoothstep(hiStart, 1, yn) * specStrength;

      // Flocos metálicos: sparkle determinístico em tons médios/altos
      let sparkle = 0;
      if (metallic > 0) {
        const n = hash2(px, py);
        if (n > flakeThreshold && yn > 0.3) {
          sparkle = (n - flakeThreshold) * flake * 0.35 * yn;
        }
      }

      if (transparent) {
        const flat = yn * (1 - matteAmount) + (0.5 + (yn - 0.5) * 0.7) * matteAmount;
        const k = flat / Math.max(yn, 1e-4);
        d[i] = toSrgb(r * k + spec * specTintR + sparkle);
        d[i + 1] = toSrgb(g * k + spec * specTintG + sparkle);
        d[i + 2] = toSrgb(b * k + spec * specTintB + sparkle);
      } else {
        // Difusão: shading original re-aplicado à cor do filme
        const s = yn * (1 - matteAmount) + (0.5 + (yn - 0.5) * 0.72) * matteAmount;
        d[i] = toSrgb(fr * s * diffuseK + spec * specTintR + sparkle);
        d[i + 1] = toSrgb(fg * s * diffuseK + spec * specTintG + sparkle);
        d[i + 2] = toSrgb(fb * s * diffuseK + spec * specTintB + sparkle);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}
