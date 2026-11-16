import { timingSafeEqual } from "node:crypto";

export function isAuthorizedCronRequest(
  authHeader: string | null,
  expectedSecret: string | undefined
): boolean {
  const secret = expectedSecret?.trim();
  if (!secret || !authHeader) return false;
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;
  const provided = authHeader.slice(prefix.length).trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
