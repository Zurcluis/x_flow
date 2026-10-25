import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const MAX_TTL_MS = 15 * 60 * 1000;

interface TokenPayload {
  text: string;
  expiresAt: number;
  profileId: string;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSpeechToken(
  text: string,
  profileId: string,
  secret: string,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now()
): string {
  const safeTtl = Math.min(Math.max(1000, ttlMs), MAX_TTL_MS);
  const payload: TokenPayload = {
    text,
    expiresAt: now + safeTtl,
    profileId,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifySpeechToken(
  token: string,
  profileId: string,
  secret: string,
  now = Date.now()
): string | null {
  if (!token || token.length > 12000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, provided] = parts;
  if (!encoded || !provided) return null;

  const expected = signature(encoded, secret);
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded)) as TokenPayload;
  } catch {
    return null;
  }

  if (
    typeof payload.text !== "string" ||
    typeof payload.profileId !== "string" ||
    typeof payload.expiresAt !== "number"
  ) {
    return null;
  }
  if (payload.profileId !== profileId) return null;
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) return null;
  if (payload.expiresAt > now + MAX_TTL_MS + 5000) return null;

  return payload.text;
}
