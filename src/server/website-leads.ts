import { createHash, randomUUID } from "node:crypto";

import {
  isValidIdempotencyKey,
  validateWebsiteLeadPayload,
  type WebsiteLeadErrors,
} from "@/domains/proposals/validation";
import { getDb, waitForBootstrap } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const CONSENT_TEXT = "Autorizo o uso dos dados para responder a este pedido.";
const DEFAULT_PRIVACY_NOTICE_VERSION = "2026-10-preliminary";

export type CreateWebsiteLeadInput = {
  payload: unknown;
  idempotencyKey: string;
  clientKey: string;
};

export type CreateWebsiteLeadResult =
  | { ok: true; reference: string; duplicate: boolean }
  | {
      ok: false;
      status: 400 | 422 | 429;
      error: string;
      fields?: WebsiteLeadErrors;
      retryAfter?: number;
    };

function privacyNoticeVersion(): string {
  return (
    process.env.XFLOW_PRIVACY_NOTICE_VERSION?.trim() ||
    DEFAULT_PRIVACY_NOTICE_VERSION
  );
}

function consentTextHash(): string {
  return createHash("sha256").update(CONSENT_TEXT).digest("hex");
}

function referenceFor(id: string): string {
  const year = new Date().getUTCFullYear();
  return `WEB-${year}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function createWebsiteLead(
  input: CreateWebsiteLeadInput
): Promise<CreateWebsiteLeadResult> {
  if (!isValidIdempotencyKey(input.idempotencyKey)) {
    return { ok: false, status: 400, error: "Pedido inválido." };
  }

  const parsed = validateWebsiteLeadPayload(input.payload);
  if (!parsed.ok) {
    if (parsed.errors.website) {
      return { ok: false, status: 400, error: "Pedido inválido." };
    }

    return {
      ok: false,
      status: 422,
      error: "Verifique os campos do formulário.",
      fields: parsed.errors,
    };
  }

  const organizationId = await getPrimaryOrganizationId();
  const client = await getDb().connect();

  try {
    await waitForBootstrap(client);
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_organization_id', $1, true)",
      [organizationId]
    );

    const rate = await client.query<{ count: number }>(
      `INSERT INTO api_rate_limits (organization_id, bucket, window_start, count, updated_at)
       VALUES ($1, $2, NOW(), 1, NOW())
       ON CONFLICT (organization_id, bucket) DO UPDATE SET
         count = CASE
           WHEN api_rate_limits.window_start <= NOW() - INTERVAL '10 minutes' THEN 1
           ELSE api_rate_limits.count + 1
         END,
         window_start = CASE
           WHEN api_rate_limits.window_start <= NOW() - INTERVAL '10 minutes' THEN NOW()
           ELSE api_rate_limits.window_start
         END,
         updated_at = NOW()
       RETURNING count`,
      [organizationId, `proposals:${input.clientKey}`]
    );

    if ((rate.rows[0]?.count ?? 0) > RATE_LIMIT_MAX) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        status: 429,
        error: "Demasiados pedidos. Tente novamente mais tarde.",
        retryAfter: RATE_LIMIT_WINDOW_MINUTES * 60,
      };
    }

    const id = randomUUID();
    const reference = referenceFor(id);

    const inserted = await client.query<{ reference: string }>(
      `INSERT INTO website_leads (
         id, organization_id, reference, idempotency_key, service_requested,
         vehicle_info, customer_name, customer_email, customer_phone, message,
         status, source, privacy_notice_version, consent_at, consent_text_hash,
         marketing_opt_in
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10,
         'new', 'website', $11, NOW(), $12,
         FALSE
       )
       ON CONFLICT (organization_id, idempotency_key) DO NOTHING
       RETURNING reference`,
      [
        id,
        organizationId,
        reference,
        input.idempotencyKey,
        parsed.data.service,
        parsed.data.vehicle,
        parsed.data.name,
        parsed.data.email,
        parsed.data.phone ?? null,
        parsed.data.message ?? null,
        privacyNoticeVersion(),
        consentTextHash(),
      ]
    );

    if (inserted.rows[0]) {
      await client.query("COMMIT");
      return { ok: true, reference: inserted.rows[0].reference, duplicate: false };
    }

    const existing = await client.query<{ reference: string }>(
      `SELECT reference
       FROM website_leads
       WHERE organization_id = $1 AND idempotency_key = $2
       LIMIT 1`,
      [organizationId, input.idempotencyKey]
    );

    await client.query("COMMIT");

    if (!existing.rows[0]) {
      throw new Error("Lead idempotente não encontrado após conflito.");
    }

    return { ok: true, reference: existing.rows[0].reference, duplicate: true };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
