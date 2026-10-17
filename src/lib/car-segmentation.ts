// Segmentação de viaturas com MediaPipe Image Segmenter (modelo DeepLab v3, Pascal VOC).
// O modelo e os WASMs são servidos de /public — sem dependência de CDN em runtime.
import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/models/deeplab_v3.tflite";

// Pascal VOC: 6=bus, 7=car, 14=motorbike
const VEHICLE_CLASSES = new Set([6, 7, 14]);

let segmenterPromise: Promise<ImageSegmenter | null> | null = null;

// O runtime TFLite do MediaPipe escreve esta linha informativa em stderr; o
// glue do wasm converte-a em console.error e o overlay do Next trata-a como
// erro. É ruído de arranque do delegate CPU, não uma falha de segmentação.
// O log pode ser emitido de forma assíncrona, por isso o filtro fica instalado.
const BENIGN_TFLITE_LOG = "Created TensorFlow Lite XNNPACK delegate for CPU";

if (typeof window !== "undefined") {
  const state = window as unknown as { __xflowTfliteFilter?: boolean };
  if (!state.__xflowTfliteFilter) {
    state.__xflowTfliteFilter = true;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes(BENIGN_TFLITE_LOG)) return;
      originalError.apply(console, args);
    };
  }
}

function getSegmenter(): Promise<ImageSegmenter | null> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        return await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      } catch (e) {
        console.warn("Segmentador ML indisponível — a usar fallback heurístico.", e);
        return null;
      }
    })();
  }
  return segmenterPromise;
}

function boxBlur(
  mask: Uint8Array<ArrayBufferLike>,
  w: number,
  h: number,
  passes: number
): Uint8Array<ArrayBufferLike> {
  let src = mask;
  let dst: Uint8Array<ArrayBufferLike> = new Uint8Array(mask.length);
  for (let p = 0; p < passes; p++) {
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
 * Devolve alpha por pixel (0 = ambiente, 255 = viatura) com a silhueta da
 * viatura, ou null se o modelo não estiver disponível.
 */
export async function segmentVehicle(
  canvas: HTMLCanvasElement
): Promise<Uint8Array | null> {
  const segmenter = await getSegmenter();
  if (!segmenter) return null;

  let result: ReturnType<ImageSegmenter["segment"]> | null = null;
  try {
    result = segmenter.segment(canvas);
    const cat = result.categoryMask;
    if (!cat) return null;
    const mask = cat.getAsUint8Array();
    const w = cat.width;
    const h = cat.height;
    const alpha = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
      alpha[i] = VEHICLE_CLASSES.has(mask[i]) ? 255 : 0;
    }
    return boxBlur(alpha, w, h, 2);
  } catch (e) {
    console.warn("Falha na segmentação ML.", e);
    return null;
  } finally {
    result?.close();
  }
}
