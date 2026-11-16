import type { PoolClient } from "pg";
import { CustomerValidationError, isValidCustomerEmail, normalizePhoneDigits, parseOptionalText, parseRequiredText } from "@/domains/crm/validation";
import type { Customer, PreferredChannel } from "@/domains/crm/types";
import {
  buildMessageSnippet,
  classifyInboxThread,
  computeThreadStatus,
  normalizeContactHandle,
} from "@/domains/inbox/rules";
import type {
  InboxAttachment,
  InboxCategory,
  InboxChannel,
  InboxChannelAccount,
  InboxChannelStatus,
  InboxMessageRecord,
  InboxShareableQuote,
  InboxThreadRecord,
  InboxThreadStatus,
  SyncNormalizedMessage,
} from "@/domains/inbox/types";
import { getDb, waitForBootstrap } from "@/lib/db";

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const s = String(value).trim();
  return s ? s : null;
}

export async function withOrgTransaction<T>(
  organizationId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDb().connect();
  try {
    await waitForBootstrap(client);
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_organization_id', $1, true)", [
      organizationId,
    ]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function mapChannelAccount(row: Record<string, unknown>): InboxChannelAccount {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    channel: row.channel as InboxChannel,
    provider: (row.provider as "composio" | "oauth") ?? "composio",
    externalAccountId: String(row.external_account_id),
    displayHandle: String(row.display_handle),
    status: (row.status as InboxChannelStatus) ?? "active",
    syncCursor:
      row.sync_cursor && typeof row.sync_cursor === "object"
        ? (row.sync_cursor as Record<string, unknown>)
        : {},
    lastSyncedAt: toIsoOrNull(row.last_synced_at),
    lastError: row.last_error ? String(row.last_error) : null,
  };
}

function mapThread(row: Record<string, unknown>): InboxThreadRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    channelAccountId: String(row.channel_account_id),
    channel: row.channel as InboxChannel,
    externalThreadId: String(row.external_thread_id),
    participantName: row.participant_name ? String(row.participant_name) : null,
    participantHandle: row.participant_handle ? String(row.participant_handle) : null,
    participantExternalId: row.participant_external_id ? String(row.participant_external_id) : null,
    subject: row.subject ? String(row.subject) : null,
    snippet: row.snippet ? String(row.snippet) : null,
    category: (row.category as InboxCategory) ?? "other",
    status: (row.status as InboxThreadStatus) ?? "unread",
    unreadCount: Number(row.unread_count ?? 0),
    lastMessageAt: toIso(row.last_message_at),
    lastInboundAt: toIsoOrNull(row.last_inbound_at),
    lastOutboundAt: toIsoOrNull(row.last_outbound_at),
    linkedCustomerId: row.linked_customer_id ? String(row.linked_customer_id) : null,
    linkedVehicleId: row.linked_vehicle_id ? String(row.linked_vehicle_id) : null,
    linkedQuoteId: row.linked_quote_id ? String(row.linked_quote_id) : null,
    aiSummary: row.ai_summary ? String(row.ai_summary) : null,
    aiExtractedVehicle: row.ai_extracted_vehicle ? String(row.ai_extracted_vehicle) : null,
    aiExtractedService: row.ai_extracted_service ? String(row.ai_extracted_service) : null,
  };
}

function mapMessage(row: Record<string, unknown>): InboxMessageRecord {
  const rawAttachments = Array.isArray(row.attachments) ? row.attachments : [];
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    threadId: String(row.thread_id),
    externalMessageId: String(row.external_message_id),
    direction: row.direction as "inbound" | "outbound",
    senderName: row.sender_name ? String(row.sender_name) : null,
    senderHandle: row.sender_handle ? String(row.sender_handle) : null,
    recipientHandle: row.recipient_handle ? String(row.recipient_handle) : null,
    bodyText: String(row.body_text ?? ""),
    bodyHtmlSanitized: row.body_html_sanitized ? String(row.body_html_sanitized) : null,
    attachments: rawAttachments as InboxAttachment[],
    sentAt: toIso(row.sent_at),
    sentByProfileId: row.sent_by_profile_id ? String(row.sent_by_profile_id) : null,
  };
}

export async function listInboxChannelAccounts(
  organizationId: string
): Promise<InboxChannelAccount[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_channel_accounts
       WHERE organization_id = $1
       ORDER BY channel ASC, created_at ASC`,
      [organizationId]
    );
    return rows.map(mapChannelAccount);
  });
}

export async function upsertChannelAccount(
  organizationId: string,
  input: {
    channel: InboxChannel;
    provider?: "composio" | "oauth";
    externalAccountId: string;
    displayHandle: string;
    status?: InboxChannelStatus;
  }
): Promise<InboxChannelAccount> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `INSERT INTO inbox_channel_accounts (
         organization_id, channel, provider, external_account_id, display_handle, status
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, channel, external_account_id) DO UPDATE SET
         display_handle = EXCLUDED.display_handle,
         status = CASE
           WHEN inbox_channel_accounts.status = 'paused' THEN 'paused'
           ELSE EXCLUDED.status
         END,
         updated_at = NOW()
       RETURNING *`,
      [
        organizationId,
        input.channel,
        input.provider ?? "composio",
        input.externalAccountId,
        input.displayHandle,
        input.status ?? "active",
      ]
    );
    return mapChannelAccount(rows[0]);
  });
}

export async function updateChannelSyncState(
  organizationId: string,
  channelAccountId: string,
  input: {
    status?: InboxChannelStatus;
    syncCursor?: Record<string, unknown>;
    lastError?: string | null;
    markSyncedNow?: boolean;
  }
): Promise<void> {
  await withOrgTransaction(organizationId, async (client) => {
    await client.query(
      `UPDATE inbox_channel_accounts
       SET status = COALESCE($3, status),
           sync_cursor = CASE
             WHEN $4::jsonb IS NOT NULL THEN sync_cursor || $4::jsonb
             ELSE sync_cursor
           END,
           last_error = $5,
           last_synced_at = CASE WHEN $6 THEN NOW() ELSE last_synced_at END,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2`,
      [
        organizationId,
        channelAccountId,
        input.status ?? null,
        input.syncCursor ? JSON.stringify(input.syncCursor) : null,
        input.lastError ?? null,
        Boolean(input.markSyncedNow),
      ]
    );
  });
}

async function findMatchingCustomerId(
  client: PoolClient,
  organizationId: string,
  channel: InboxChannel,
  handle: string | null
): Promise<string | null> {
  const normalized = normalizeContactHandle(handle, channel);
  if (!normalized) return null;

  if (channel === "gmail") {
    const { rows } = await client.query<{ id: string }>(
      `SELECT id
       FROM customers
       WHERE organization_id = $1 AND lower(email) = $2
       LIMIT 1`,
      [organizationId, normalized]
    );
    return rows[0]?.id ?? null;
  }

  const stripped = normalized.replace(/^@+/, "");
  const { rows } = await client.query<{ id: string }>(
    `SELECT id
     FROM customers
     WHERE organization_id = $1
       AND instagram_handle IS NOT NULL
       AND lower(ltrim(instagram_handle, '@')) = $2
     LIMIT 1`,
    [organizationId, stripped]
  );
  return rows[0]?.id ?? null;
}

function maxIsoDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export async function upsertThreadBatch(
  organizationId: string,
  channelAccountId: string,
  channel: InboxChannel,
  messages: SyncNormalizedMessage[]
): Promise<{ threadsUpserted: number; messagesInserted: number }> {
  if (messages.length === 0) {
    return { threadsUpserted: 0, messagesInserted: 0 };
  }

  const grouped = new Map<string, SyncNormalizedMessage[]>();
  for (const msg of messages) {
    const existing = grouped.get(msg.externalThreadId) ?? [];
    existing.push(msg);
    grouped.set(msg.externalThreadId, existing);
  }

  return withOrgTransaction(organizationId, async (client) => {
    let threadsUpserted = 0;
    let messagesInserted = 0;

    for (const [externalThreadId, rawGroup] of grouped.entries()) {
      const group = [...rawGroup].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
      const latestMsg = group[group.length - 1];
      const latestInbound = [...group].reverse().find((m) => m.direction === "inbound");
      const latestOutbound = [...group].reverse().find((m) => m.direction === "outbound");

      const participantHandleRaw =
        latestInbound?.senderHandle ??
        latestOutbound?.recipientHandle ??
        latestMsg.senderHandle ??
        null;
      const participantHandle = participantHandleRaw
        ? normalizeContactHandle(participantHandleRaw, channel)
        : null;
      const participantName =
        latestInbound?.senderName ?? (participantHandle || null);
      const participantExternalId = latestInbound?.senderExternalId ?? null;
      const subject = group.find((m) => Boolean(m.subject))?.subject ?? null;

      const { rows: existingRows } = await client.query<Record<string, unknown>>(
        `SELECT *
         FROM inbox_threads
         WHERE organization_id = $1 AND channel = $2 AND external_thread_id = $3
         FOR UPDATE`,
        [organizationId, channel, externalThreadId]
      );
      const existing = existingRows[0];

      const existingLastInbound = existing ? toIsoOrNull(existing.last_inbound_at) : null;
      const existingLastOutbound = existing ? toIsoOrNull(existing.last_outbound_at) : null;
      const existingLastMsg = existing ? toIsoOrNull(existing.last_message_at) : null;

      const mergedInboundAt = maxIsoDate(existingLastInbound, latestInbound?.sentAt ?? null);
      const mergedOutboundAt = maxIsoDate(existingLastOutbound, latestOutbound?.sentAt ?? null);
      const mergedLastMessageAt =
        maxIsoDate(existingLastMsg, latestMsg.sentAt) ?? new Date().toISOString();

      const useNewLatestContent =
        !existingLastMsg || Date.parse(latestMsg.sentAt) >= Date.parse(existingLastMsg);
      const snippet = useNewLatestContent
        ? buildMessageSnippet(latestMsg.bodyText || (latestMsg.attachments.length ? "[Anexo]" : ""))
        : existing?.snippet
          ? String(existing.snippet)
          : "";

      const computedCategory = classifyInboxThread({
        channel,
        senderHandle: participantHandle,
        subject: subject ?? (existing?.subject ? String(existing.subject) : null),
        text: `${snippet} ${group.map((m) => m.bodyText).join(" ")}`,
      });

      const finalCategory: InboxCategory =
        existing && existing.category && String(existing.category) !== "other"
          ? (String(existing.category) as InboxCategory)
          : computedCategory;

      const matchedCustomerId =
        existing?.linked_customer_id
          ? String(existing.linked_customer_id)
          : await findMatchingCustomerId(client, organizationId, channel, participantHandle);

      const hasUnreadInbound =
        group.some((m) => m.direction === "inbound" && m.isUnread) ||
        (!existing && Boolean(latestInbound));

      const finalStatus = computeThreadStatus({
        currentStatus: existing ? (String(existing.status) as InboxThreadStatus) : null,
        hasUnreadInbound,
        lastInboundAt: mergedInboundAt,
        lastOutboundAt: mergedOutboundAt,
        linkedQuoteId: existing?.linked_quote_id ? String(existing.linked_quote_id) : null,
      });

      const unreadCount =
        finalStatus === "replied" || finalStatus === "archived"
          ? 0
          : Math.max(
              Number(existing?.unread_count ?? 0),
              group.filter((m) => m.direction === "inbound" && m.isUnread).length
            );

      const { rows: upsertedThreadRows } = await client.query<{ id: string }>(
        `INSERT INTO inbox_threads (
           organization_id, channel_account_id, channel, external_thread_id,
           participant_name, participant_handle, participant_external_id,
           subject, snippet, category, status, unread_count,
           last_message_at, last_inbound_at, last_outbound_at, linked_customer_id
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7,
           $8, $9, $10, $11, $12,
           $13, $14, $15, $16
         )
         ON CONFLICT (organization_id, channel, external_thread_id) DO UPDATE SET
           participant_name = COALESCE(inbox_threads.participant_name, EXCLUDED.participant_name),
           participant_handle = COALESCE(inbox_threads.participant_handle, EXCLUDED.participant_handle),
           participant_external_id = COALESCE(EXCLUDED.participant_external_id, inbox_threads.participant_external_id),
           subject = COALESCE(inbox_threads.subject, EXCLUDED.subject),
           snippet = CASE
             WHEN EXCLUDED.last_message_at >= inbox_threads.last_message_at THEN EXCLUDED.snippet
             ELSE inbox_threads.snippet
           END,
           category = $10,
           status = $11,
           unread_count = $12,
           last_message_at = GREATEST(inbox_threads.last_message_at, EXCLUDED.last_message_at),
           last_inbound_at = COALESCE(
             GREATEST(inbox_threads.last_inbound_at, EXCLUDED.last_inbound_at),
             inbox_threads.last_inbound_at,
             EXCLUDED.last_inbound_at
           ),
           last_outbound_at = COALESCE(
             GREATEST(inbox_threads.last_outbound_at, EXCLUDED.last_outbound_at),
             inbox_threads.last_outbound_at,
             EXCLUDED.last_outbound_at
           ),
           linked_customer_id = COALESCE(inbox_threads.linked_customer_id, EXCLUDED.linked_customer_id),
           updated_at = NOW()
         RETURNING id`,
        [
          organizationId,
          channelAccountId,
          channel,
          externalThreadId,
          participantName,
          participantHandle,
          participantExternalId,
          subject,
          snippet,
          finalCategory,
          finalStatus,
          unreadCount,
          mergedLastMessageAt,
          mergedInboundAt,
          mergedOutboundAt,
          matchedCustomerId,
        ]
      );

      const threadId = upsertedThreadRows[0].id;
      threadsUpserted += 1;

      for (const msg of group) {
        const { rowCount } = await client.query(
          `INSERT INTO inbox_messages (
             organization_id, thread_id, external_message_id, direction,
             sender_name, sender_handle, recipient_handle,
             body_text, attachments, sent_at
           ) VALUES (
             $1, $2, $3, $4,
             $5, $6, $7,
             $8, $9::jsonb, $10
           )
           ON CONFLICT (organization_id, external_message_id) DO NOTHING`,
          [
            organizationId,
            threadId,
            msg.externalMessageId,
            msg.direction,
            msg.senderName,
            msg.senderHandle,
            msg.recipientHandle,
            msg.bodyText,
            JSON.stringify(msg.attachments),
            msg.sentAt,
          ]
        );
        if ((rowCount ?? 0) > 0) {
          messagesInserted += 1;
        }
      }
    }

    return { threadsUpserted, messagesInserted };
  });
}

export async function getStoredThreadTimestamps(
  organizationId: string,
  channel: InboxChannel
): Promise<Map<string, string>> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<{
      external_thread_id: string;
      last_message_at: Date | string;
    }>(
      `SELECT external_thread_id, last_message_at
       FROM inbox_threads
       WHERE organization_id = $1 AND channel = $2`,
      [organizationId, channel]
    );
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.external_thread_id, toIso(row.last_message_at));
    }
    return map;
  });
}

export async function listInboxThreads(
  organizationId: string,
  options: {
    channel?: InboxChannel;
    category?: InboxCategory;
    status?: InboxThreadStatus;
    limit?: number;
  } = {}
): Promise<InboxThreadRecord[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const conditions: string[] = ["organization_id = $1"];
    const params: unknown[] = [organizationId];

    if (options.channel) {
      params.push(options.channel);
      conditions.push(`channel = $${params.length}`);
    }
    if (options.category) {
      params.push(options.category);
      conditions.push(`category = $${params.length}`);
    }
    if (options.status) {
      params.push(options.status);
      conditions.push(`status = $${params.length}`);
    }

    const limit = Math.min(Math.max(options.limit ?? 100, 1), 250);
    params.push(limit);

    const { rows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE ${conditions.join(" AND ")}
       ORDER BY last_message_at DESC
       LIMIT $${params.length}`,
      params
    );
    return rows.map(mapThread);
  });
}

export async function getInboxThreadWithMessages(
  organizationId: string,
  threadId: string
): Promise<{ thread: InboxThreadRecord; messages: InboxMessageRecord[] } | null> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: threadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [organizationId, threadId]
    );
    if (!threadRows[0]) return null;

    const { rows: msgRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_messages
       WHERE organization_id = $1 AND thread_id = $2
       ORDER BY sent_at ASC, created_at ASC`,
      [organizationId, threadId]
    );

    return {
      thread: mapThread(threadRows[0]),
      messages: msgRows.map(mapMessage),
    };
  });
}

export interface InboxSummaryCounts {
  total: number;
  needsReply: number;
  leads: number;
  gmail: number;
  instagram: number;
  archived: number;
}

export async function getInboxSummaryCounts(organizationId: string): Promise<InboxSummaryCounts> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<{
      total: number;
      needs_reply: number;
      leads: number;
      gmail: number;
      instagram: number;
      archived: number;
    }>(
      `SELECT
         count(*) FILTER (WHERE status <> 'archived')::int AS total,
         count(*) FILTER (WHERE status IN ('unread', 'needs_reply'))::int AS needs_reply,
         count(*) FILTER (WHERE category = 'lead' AND status <> 'archived')::int AS leads,
         count(*) FILTER (WHERE channel = 'gmail' AND status <> 'archived')::int AS gmail,
         count(*) FILTER (WHERE channel = 'instagram' AND status <> 'archived')::int AS instagram,
         count(*) FILTER (WHERE status = 'archived')::int AS archived
       FROM inbox_threads
       WHERE organization_id = $1`,
      [organizationId]
    );
    const row = rows[0];
    return {
      total: row?.total ?? 0,
      needsReply: row?.needs_reply ?? 0,
      leads: row?.leads ?? 0,
      gmail: row?.gmail ?? 0,
      instagram: row?.instagram ?? 0,
      archived: row?.archived ?? 0,
    };
  });
}

const VALID_CATEGORIES = new Set<InboxCategory>([
  "lead",
  "supplier",
  "admin",
  "hr",
  "security",
  "other",
]);
const VALID_STATUSES = new Set<InboxThreadStatus>([
  "unread",
  "needs_reply",
  "replied",
  "converted",
  "archived",
]);

export async function updateInboxThreadMetadata(
  organizationId: string,
  threadId: string,
  patch: {
    category?: InboxCategory;
    status?: InboxThreadStatus;
  }
): Promise<InboxThreadRecord | null> {
  if (patch.category && !VALID_CATEGORIES.has(patch.category)) {
    throw new CustomerValidationError("Categoria inválida.");
  }
  if (patch.status && !VALID_STATUSES.has(patch.status)) {
    throw new CustomerValidationError("Estado inválido.");
  }

  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `UPDATE inbox_threads
       SET category = COALESCE($3, category),
           status = COALESCE($4, status),
           unread_count = CASE
             WHEN $4 IN ('replied', 'archived') THEN 0
             ELSE unread_count
           END,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, threadId, patch.category ?? null, patch.status ?? null]
    );
    return rows[0] ? mapThread(rows[0]) : null;
  });
}

function mapLinkedCustomerRow(row: Record<string, unknown>): Customer {
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
    instagramHandle: row.instagram_handle ? String(row.instagram_handle) : undefined,
    preferredChannel: (row.preferred_channel as PreferredChannel) ?? "whatsapp",
    notes: (row.notes as string) ?? undefined,
    status: (row.status as Customer["status"]) ?? "lead",
    source: (row.source as string) ?? "direct",
    vehicleCount: 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function linkInboxThreadToCustomer(
  organizationId: string,
  threadId: string,
  customerId: string | null
): Promise<{ thread: InboxThreadRecord; customer: Customer | null }> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: threadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1 AND id = $2
       FOR UPDATE`,
      [organizationId, threadId]
    );
    const thread = threadRows[0];
    if (!thread) {
      throw new CustomerValidationError("Conversa não encontrada.");
    }

    let customer: Customer | null = null;
    if (customerId) {
      const { rows: customerRows } = await client.query<Record<string, unknown>>(
        `SELECT *
         FROM customers
         WHERE organization_id = $1 AND id = $2
         LIMIT 1`,
        [organizationId, customerId]
      );
      if (!customerRows[0]) {
        throw new CustomerValidationError("Cliente não encontrado nesta organização.");
      }

      if (thread.channel === "instagram" && thread.participant_handle && !customerRows[0].instagram_handle) {
        await client.query(
          `UPDATE customers
           SET instagram_handle = $3, updated_at = NOW()
           WHERE organization_id = $1 AND id = $2`,
          [organizationId, customerId, String(thread.participant_handle)]
        );
      }

      customer = mapLinkedCustomerRow(customerRows[0]);
    }

    const { rows: updatedRows } = await client.query<Record<string, unknown>>(
      `UPDATE inbox_threads
       SET linked_customer_id = $3,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, threadId, customerId]
    );

    return { thread: mapThread(updatedRows[0]), customer };
  });
}

export async function convertInboxThreadToCustomer(
  organizationId: string,
  threadId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    instagramHandle?: string;
    notes?: string;
    type?: "individual" | "business";
  } = {}
): Promise<{ thread: InboxThreadRecord; customer: Customer; reusedExisting: boolean }> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: threadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1 AND id = $2
       FOR UPDATE`,
      [organizationId, threadId]
    );
    const thread = threadRows[0];
    if (!thread) {
      throw new CustomerValidationError("Conversa não encontrada.");
    }

    const channel = thread.channel as InboxChannel;
    if (thread.linked_customer_id) {
      const { rows: existingRows } = await client.query<Record<string, unknown>>(
        `SELECT * FROM customers WHERE organization_id = $1 AND id = $2 LIMIT 1`,
        [organizationId, String(thread.linked_customer_id)]
      );
      if (existingRows[0]) {
        return {
          thread: mapThread(thread),
          customer: mapLinkedCustomerRow(existingRows[0]),
          reusedExisting: true,
        };
      }
    }

    const defaultName =
      (thread.participant_name ? String(thread.participant_name) : null) ||
      (thread.participant_handle ? String(thread.participant_handle) : null) ||
      "Contacto";
    const name = parseRequiredText(input.name ?? defaultName, "O nome", 255);

    const rawEmail =
      input.email !== undefined
        ? parseOptionalText(input.email, "O email", 255) ?? ""
        : channel === "gmail" && thread.participant_handle
          ? String(thread.participant_handle)
          : "";
    if (rawEmail && !isValidCustomerEmail(rawEmail)) {
      throw new CustomerValidationError("O email indicado não é válido.");
    }

    const rawPhone = parseOptionalText(input.phone, "O telefone", 50) ?? "";
    const phoneNormalized = normalizePhoneDigits(rawPhone);

    const rawIg =
      input.instagramHandle !== undefined
        ? parseOptionalText(input.instagramHandle, "O Instagram", 100)
        : channel === "instagram" && thread.participant_handle
          ? String(thread.participant_handle)
          : undefined;
    const instagramHandle = rawIg ? normalizeContactHandle(rawIg, "instagram") : null;

    if (!rawEmail && !rawPhone && !instagramHandle) {
      throw new CustomerValidationError("Indica email, telefone ou @instagram do cliente.");
    }

    // Evitar duplicado se já existir cliente com mesmo email ou @instagram
    let matchedRow: Record<string, unknown> | undefined;
    if (rawEmail) {
      const { rows } = await client.query<Record<string, unknown>>(
        `SELECT * FROM customers WHERE organization_id = $1 AND lower(email) = $2 LIMIT 1`,
        [organizationId, rawEmail.toLowerCase()]
      );
      matchedRow = rows[0];
    }
    if (!matchedRow && instagramHandle) {
      const stripped = instagramHandle.replace(/^@+/, "");
      const { rows } = await client.query<Record<string, unknown>>(
        `SELECT * FROM customers
         WHERE organization_id = $1 AND instagram_handle IS NOT NULL
           AND lower(ltrim(instagram_handle, '@')) = $2
         LIMIT 1`,
        [organizationId, stripped]
      );
      matchedRow = rows[0];
    }

    let customer: Customer;
    let reusedExisting = false;

    if (matchedRow) {
      customer = mapLinkedCustomerRow(matchedRow);
      reusedExisting = true;
    } else {
      const preferredChannel: PreferredChannel = rawPhone
        ? "whatsapp"
        : rawEmail
          ? "email"
          : "whatsapp";
      const source = channel === "instagram" ? "instagram" : "direct";
      const noteParts = [
        `Origem: ${channel === "instagram" ? "Instagram Direct" : "Email Gmail"}`,
        thread.subject ? `Assunto: ${String(thread.subject)}` : null,
        input.notes?.trim()
          ? input.notes.trim()
          : thread.snippet
            ? `Mensagem: ${String(thread.snippet)}`
            : null,
      ].filter(Boolean);

      const { rows: insertedRows } = await client.query<Record<string, unknown>>(
        `INSERT INTO customers (
           organization_id, type, name, email, phone, phone_normalized,
           instagram_handle, preferred_channel, notes, status, source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'lead', $10)
         RETURNING *`,
        [
          organizationId,
          input.type ?? "individual",
          name,
          rawEmail.toLowerCase(),
          rawPhone,
          phoneNormalized,
          instagramHandle,
          preferredChannel,
          noteParts.join(" | "),
          source,
        ]
      );
      customer = mapLinkedCustomerRow(insertedRows[0]);
    }

    const { rows: updatedThreadRows } = await client.query<Record<string, unknown>>(
      `UPDATE inbox_threads
       SET linked_customer_id = $3,
           category = CASE WHEN category = 'other' THEN 'lead' ELSE category END,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, threadId, customer.id]
    );

    return {
      thread: mapThread(updatedThreadRows[0]),
      customer,
      reusedExisting,
    };
  });
}

export interface InboxSendContext {
  thread: InboxThreadRecord;
  account: InboxChannelAccount;
  recentDuplicateSent: boolean;
}

export async function getInboxSendContext(
  organizationId: string,
  threadId: string,
  candidateBodyText: string
): Promise<InboxSendContext | null> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: threadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [organizationId, threadId]
    );
    if (!threadRows[0]) return null;

    const thread = mapThread(threadRows[0]);
    const { rows: accountRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_channel_accounts
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [organizationId, thread.channelAccountId]
    );
    if (!accountRows[0]) return null;

    const { rows: dupRows } = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n
       FROM inbox_messages
       WHERE organization_id = $1
         AND thread_id = $2
         AND direction = 'outbound'
         AND body_text = $3
         AND sent_at > NOW() - INTERVAL '30 seconds'`,
      [organizationId, threadId, candidateBodyText]
    );

    return {
      thread,
      account: mapChannelAccount(accountRows[0]),
      recentDuplicateSent: (dupRows[0]?.n ?? 0) > 0,
    };
  });
}

export async function recordOutboundInboxMessage(
  organizationId: string,
  input: {
    threadId: string;
    externalMessageId: string;
    senderHandle: string;
    recipientHandle: string | null;
    bodyText: string;
    sentAt: string;
    sentByProfileId: string;
  }
): Promise<{ thread: InboxThreadRecord; message: InboxMessageRecord }> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: threadRows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1 AND id = $2
       FOR UPDATE`,
      [organizationId, input.threadId]
    );
    const existing = threadRows[0];
    if (!existing) {
      throw new CustomerValidationError("Conversa não encontrada.");
    }

    const { rows: msgRows } = await client.query<Record<string, unknown>>(
      `INSERT INTO inbox_messages (
         organization_id, thread_id, external_message_id, direction,
         sender_name, sender_handle, recipient_handle,
         body_text, attachments, sent_at, sent_by_profile_id
       ) VALUES (
         $1, $2, $3, 'outbound',
         'X-Motion', $4, $5,
         $6, '[]'::jsonb, $7, $8
       )
       ON CONFLICT (organization_id, external_message_id) DO UPDATE SET
         body_text = EXCLUDED.body_text
       RETURNING *`,
      [
        organizationId,
        input.threadId,
        input.externalMessageId,
        input.senderHandle,
        input.recipientHandle,
        input.bodyText,
        input.sentAt,
        input.sentByProfileId,
      ]
    );

    const snippet = buildMessageSnippet(input.bodyText);
    const nextStatus = computeThreadStatus({
      currentStatus: String(existing.status) as InboxThreadStatus,
      lastInboundAt: toIsoOrNull(existing.last_inbound_at),
      lastOutboundAt: input.sentAt,
      linkedQuoteId: existing.linked_quote_id ? String(existing.linked_quote_id) : null,
    });

    const { rows: updatedRows } = await client.query<Record<string, unknown>>(
      `UPDATE inbox_threads
       SET snippet = $3,
           status = $4,
           unread_count = 0,
           last_message_at = GREATEST(last_message_at, $5::timestamptz),
           last_outbound_at = COALESCE(GREATEST(last_outbound_at, $5::timestamptz), $5::timestamptz),
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, input.threadId, snippet, nextStatus, input.sentAt]
    );

    if (existing.linked_customer_id) {
      const commType = String(existing.channel) === "gmail" ? "email" : "note";
      const commSummary = `${
        String(existing.channel) === "gmail" ? "[Gmail]" : "[Instagram DM]"
      } ${snippet}`.slice(0, 500);
      await client.query(
        `INSERT INTO customer_communications (
           customer_id, type, direction, summary, author_id
         ) VALUES ($1, $2, 'outbound', $3, $4)`,
        [String(existing.linked_customer_id), commType, commSummary, input.sentByProfileId]
      );
    }

    return {
      thread: mapThread(updatedRows[0]),
      message: mapMessage(msgRows[0]),
    };
  });
}

export async function listCustomerShareableQuotes(
  organizationId: string,
  customerId: string
): Promise<InboxShareableQuote[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<{
      id: string;
      quote_number: string;
      status: string;
      public_token: string;
    }>(
      `SELECT id, quote_number, status, public_token
       FROM quotes
       WHERE organization_id = $1
         AND customer_id = $2
         AND status <> 'draft'
         AND public_token IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 10`,
      [organizationId, customerId]
    );

    return rows.map((row) => ({
      id: String(row.id),
      quoteNumber: String(row.quote_number),
      status: String(row.status),
      publicToken: String(row.public_token),
    }));
  });
}

export async function listThreadsNeedingAiEnrichment(
  organizationId: string,
  limit = 5
): Promise<InboxThreadRecord[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const { rows } = await client.query<Record<string, unknown>>(
      `SELECT *
       FROM inbox_threads
       WHERE organization_id = $1
         AND ai_summary IS NULL
         AND status IN ('unread', 'needs_reply')
         AND category <> 'security'
       ORDER BY last_message_at DESC
       LIMIT $2`,
      [organizationId, safeLimit]
    );
    return rows.map(mapThread);
  });
}

export async function saveThreadAiInsights(
  organizationId: string,
  threadId: string,
  insights: {
    summary: string;
    extractedVehicle?: string | null;
    extractedService?: string | null;
    suggestedCategory?: InboxCategory | null;
  }
): Promise<InboxThreadRecord | null> {
  const validSuggestedCategory =
    insights.suggestedCategory && VALID_CATEGORIES.has(insights.suggestedCategory)
      ? insights.suggestedCategory
      : null;

  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `UPDATE inbox_threads
       SET ai_summary = $3,
           ai_extracted_vehicle = $4,
           ai_extracted_service = $5,
           category = CASE
             WHEN category = 'other' AND $6 IS NOT NULL THEN $6
             ELSE category
           END,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [
        organizationId,
        threadId,
        insights.summary.slice(0, 320),
        insights.extractedVehicle ? insights.extractedVehicle.slice(0, 120) : null,
        insights.extractedService ? insights.extractedService.slice(0, 120) : null,
        validSuggestedCategory,
      ]
    );
    return rows[0] ? mapThread(rows[0]) : null;
  });
}
