import { cookies } from "next/headers";
import { getOptionalAuth, SESSION_COOKIE, type AuthContext } from "@/server/auth";
import { assistantAccessError, type AssistantViewer } from "@/server/assistant";
import { consumeAiRateLimit } from "@/server/ai/rate-limit";

export interface AssistantRouteAuth {
  auth: AuthContext;
  viewer: AssistantViewer;
  sessionSecret: string;
}

type AuthResult =
  | { ok: true; value: AssistantRouteAuth }
  | { ok: false; response: Response };

export function jsonError(
  status: number,
  error: string,
  extra: Record<string, unknown> = {}
): Response {
  return Response.json(
    { ok: false, error, ...extra },
    {
      status,
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}

export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured && origin === configured) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function authenticateAssistantRequest(): Promise<AuthResult> {
  const auth = await getOptionalAuth();
  if (!auth) {
    return {
      ok: false,
      response: jsonError(401, "A sessão expirou. Volta a entrar para usar o assistente."),
    };
  }
  if (auth.mustChangePassword) {
    return {
      ok: false,
      response: jsonError(403, "Muda a password antes de usar o assistente."),
    };
  }

  const viewer: AssistantViewer = {
    organizationId: auth.organizationId,
    profileId: auth.profileId,
    name: auth.name,
    role: auth.role,
  };

  const accessError = assistantAccessError(viewer);
  if (accessError) {
    return { ok: false, response: jsonError(403, accessError) };
  }

  const store = await cookies();
  const sessionSecret = store.get(SESSION_COOKIE)?.value;
  if (!sessionSecret) {
    return {
      ok: false,
      response: jsonError(401, "A sessão expirou. Volta a entrar para usar o assistente."),
    };
  }

  return { ok: true, value: { auth, viewer, sessionSecret } };
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Response | null {
  const result = consumeAiRateLimit(key, limit, windowMs);
  if (result.ok) return null;
  return Response.json(
    {
      ok: false,
      error: "Demasiados pedidos ao assistente. Aguarda um pouco e tenta novamente.",
    },
    {
      status: 429,
      headers: {
        "cache-control": "no-store",
        "retry-after": String(result.retryAfterSeconds),
      },
    }
  );
}
