import { GMAIL_REPLY_MAX_CHARS, INSTAGRAM_DM_MAX_CHARS } from "@/domains/inbox/rules";
import type { InboxCategory, InboxMessageRecord, InboxThreadRecord } from "@/domains/inbox/types";
import { isGeminiConfigured } from "@/server/ai/gemini";
import {
  getInboxThreadWithMessages,
  listThreadsNeedingAiEnrichment,
  saveThreadAiInsights,
} from "./repository";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const AI_TIMEOUT_MS = 20_000;

function textModel(): string {
  return process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-3.1-flash-lite";
}

function getGeminiKey(): string | null {
  if (!isGeminiConfigured()) return null;
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function buildConversationExcerpt(
  thread: InboxThreadRecord,
  messages: InboxMessageRecord[]
): string {
  const recent = messages.slice(-4);
  const lines = [
    `Canal: ${thread.channel === "gmail" ? "E-mail (Gmail)" : "Instagram Direct"}`,
    `Contacto: ${thread.participantName || thread.participantHandle || "Desconhecido"}`,
    thread.subject ? `Assunto: ${thread.subject}` : null,
    "",
    ...recent.map((m) => {
      const who = m.direction === "outbound" ? "X-Motion" : "Cliente";
      return `[${who}]: ${m.bodyText.slice(0, 600)}`;
    }),
  ].filter((x): x is string => x !== null);

  return lines.join("\n").slice(0, 2600);
}

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description: "Resumo curto em português europeu numa única frase (máx 150 caracteres).",
    },
    extractedVehicle: {
      type: "STRING",
      nullable: true,
      description: "Marca, modelo e ano da viatura/mota mencionados explicitamente, ou null.",
    },
    extractedService: {
      type: "STRING",
      nullable: true,
      description:
        "Serviço pretendido (ex.: PPF, Car Wrap, Color PPF, Chrome Delete, Películas, Mota) ou null.",
    },
    suggestedCategory: {
      type: "STRING",
      description: "Uma de: lead, supplier, admin, hr, security, other.",
    },
  },
  required: ["summary", "suggestedCategory"],
};

async function callGeminiJson(
  systemInstruction: string,
  prompt: string,
  responseSchema?: Record<string, unknown>
): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 450,
  };
  if (responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = responseSchema;
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(textModel())}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}

export async function analyzeInboxThreadWithAi(
  organizationId: string,
  threadId: string
): Promise<InboxThreadRecord | null> {
  if (!isGeminiConfigured()) return null;

  const detail = await getInboxThreadWithMessages(organizationId, threadId);
  if (!detail || detail.messages.length === 0) return null;

  const raw = await callGeminiJson(
    "És o assistente interno da X-Motion (PPF, Car Wrap e personalização automóvel em Barcelos). Analisa conversas com precisão factual e responde apenas em português europeu. Nunca inventes modelos de viatura nem serviços que não estejam no texto.",
    `Extrai o resumo e os dados explícitos desta conversa:\n\n${buildConversationExcerpt(
      detail.thread,
      detail.messages
    )}`,
    ANALYSIS_SCHEMA
  );

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      summary?: string;
      extractedVehicle?: string | null;
      extractedService?: string | null;
      suggestedCategory?: string;
    };

    if (!parsed.summary?.trim()) return null;

    const validCategories = new Set<InboxCategory>([
      "lead",
      "supplier",
      "admin",
      "hr",
      "security",
      "other",
    ]);
    const suggestedCategory = validCategories.has(parsed.suggestedCategory as InboxCategory)
      ? (parsed.suggestedCategory as InboxCategory)
      : null;

    return await saveThreadAiInsights(organizationId, threadId, {
      summary: parsed.summary.trim(),
      extractedVehicle: parsed.extractedVehicle?.trim() || null,
      extractedService: parsed.extractedService?.trim() || null,
      suggestedCategory,
    });
  } catch {
    return null;
  }
}

export async function enrichUnprocessedInboxThreads(
  organizationId: string,
  options: { limit?: number } = {}
): Promise<number> {
  if (!isGeminiConfigured()) return 0;

  const candidates = await listThreadsNeedingAiEnrichment(organizationId, options.limit ?? 5);
  let enriched = 0;

  for (const thread of candidates) {
    const updated = await analyzeInboxThreadWithAi(organizationId, thread.id).catch(() => null);
    if (updated) enriched += 1;
  }

  return enriched;
}

export async function draftInboxReplyWithAi(input: {
  organizationId: string;
  threadId: string;
  customerName?: string | null;
}): Promise<{ ok: true; draftText: string } | { ok: false; error: string }> {
  if (!isGeminiConfigured()) {
    return { ok: false, error: "A IA não está ativada ou configurada neste ambiente." };
  }

  const detail = await getInboxThreadWithMessages(input.organizationId, input.threadId);
  if (!detail) {
    return { ok: false, error: "Conversa não encontrada." };
  }

  const isIg = detail.thread.channel === "instagram";
  const maxLen = isIg ? Math.min(900, INSTAGRAM_DM_MAX_CHARS) : Math.min(2200, GMAIL_REPLY_MAX_CHARS);

  const systemPrompt = [
    "Redige rascunhos de resposta para clientes da X-Motion (PPF, Car Wrap, Color PPF e detalhes automóvel em Barcelos, Portugal).",
    "Regras estritas:",
    "- Português europeu (pt-PT) natural, editorial, próximo e profissional (tratar por 'você' ou primeiro nome com respeito, sem chavões nem exclamações em excesso).",
    "- NUNCA inventes preços, prazos fechados, marcas de película ou garantias que não estejam explicitamente confirmados no histórico da conversa.",
    "- Se faltar informação (modelo, ano, peças/cobertura pretendida ou avaliação da pintura), pede objetivamente esses detalhes e convida a uma avaliação presencial no espaço em Barcelos sem compromisso.",
    isIg
      ? "- Para Instagram Direct: sê conciso, sem saudações formais longas nem assinatura no fim (máximo 700 caracteres)."
      : "- Para e-mail: sê claro e bem estruturado; NÃO incluas bloco de assinatura no fim porque o Gmail já anexa a assinatura oficial.",
  ].join("\n");

  const context = [
    input.customerName ? `Nome confirmado no CRM: ${input.customerName}` : null,
    buildConversationExcerpt(detail.thread, detail.messages),
  ]
    .filter(Boolean)
    .join("\n");

  const draft = await callGeminiJson(systemPrompt, context);
  if (!draft) {
    return { ok: false, error: "Não foi possível gerar uma sugestão de resposta agora." };
  }

  return {
    ok: true,
    draftText: draft.trim().slice(0, maxLen),
  };
}
