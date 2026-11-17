// Next may normalize request.url to localhost; Host retains the requested site.
// Browsers cannot forge Host. Do not use an arbitrary client-supplied target URL.
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const target = new URL(request.url);
    const incoming = new URL(origin);
    const host = request.headers.get("host") || target.host;
    const forwarded = request.headers.get("x-forwarded-proto");
    const protocol =
      forwarded === "https" || forwarded === "http" ? `${forwarded}:` : target.protocol;
    return (
      (incoming.protocol === "https:" || incoming.protocol === "http:") &&
      incoming.origin === origin &&
      incoming.host === host &&
      incoming.protocol === protocol
    );
  } catch {
    return false;
  }
}
