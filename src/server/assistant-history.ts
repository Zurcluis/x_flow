import type { PoolClient } from "pg";

import type { AssistantReference } from "@/domains/assistant/types";
import { getDb, waitForBootstrap } from "@/lib/db";
import type { AssistantViewer } from "@/server/assistant";

export interface AssistantConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface AssistantHistoryMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  references: AssistantReference[];
  engine: string | null;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: AssistantHistoryMessage[];
}

export interface RecordAssistantExchangeInput {
  conversationId?: string | null;
  question: string;
  answer: string;
  references: AssistantReference[];
  engine?: string | null;
}

const MAX_CONVERSATIONS = 40;
const MAX_MESSAGES = 200;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function titleFromQuestion(question: string): string {
  const clean = question.replace(/\s+/g, " ").trim();
  if (clean.length <= 120) return clean || "Conversa";
  return `${clean.slice(0, 117)}...`;
}

async function withHistoryClient<T>(
  viewer: AssistantViewer,
  task: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDb().connect();
  try {
    await waitForBootstrap(client);
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_organization_id', $1, true)",
      [viewer.organizationId]
    );
    await client.query(
      "SELECT set_config('app.current_profile_id', $1, true)",
      [viewer.profileId]
    );
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function parseReferences(value: unknown): AssistantReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (typeof record.label !== "string" || typeof record.href !== "string") {
      return [];
    }
    return [{ label: record.label, href: record.href }];
  });
}

export async function listAssistantConversations(
  viewer: AssistantViewer
): Promise<AssistantConversationSummary[]> {
  return withHistoryClient(viewer, async (client) => {
    const { rows } = await client.query<{
      id: string;
      title: string;
      updated_at: Date;
      message_count: number;
    }>(
      `SELECT c.id, c.title, c.updated_at, count(m.id)::int AS message_count
       FROM assistant_conversations c
       LEFT JOIN assistant_messages m ON m.conversation_id = c.id
       WHERE c.organization_id = $1 AND c.profile_id = $2
       GROUP BY c.id
       ORDER BY c.updated_at DESC
       LIMIT $3`,
      [viewer.organizationId, viewer.profileId, MAX_CONVERSATIONS]
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at.toISOString(),
      messageCount: row.message_count,
    }));
  });
}

export async function getAssistantConversation(
  viewer: AssistantViewer,
  conversationId: string
): Promise<AssistantConversation | null> {
  if (!isUuid(conversationId)) return null;

  return withHistoryClient(viewer, async (client) => {
    const conversation = await client.query<{
      id: string;
      title: string;
      updated_at: Date;
    }>(
      `SELECT id, title, updated_at
       FROM assistant_conversations
       WHERE id = $1 AND organization_id = $2 AND profile_id = $3
       LIMIT 1`,
      [conversationId, viewer.organizationId, viewer.profileId]
    );
    const row = conversation.rows[0];
    if (!row) return null;

    const messages = await client.query<{
      id: string;
      role: "user" | "assistant";
      content: string;
      references_json: unknown;
      engine: string | null;
      created_at: Date;
    }>(
      `SELECT id, role, content, references_json, engine, created_at
       FROM assistant_messages
       WHERE conversation_id = $1 AND organization_id = $2
       ORDER BY created_at ASC, id ASC
       LIMIT $3`,
      [conversationId, viewer.organizationId, MAX_MESSAGES]
    );

    return {
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at.toISOString(),
      messages: messages.rows.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.content,
        references: parseReferences(message.references_json),
        engine: message.engine,
        createdAt: message.created_at.toISOString(),
      })),
    };
  });
}

export async function recordAssistantExchange(
  viewer: AssistantViewer,
  input: RecordAssistantExchangeInput
): Promise<{ conversationId: string; title: string }> {
  const question = input.question.trim().slice(0, 500);
  const answer = input.answer.trim().slice(0, 4_000);
  if (!question || !answer) {
    throw new Error("Mensagem vazia.");
  }

  return withHistoryClient(viewer, async (client) => {
    let conversationId = isUuid(input.conversationId)
      ? input.conversationId
      : null;
    let title = titleFromQuestion(question);

    if (conversationId) {
      const existing = await client.query<{ id: string; title: string }>(
        `SELECT id, title
         FROM assistant_conversations
         WHERE id = $1 AND organization_id = $2 AND profile_id = $3
         LIMIT 1`,
        [conversationId, viewer.organizationId, viewer.profileId]
      );
      if (!existing.rows[0]) {
        conversationId = null;
      } else {
        title = existing.rows[0].title;
      }
    }

    if (!conversationId) {
      const created = await client.query<{ id: string; title: string }>(
        `INSERT INTO assistant_conversations (organization_id, profile_id, title)
         VALUES ($1, $2, $3)
         RETURNING id, title`,
        [viewer.organizationId, viewer.profileId, title]
      );
      conversationId = created.rows[0].id;
      title = created.rows[0].title;
    }

    await client.query(
      `INSERT INTO assistant_messages
         (conversation_id, organization_id, role, content, references_json, engine)
       VALUES
         ($1, $2, 'user', $3, '[]'::jsonb, NULL),
         ($1, $2, 'assistant', $4, $5::jsonb, $6)`,
      [
        conversationId,
        viewer.organizationId,
        question,
        answer,
        JSON.stringify(input.references.slice(0, 12)),
        input.engine ?? null,
      ]
    );

    await client.query(
      `UPDATE assistant_conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    await client.query(
      `DELETE FROM assistant_conversations
       WHERE organization_id = $1
         AND profile_id = $2
         AND id NOT IN (
           SELECT id FROM assistant_conversations
           WHERE organization_id = $1 AND profile_id = $2
           ORDER BY updated_at DESC
           LIMIT $3
         )`,
      [viewer.organizationId, viewer.profileId, MAX_CONVERSATIONS]
    );

    return { conversationId, title };
  });
}

export async function deleteAssistantConversation(
  viewer: AssistantViewer,
  conversationId: string
): Promise<boolean> {
  if (!isUuid(conversationId)) return false;

  return withHistoryClient(viewer, async (client) => {
    const result = await client.query(
      `DELETE FROM assistant_conversations
       WHERE id = $1 AND organization_id = $2 AND profile_id = $3`,
      [conversationId, viewer.organizationId, viewer.profileId]
    );
    return (result.rowCount ?? 0) > 0;
  });
}

export async function clearAssistantHistory(
  viewer: AssistantViewer
): Promise<number> {
  return withHistoryClient(viewer, async (client) => {
    const result = await client.query(
      `DELETE FROM assistant_conversations
       WHERE organization_id = $1 AND profile_id = $2`,
      [viewer.organizationId, viewer.profileId]
    );
    return result.rowCount ?? 0;
  });
}

export { isUuid as isAssistantConversationId };

