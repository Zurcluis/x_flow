import { getAssistantBriefing } from "@/server/assistant";
import {
  ASSISTANT_SAMPLE_SPEECH,
  defaultVoiceForGender,
  findAssistantVoice,
} from "@/domains/assistant/voices";
import {
  AiResponseError,
  AiUnavailableError,
  isGeminiConfigured,
  synthesizeSpeech,
} from "@/server/ai/gemini";
import { verifySpeechToken } from "@/server/ai/speech-token";
import {
  authenticateAssistantRequest,
  enforceRateLimit,
  isSameOrigin,
  jsonError,
} from "@/server/ai/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SPEECH_WINDOW_MS = 60_000;
const SPEECH_LIMIT = 20;

type SpeechKind = "briefing" | "answer" | "sample";

interface SpeechRequest {
  kind?: SpeechKind;
  token?: string;
  voice?: string;
  gender?: "female" | "male";
}

function parseBody(value: unknown): SpeechRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    kind:
      record.kind === "briefing" ||
      record.kind === "answer" ||
      record.kind === "sample"
        ? record.kind
        : undefined,
    token: typeof record.token === "string" ? record.token : undefined,
    voice: typeof record.voice === "string" ? record.voice : undefined,
    gender: record.gender === "male" || record.gender === "female" ? record.gender : undefined,
  };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "Origem do pedido inválida.");
  }

  const authResult = await authenticateAssistantRequest();
  if (!authResult.ok) return authResult.response;
  const { viewer, sessionSecret } = authResult.value;

  const limited = enforceRateLimit(
    `speech:${viewer.profileId}`,
    SPEECH_LIMIT,
    SPEECH_WINDOW_MS
  );
  if (limited) return limited;

  let body: SpeechRequest;
  try {
    body = parseBody(await request.json());
  } catch {
    return jsonError(400, "Pedido inválido.");
  }

  if (!body.kind) {
    return jsonError(400, "Falta o tipo de leitura.");
  }

  if (!isGeminiConfigured()) {
    return jsonError(503, "A voz da IA não está disponível.", {
      code: "ai_unavailable",
      fallback: "browser",
    });
  }

  try {
    let text: string;

    if (body.kind === "briefing") {
      const briefing = await getAssistantBriefing(viewer);
      text = briefing.narration;
    } else if (body.kind === "sample") {
      text = ASSISTANT_SAMPLE_SPEECH;
    } else {
      if (!body.token) {
        return jsonError(400, "Falta o token da resposta.");
      }
      const verified = verifySpeechToken(body.token, viewer.profileId, sessionSecret);
      if (!verified) {
        return jsonError(403, "A resposta expirou. Pede novamente ao assistente.");
      }
      text = verified;
    }

    const requestedVoice =
      findAssistantVoice(body.voice) ??
      (body.gender ? defaultVoiceForGender(body.gender) : null);
    const audio = await synthesizeSpeech({
      text,
      voice: requestedVoice?.id,
    });

    return new Response(new Uint8Array(audio.data), {
      status: 200,
      headers: {
        "content-type": audio.mimeType,
        "content-length": String(audio.data.length),
        "cache-control": "no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-assistant-voice": audio.voice,
      },
    });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return jsonError(503, "A voz da IA não está disponível.", {
        code: "ai_unavailable",
        fallback: "browser",
      });
    }
    console.error(
      "[assistant] voz falhou:",
      error instanceof AiResponseError
        ? error.message
        : error instanceof Error
          ? error.message
          : "erro desconhecido"
    );
    if (error instanceof AiResponseError && error.status === 429) {
      return jsonError(
        429,
        "A voz neural está temporariamente no limite. A usar a voz do dispositivo.",
        { code: "tts_rate_limited", fallback: "browser" }
      );
    }
    return jsonError(502, "Não consegui gerar a voz agora. Tenta novamente.", {
      code: "tts_failed",
      fallback: "browser",
    });
  }
}
