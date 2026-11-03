import { createHash, randomUUID } from "node:crypto";

import {
  isValidIdempotencyKey,
  validateWebsiteLeadPayload,
  type WebsiteLeadErrors,
} from "@/domains/proposals/validation";
import { Customer, PreferredChannel } from "@/domains/crm/types";
import { CustomerValidationError } from "@/domains/crm/validation";
import { getDb, waitForBootstrap } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";

export interface WebsiteLeadItem {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  vehicleText: string;
  serviceRequested: string;
  message?: string;
  status: string;
  createdAt: string;
  convertedCustomerId?: string;
}

export const WEBSITE_SERVICE_LABELS: Record<string, string> = {
  advice: "Aconselhamento",
  ppf: "PPF (Paint Protection Film)",
  car_wrap: "Car Wrap",
  color_ppf: "Color PPF",
  details: "Detalhes & Óticas",
  motorcycle: "Mota",
};

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

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapWebsiteLead(row: Record<string, unknown>): WebsiteLeadItem {
  const convertedCustomerId = row.converted_customer_id
    ? String(row.converted_customer_id)
    : undefined;
  const rawStatus = String(row.status ?? "new");
  return {
    id: String(row.id),
    reference: String(row.reference),
    name: String(row.customer_name ?? ""),
    email: String(row.customer_email ?? ""),
    phone: row.customer_phone ? String(row.customer_phone) : "",
    vehicleText: String(row.vehicle_info ?? ""),
    serviceRequested: String(row.service_requested ?? ""),
    message: row.message ? String(row.message) : undefined,
    status: convertedCustomerId ? "converted" : rawStatus,
    createdAt: iso(row.created_at),
    convertedCustomerId,
  };
}

function mapConvertedCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    type: (row.type as Customer["type"]) ?? "individual",
    name: String(row.name),
    legalName: (row.legal_name as string) ?? undefined,
    nif: (row.nif as string) ?? undefined,
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    phoneNormalized: String(row.phone_normalized ?? ""),
    preferredChannel: (row.preferred_channel as PreferredChannel) ?? "whatsapp",
    notes: (row.notes as string) ?? undefined,
    status: (row.status as Customer["status"]) ?? "lead",
    source: (row.source as string) ?? "website",
    vehicleCount: 0,
    totalSpent: 0,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function listWebsiteLeads(
  organizationId: string
): Promise<WebsiteLeadItem[]> {
  const { rows } = await getDb().query<Record<string, unknown>>(
    `SELECT id, reference, customer_name, customer_email, customer_phone,
            vehicle_info, service_requested, message, status,
            converted_customer_id, created_at
     FROM website_leads
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [organizationId]
  );

  return rows.map(mapWebsiteLead);
}

export async function convertWebsiteLeadToCustomer(
  organizationId: string,
  leadId: string
): Promise<Customer> {
  const client = await getDb().connect();
  try {
    await waitForBootstrap(client);
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_organization_id', $1, true)",
      [organizationId]
    );

    const { rows: leadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM website_leads
       WHERE organization_id = $1 AND id = $2
       FOR UPDATE`,
      [organizationId, leadId]
    );

    const lead = leadRows[0];
    if (!lead) {
      throw new CustomerValidationError("Pedido do site não encontrado.");
    }

    if (lead.converted_customer_id) {
      const { rows: existingCustomerRows } = await client.query<Record<string, unknown>>(
        `SELECT *
         FROM customers
         WHERE organization_id = $1 AND id = $2`,
        [organizationId, String(lead.converted_customer_id)]
      );
      if (existingCustomerRows[0]) {
        await client.query("COMMIT");
        return mapConvertedCustomer(existingCustomerRows[0]);
      }
    }

    const name = String(lead.customer_name ?? "").trim();
    const email = String(lead.customer_email ?? "").trim();
    const phone = lead.customer_phone ? String(lead.customer_phone).trim() : "";
    const phoneNormalized = phone.replace(/\D/g, "");
    const preferredChannel: PreferredChannel = phone ? "whatsapp" : "email";
    const serviceKey = String(lead.service_requested ?? "");
    const serviceLabel = WEBSITE_SERVICE_LABELS[serviceKey] ?? serviceKey;
    const vehicleText = String(lead.vehicle_info ?? "").trim();
    const messageText = lead.message ? String(lead.message).trim() : "";

    const noteParts = [
      `Pedido Website (${String(lead.reference)})`,
      vehicleText ? `Viatura: ${vehicleText}` : null,
      serviceLabel ? `Serviço: ${serviceLabel}` : null,
      messageText ? `Mensagem: ${messageText}` : null,
    ].filter(Boolean);

    const { rows: createdRows } = await client.query<Record<string, unknown>>(
      `INSERT INTO customers
         (organization_id, type, name, email, phone, phone_normalized,
          preferred_channel, notes, status, source)
       VALUES ($1, 'individual', $2, $3, $4, $5, $6, $7, 'lead', 'website')
       RETURNING *`,
      [
        organizationId,
        name,
        email,
        phone,
        phoneNormalized,
        preferredChannel,
        noteParts.join(" | "),
      ]
    );

    const customer = mapConvertedCustomer(createdRows[0]);

    await client.query(
      `UPDATE website_leads
       SET status = 'qualified',
           converted_customer_id = $1,
           first_response_at = COALESCE(first_response_at, NOW()),
           updated_at = NOW()
       WHERE organization_id = $2 AND id = $3`,
      [customer.id, organizationId, leadId]
    );

    await client.query("COMMIT");
    return customer;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

