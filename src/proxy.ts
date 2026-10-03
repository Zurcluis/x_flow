import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "xflow_session";

const PUBLIC_PREFIXES = [
  "/portal/",
  "/quotes/public/",
  "/checkins/report/",
  "/qc/certificate/",
  "/warranties/certificate/",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const next = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|manifest.json|robots.txt|sitemap.xml|catalogos/|models/|mediapipe/).*)",
  ],
};
