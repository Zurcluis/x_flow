import type { AssistantAnswer } from "@/domains/assistant/types";
import { answerQuestion } from "@/domains/assistant/intents";
import { getAssistantBriefing, type AssistantViewer } from "@/server/assistant";
import {
  getAssistantConversation,
  recordAssistantExchange,
} from "@/server/assistant-history";
import {
  AiResponseError,
  AiUnavailableError,
  answerWithGemini,
  isGeminiConfigured,
} from "@/server/ai/gemini";
import { readWavInfo } from "@/server/ai/audio";
import { signSpeechToken } from "@/server/ai/speech-token";
import {
  authenticateAssistantRequest,
  enforceRateLimit,
  isSameOrigin,
  jsonError,
} from "@/server/ai/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_QUESTION_CHARS = 500;
const MAX_AUDIO_BYTES = 6_000_000;
const MAX_AUDIO_SECONDS = 32;
const ASK_WINDOW_MS = 60_000;
const ASK_LIMIT = 12;

interface ParsedRequest {
  question?: string;
  audio?: { data: string; mimeType: string };
  conversationId?: string;
}

function parseJsonBody(value: unknown): ParsedRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const question = typeof record.question === "string" ? record.question.trim() : "";
  const conversationId =
    typeof record.conversationId === "string" ? record.conversationId : undefined;
  return question ? { question, conversationId } : { conversationId };
}

async function parseMultipart(request: Request): Promise<ParsedRequest | Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Pedido inválido.");
  }

  const audio = form.get("audio");
  if (!audio || typeof audio === "string") {
    return jsonError(400, "Falta o áudio da pergunta.");
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonError(413, "O áudio é demasiado grande. Grava uma pergunta mais curta.");
  }

  const mimeType = (audio.type || "").toLowerCase().split(";")[0];
  if (mimeType !== "audio/wav" && mimeType !== "audio/x-wav") {
    return jsonError(415, "Formato de áudio não suportado. Envia um WAV.");
  }

  const buffer = Buffer.from(await audio.arrayBuffer());
  const info = readWavInfo(buffer);
  if (!info) {
    return jsonError(400, "O ficheiro WAV é inválido.");
  }
  if (
    info.channels > 2 ||
    info.sampleRate < 8000 ||
    info.sampleRate > 48000 ||
    info.bitsPerSample !== 16
  ) {
    return jsonError(415, "O áudio tem de ser WAV PCM de 16 bits, mono ou estéreo.");
  }
  if (info.durationSeconds <= 0 || info.durationSeconds > MAX_AUDIO_SECONDS) {
    return jsonError(413, "A pergunta pode ter no máximo 30 segundos.");
  }

  const conversationId = form.get("conversationId");
  return {
    audio: { data: buffer.toString("base64"), mimeType: "audio/wav" },
    conversationId:
      typeof conversationId === "string" ? conversationId : undefined,
  };
}

function rulesAnswer(briefing: Awaited<ReturnType<typeof getAssistantBriefing>>, question: string): AssistantAnswer {
  return answerQuestion(question, briefing);
}

async function saveExchange(
  viewer: AssistantViewer,
  input: {
    conversationId?: string;
    question: string | null | undefined;
    answer: AssistantAnswer;
    engine: string;
  }
): Promise<string | null> {
  const question = input.question?.trim();
  if (!question) return null;
  try {
    const saved = await recordAssistantExchange(viewer, {
      conversationId: input.conversationId,
      question,
      answer: input.answer.text,
      references: input.answer.references,
      engine: input.engine,
    });
    return saved.conversationId;
  } catch (error) {
    console.error(
      "[assistant] histórico não gravado:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "Origem do pedido inválida.");
  }

  const authResult = await authenticateAssistantRequest();
  if (!authResult.ok) return authResult.response;
  const { viewer, sessionSecret } = authResult.value;

  const limited = enforceRateLimit(`ask:${viewer.profileId}`, ASK_LIMIT, ASK_WINDOW_MS);
  if (limited) return limited;

  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  let parsed: ParsedRequest | Response;

  try {
    if (contentType.includes("multipart/form-data")) {
      parsed = await parseMultipart(request);
    } else if (contentType.includes("application/json")) {
      parsed = parseJsonBody(await request.json());
    } else {
      return jsonError(415, "Formato do pedido não suportado.");
    }
  } catch {
    return jsonError(400, "Pedido inválido.");
  }

  if (parsed instanceof Response) return parsed;

  if (!parsed.question && !parsed.audio) {
    return jsonError(400, "Escreve ou dita uma pergunta.");
  }
  if (parsed.question && parsed.question.length > MAX_QUESTION_CHARS) {
    return jsonError(413, "A pergunta é demasiado longa. Resume-a a uma frase.");
  }

  if (parsed.audio && !isGeminiConfigured()) {
    return jsonError(503, "A transcrição por IA não está disponível.", {
      code: "ai_unavailable",
    });
  }

  try {
    const [briefing, conversation] = await Promise.all([
      getAssistantBriefing(viewer),
      parsed.conversationId
        ? getAssistantConversation(viewer, parsed.conversationId).catch(() => null)
        : Promise.resolve(null),
    ]);
    const history = conversation?.messages.map((message) => ({
      role: message.role,
      text: message.text,
    }));

    if (isGeminiConfigured()) {
      try {
        const result = await answerWithGemini({
          briefing,
          question: parsed.question,
          audio: parsed.audio,
          history,
        });
        const speechToken = signSpeechToken(
          result.answer.text,
          viewer.profileId,
          sessionSecret
        );
        const conversationId = await saveExchange(viewer, {
          conversationId: parsed.conversationId,
          question: result.transcript ?? parsed.question,
          answer: result.answer,
          engine: "gemini",
        });
        return Response.json(
          {
            ok: true,
            engine: "gemini",
            answer: result.answer,
            transcript: result.transcript,
            speechToken,
            conversationId,
          },
          { headers: { "cache-control": "no-store" } }
        );
      } catch (error) {
        if (error instanceof AiUnavailableError) {
          if (parsed.audio) {
            return jsonError(503, "A transcrição por IA não está disponível.", {
              code: "ai_unavailable",
            });
          }
        } else if (parsed.audio) {
          console.error(
            "[assistant] áudio falhou:",
            error instanceof Error ? error.message : "erro desconhecido"
          );
          return jsonError(502, "Não consegui processar o áudio agora. Tenta novamente.", {
            code: "ai_failed",
          });
        } else if (!(error instanceof AiResponseError)) {
          console.error(
            "[assistant] Gemini falhou:",
            error instanceof Error ? error.message : "erro desconhecido"
          );
        }
      }
    }

    if (!parsed.question) {
      return jsonError(502, "Não consegui processar o áudio agora. Tenta novamente.", {
        code: "ai_failed",
      });
    }

    const answer = rulesAnswer(briefing, parsed.question);
    const speechToken = signSpeechToken(answer.text, viewer.profileId, sessionSecret);
    const conversationId = await saveExchange(viewer, {
      conversationId: parsed.conversationId,
      question: parsed.question,
      answer,
      engine: "rules",
    });
    return Response.json(
      {
        ok: true,
        engine: "rules",
        answer,
        transcript: null,
        speechToken,
        conversationId,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "[assistant] pedido falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return jsonError(
      500,
      "Não consegui preparar o resumo agora. Tenta novamente ou abre a área pretendida."
    );
  }
}
