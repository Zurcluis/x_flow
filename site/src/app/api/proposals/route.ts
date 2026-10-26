import { validateProposal } from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

const MAX_BODY = 20_000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const attempts = new Map<string, { count: number; reset: number }>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.reset <= now) {
    attempts.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }

  if (current.count >= MAX_REQUESTS) return true;

  current.count += 1;
  return false;
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return json({ error: "Demasiados pedidos. Tente novamente mais tarde." }, 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Formato de pedido inválido." }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) {
    return json({ error: "O pedido é demasiado grande." }, 413);
  }

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: "Não foi possível ler o pedido." }, 400);
  }

  const parsed = validateProposal(input);
  if (!parsed.ok) {
    if (parsed.errors.website) {
      return json({ error: "Pedido inválido." }, 400);
    }

    return json({ error: "Verifique os campos do formulário.", fields: parsed.errors }, 422);
  }

  const endpoint = process.env.XFLOW_PROPOSALS_URL;
  const secret = process.env.XFLOW_SITE_SECRET;

  if (!endpoint || !secret) {
    return json(
      {
        error:
          "O envio ainda não está configurado. Fale connosco pelo Instagram enquanto ativamos o formulário.",
      },
      503,
    );
  }

  const idempotencyKey =
    request.headers.get("x-idempotency-key")?.slice(0, 100) || crypto.randomUUID();

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: siteConfig.url,
        "x-forwarded-for": clientKey(request),
        "x-xflow-site-secret": secret,
        "x-idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const upstreamPayload = (await upstream.json().catch(() => null)) as {
      error?: string;
      reference?: string;
      fields?: unknown;
    } | null;

    if (!upstream.ok) {
      const passthrough = new Set([400, 413, 415, 422, 429, 503]);
      return json(
        {
          error:
            upstreamPayload?.error ?? "Não foi possível registar o pedido.",
          fields: upstreamPayload?.fields,
        },
        passthrough.has(upstream.status) ? upstream.status : 502,
      );
    }

    return json({ ok: true, reference: upstreamPayload?.reference }, 202);
  } catch {
    return json({ error: "O serviço de pedidos está indisponível." }, 502);
  }
}
