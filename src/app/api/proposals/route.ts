import { createHash, timingSafeEqual } from "node:crypto";

import { createWebsiteLead } from "@/server/website-leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;

function json(
  body: unknown,
  status: number,
  headers?: Record<string, string>
) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function normalizeOrigin(value: string | null): string {
  return (value ?? "").trim().replace(/\/$/, "");
}

function clientHash(request: Request, secret: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

export async function POST(request: Request) {
  const secret = process.env.XFLOW_SITE_SECRET?.trim();
  if (!secret) {
    return json({ ok: false, error: "O serviço de pedidos não está configurado." }, 503);
  }

  if (!secretsMatch(request.headers.get("x-xflow-site-secret"), secret)) {
    return json({ ok: false, error: "Não autorizado." }, 401);
  }

  const expectedOrigin = normalizeOrigin(process.env.XFLOW_SITE_ORIGIN ?? null);
  if (
    expectedOrigin &&
    normalizeOrigin(request.headers.get("origin")) !== expectedOrigin
  ) {
    return json({ ok: false, error: "Origem não autorizada." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "Formato de pedido inválido." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "O pedido é demasiado grande." }, 413);
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return json({ ok: false, error: "O pedido é demasiado grande." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "Não foi possível ler o pedido." }, 400);
  }

  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
  if (!idempotencyKey) {
    return json({ ok: false, error: "Pedido inválido." }, 400);
  }

  try {
    const result = await createWebsiteLead({
      payload,
      idempotencyKey,
      clientKey: clientHash(request, secret),
    });

    if (!result.ok) {
      return json(
        { ok: false, error: result.error, fields: result.fields },
        result.status,
        result.retryAfter ? { "retry-after": String(result.retryAfter) } : undefined
      );
    }

    return json(
      {
        ok: true,
        reference: result.reference,
        duplicate: result.duplicate || undefined,
      },
      result.duplicate ? 200 : 202
    );
  } catch (error) {
    console.error(
      "[proposals] falha ao registar lead:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return json({ ok: false, error: "O serviço de pedidos está indisponível." }, 503);
  }
}
