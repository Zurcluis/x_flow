import { INSTAGRAM_CAPTION_MAX_CHARS } from "@/domains/marketing/rules";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_PILLAR_LABELS,
  type SocialFormat,
  type SocialPillar,
} from "@/domains/marketing/types";
import { isGeminiConfigured } from "@/server/ai/gemini";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const AI_TIMEOUT_MS = 20_000;

const DRAFT_SCHEMA = {
  type: "OBJECT",
  properties: {
    hook: {
      type: "STRING",
      description: "Gancho curto para capa ou primeiros 3 segundos (máx 140 caracteres).",
    },
    caption: {
      type: "STRING",
      description: "Legenda completa em português europeu, sem emojis e sem preços.",
    },
    cta: {
      type: "STRING",
      description: "Uma única chamada para ação direta (máx 110 caracteres).",
    },
    scriptNotes: {
      type: "STRING",
      description: "Notas práticas de gravação/slides (planos e sequência curta).",
    },
  },
  required: ["hook", "caption", "cta"],
};

export async function draftSocialPostWithAi(input: {
  title: string;
  format: SocialFormat;
  pillar: SocialPillar;
  vehicleLabel?: string | null;
  existingHook?: string;
  existingCaption?: string;
}): Promise<{
  hook: string;
  caption: string;
  cta: string;
  scriptNotes: string;
} | null> {
  if (!isGeminiConfigured()) return null;
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-3.1-flash-lite";
  const systemInstruction = `És o diretor editorial da X-Motion (@x_motion.wrap), espaço especializado em PPF, Car Wrap e Color PPF em Barcelos, Portugal.
Regras obrigatórias de voz da marca:
- Escreve exclusivamente em português europeu (pt-PT).
- NUNCA uses a palavra "atelier" ou "ateliê". Usa "o nosso espaço", "espaço" ou expressões naturais como "chegou até nós" / "passou pelo nosso espaço".
- ZERO emojis em qualquer campo.
- Dá continuidade ao estilo real das legendas do @x_motion.wrap: aberturas diretas ("Este [modelo] chegou até nós...", "Desta vez trazemos...", "Do original ao resultado final."), listas curtas com marcadores (•) quando detalhas serviços, e encerramento com "X-Motion. Porque os detalhes fazem toda a diferença." e #Xmotion #Xmotionexperience.
- Nunca divulgues preços, valores, prazos não acordados nem garantias de durabilidade sem fonte.
- Nunca uses superlativos sem prova ("melhor do mercado", "para sempre", "imperdível", "barato", "sem riscos").
- Tom próximo, direto, sóbrio e técnico q.b. Trata sempre os seguidores e clientes na 2.ª pessoa do singular ("tu", "o teu carro", "gostas", "o que gostavas", "envia-nos", "pede a tua proposta") — NUNCA uses 3.ª pessoa formal ("você", "o seu", "gostaria", "preferia", "peça", "envie", "partilhe"). A marca fala na 1.ª pessoa do plural ("avaliamos", "preparamos", "connosco").
- Sem clichês ("sabias que", "ninguém te conta"). Um único CTA direto no fim (ex.: enviar marca e modelo por DM ou pedir proposta no link da bio).`;

  const prompt = [
    `Prepara uma proposta editorial para o Instagram da X-Motion:`,
    `Título/Tema: ${input.title}`,
    `Formato: ${SOCIAL_FORMAT_LABELS[input.format]}`,
    `Pilar: ${SOCIAL_PILLAR_LABELS[input.pillar]}`,
    input.vehicleLabel ? `Viatura associada: ${input.vehicleLabel}` : null,
    input.existingHook ? `Gancho atual (melhorar se necessário): ${input.existingHook}` : null,
    input.existingCaption ? `Rascunho atual de legenda: ${input.existingCaption}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
        responseSchema: DRAFT_SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText) as {
      hook?: string;
      caption?: string;
      cta?: string;
      scriptNotes?: string;
    };
    return {
      hook: String(parsed.hook ?? "").trim().slice(0, 280),
      caption: String(parsed.caption ?? "").trim().slice(0, INSTAGRAM_CAPTION_MAX_CHARS),
      cta: String(parsed.cta ?? "").trim().slice(0, 220),
      scriptNotes: String(parsed.scriptNotes ?? "").trim().slice(0, 2000),
    };
  } catch {
    return null;
  }
}
