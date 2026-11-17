import {
  generateImage,
  GenerationError,
  isReady,
  requestSchema,
  type AIEnvironment,
} from "@/lib/generation";
import { isSameOrigin } from "@/lib/request-origin";

const env = process.env;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const limit = 4_300_000;
const reply = (error: string, status: number) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return reply("Origem da solicitação não permitida.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return reply("Envie a fotografia num formato válido.", 415);
  }
  if (Number(request.headers.get("content-length") || 0) > limit) {
    return reply("A fotografia é demasiado grande. Escolha outra imagem.", 413);
  }
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply("Envie a fotografia do carro.", 400);

    const decoder = new TextDecoder();
    let body = "";
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        return reply("A fotografia é demasiado grande.", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();

    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      return reply("Solicitação inválida.", 400);
    }

    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) {
      return reply("Verifique a fotografia e as opções selecionadas.", 400);
    }
    if (!isReady(env as AIEnvironment)) {
      return reply(
        "Configure a sua própria chave de IA no servidor. Consulte CONFIGURACAO.md.",
        503,
      );
    }

    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(180_000)]);
    const image = await generateImage(
      parsed.data.image,
      parsed.data.config,
      env as AIEnvironment,
      fetch,
      signal,
      parsed.data.aspectRatio,
    );
    return Response.json({ image }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GenerationError) {
      return reply(error.message, error.status);
    }
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
      return reply("A geração foi interrompida ou demorou demasiado. Tente novamente.", 504);
    }
    return reply("Não foi possível concluir a edição. Tente novamente.", 502);
  }
}
