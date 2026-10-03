import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { getDb, restoreBootstrapOrg } from "@/lib/db";

export const SESSION_COOKIE = "xflow_session";
const SESSION_TTL_DAYS = 30;

export type OrganizationRole =
  | "admin"
  | "workshop_manager"
  | "technician"
  | "customer"
  | "b2b_user";

export interface AuthContext {
  profileId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  organizationId: string;
}

export type PublicTokenKind =
  | "quote"
  | "checkin"
  | "delivery"
  | "warranty"
  | "qc_certificate";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>;

export interface ParsedPasswordHash {
  N: number;
  r: number;
  p: number;
  saltHex: string;
  hashHex: string;
}

export function encodePasswordHash(
  N: number,
  r: number,
  p: number,
  saltHex: string,
  hashHex: string
): string {
  return `scrypt:${N}:${r}:${p}:${saltHex}:${hashHex}`;
}

export function parsePasswordHash(stored: string): ParsedPasswordHash | null {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [, n, r, p, saltHex, hashHex] = parts;
  const N = Number(n);
  const rr = Number(r);
  const pp = Number(p);
  if (!Number.isInteger(N) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null;
  if (!saltHex || !/^[0-9a-f]+$/i.test(saltHex)) return null;
  if (!hashHex || !/^[0-9a-f]+$/i.test(hashHex)) return null;
  return { N, r: rr, p: pp, saltHex, hashHex };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
  return encodePasswordHash(16384, 8, 1, salt.toString("hex"), hash.toString("hex"));
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  try {
    const hash = await scrypt(
      password.normalize("NFKC"),
      Buffer.from(parsed.saltHex, "hex"),
      parsed.hashHex.length / 2,
      { N: parsed.N, r: parsed.r, p: parsed.p }
    );
    const expected = Buffer.from(parsed.hashHex, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export function consumeRateLimitAttempt(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (rateBuckets.size > 10000) {
      for (const [k, b] of rateBuckets) {
        if (b.resetAt <= now) rateBuckets.delete(k);
      }
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

export function clearRateLimitKey(key: string): void {
  rateBuckets.delete(key);
}

export function buildRateLimitKey(ip: string | null, email: string): string {
  return `${ip ?? "unknown"}:${email.trim().toLowerCase()}`;
}

async function rateLimitKeyFromRequest(email: string): Promise<string> {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    ip = null;
  }
  return buildRateLimitKey(ip, email);
}

export interface LoginFailure {
  error: string;
}

export async function loginAndCreateSession(
  email: string,
  password: string
): Promise<AuthContext | LoginFailure> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { error: "Introduz o email e a password." };
  }
  const rateKey = await rateLimitKeyFromRequest(normalizedEmail);
  if (!consumeRateLimitAttempt(rateKey)) {
    return { error: "Demasiadas tentativas. Tenta novamente dentro de 15 minutos." };
  }

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("SELECT set_config('app.auth_lookup_email', $1, false)", [
      normalizedEmail,
    ]);
    const profileRes = await client.query<{
      id: string;
      name: string;
      email: string;
      password_hash: string | null;
    }>(
      `SELECT p.id, p.name, p.email, p.password_hash
       FROM profiles p
       WHERE lower(p.email) = current_setting('app.auth_lookup_email', true)
       LIMIT 1`
    );
    const profile = profileRes.rows[0];
    const valid =
      profile?.password_hash != null && (await verifyPassword(password, profile.password_hash));
    if (!valid) {
      await verifyPassword(password, await getDummyPasswordHash());
      return { error: "Credenciais inválidas." };
    }

    await client.query("SELECT set_config('app.current_profile_id', $1, false)", [profile.id]);
    const orgRes = await client.query<{ organization_id: string; role: string }>(
      `SELECT m.organization_id, m.role
       FROM organization_memberships m
       WHERE m.profile_id = current_setting('app.current_profile_id', true)::uuid
         AND m.status = 'active'
       ORDER BY m.created_at
       LIMIT 1`
    );
    const membership = orgRes.rows[0];
    const organizationId = membership?.organization_id;
    if (!organizationId) {
      return { error: "Não tens organização associada. Contacta o administrador." };
    }

    const requestMeta = await requestIdentity();
    const token = randomBytes(32).toString("base64url");
    await client.query(
      `INSERT INTO auth_sessions
        (profile_id, organization_id, token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + interval '30 days')`,
      [profile.id, organizationId, hashSessionToken(token), requestMeta.userAgent, requestMeta.ip]
    );
    await client.query("UPDATE profiles SET last_login_at = NOW() WHERE id = $1", [profile.id]);

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_DAYS * 24 * 3600,
    });
    clearRateLimitKey(rateKey);

    return {
      profileId: profile.id,
      name: profile.name,
      email: profile.email,
      role: membership.role as OrganizationRole,
      organizationId,
    };
  } finally {
    await client.query("RESET app.current_profile_id").catch(() => {});
    await client.query("RESET app.auth_lookup_email").catch(() => {});
    client.release();
  }
}

async function requestIdentity(): Promise<{ userAgent: string | null; ip: string | null }> {
  try {
    const h = await headers();
    return {
      userAgent: h.get("user-agent"),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    };
  } catch {
    return { userAgent: null, ip: null };
  }
}

let dummyHashPromise: Promise<string> | null = null;

function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("xflow-no-user-placeholder");
  }
  return dummyHashPromise;
}

async function resolveSessionByToken(
  token: string
): Promise<{ profileId: string; organizationId: string; sessionId: string } | null> {
  const tokenHash = hashSessionToken(token);
  const { rows } = await getDb().query<{
    id: string;
    profile_id: string;
    organization_id: string;
  }>(
    `SELECT id, profile_id, organization_id FROM auth_sessions
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    profileId: row.profile_id,
    organizationId: row.organization_id,
    sessionId: row.id,
  };
}

async function loadAuthContext(
  profileId: string,
  organizationId: string
): Promise<AuthContext | null> {
  const client = await getDb().connect();
  try {
    await client.query("SELECT set_config('app.current_profile_id', $1, false)", [profileId]);
    await client.query("SELECT set_config('app.current_organization_id', $1, false)", [
      organizationId,
    ]);
    const { rows } = await client.query<{
      profile_id: string;
      name: string;
      email: string;
      role: string;
    }>(
      `SELECT p.id AS profile_id, p.name, p.email, m.role
       FROM profiles p
       JOIN organization_memberships m ON m.profile_id = p.id
       WHERE p.id = $1 AND m.organization_id = $2 AND m.status = 'active'
       LIMIT 1`,
      [profileId, organizationId]
    );
    await client.query("RESET app.current_profile_id");
    await restoreBootstrapOrg(client);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      profileId: r.profile_id,
      name: r.name,
      email: r.email,
      role: r.role as OrganizationRole,
      organizationId,
    };
  } finally {
    client.release();
  }
}

export async function getOptionalAuth(): Promise<AuthContext | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await resolveSessionByToken(token);
  if (!session) return null;
  return loadAuthContext(session.profileId, session.organizationId);
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getOptionalAuth();
  if (!auth) {
    redirect("/login");
  }
  return auth;
}

export async function requirePublicToken(
  kind: PublicTokenKind,
  token: string
): Promise<{ organizationId: string }> {
  const db = getDb();
  let organizationId: string | null = null;
  if (kind === "quote") {
    const { rows } = await db.query<{ organization_id: string }>(
      "SELECT organization_id FROM quotes WHERE public_token = $1 LIMIT 1",
      [token]
    );
    organizationId = rows[0]?.organization_id ?? null;
  } else if (kind === "checkin") {
    const { rows } = await db.query<{ organization_id: string }>(
      "SELECT organization_id FROM checkins WHERE token = $1 LIMIT 1",
      [token]
    );
    organizationId = rows[0]?.organization_id ?? null;
  } else if (kind === "delivery") {
    const { rows } = await db.query<{ organization_id: string }>(
      "SELECT organization_id FROM deliveries WHERE token = $1 LIMIT 1",
      [token]
    );
    organizationId = rows[0]?.organization_id ?? null;
  } else if (kind === "warranty") {
    const { rows } = await db.query<{ organization_id: string }>(
      "SELECT organization_id FROM warranties WHERE token = $1 LIMIT 1",
      [token]
    );
    organizationId = rows[0]?.organization_id ?? null;
  } else {
    const { rows } = await db.query<{ organization_id: string }>(
      `SELECT w.organization_id
       FROM qc_inspections q
       JOIN work_orders w ON w.id = q.work_order_id
       WHERE q.certificate_number = $1
       LIMIT 1`,
      [token]
    );
    organizationId = rows[0]?.organization_id ?? null;
  }
  if (!organizationId) {
    notFound();
  }
  return { organizationId };
}

export async function logoutCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().query(
      "UPDATE auth_sessions SET revoked_at = NOW() WHERE token_hash = $1",
      [hashSessionToken(token)]
    );
  }
  store.delete(SESSION_COOKIE);
}

export function canSeeFinancials(role: OrganizationRole): boolean {
  return role === "admin" || role === "workshop_manager";
}
