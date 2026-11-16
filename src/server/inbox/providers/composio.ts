import type { InboxChannel } from "@/domains/inbox/types";
import {
  InboxProviderAuthError,
  InboxProviderSendError,
  InboxProviderUnavailableError,
  type DiscoveredAccount,
  type GmailFetchBatchResult,
  type GmailHistoryResult,
  type GmailMessageRaw,
  type GmailProfileData,
  type InboxChannelProvider,
  type InstagramConversationsResult,
  type InstagramMessageRaw,
  type InstagramMessagesResult,
  type SendGmailReplyParams,
  type SendInstagramReplyParams,
  type SendReplyResult,
} from "./types";

const COMPOSIO_MCP_URL = "https://connect.composio.dev/mcp";
const REQUEST_TIMEOUT_MS = 25_000;

export function parseMcpSsePayload(rawBody: string): Record<string, unknown> {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    throw new InboxProviderUnavailableError("Resposta vazia do servidor Composio.");
  }

  if (trimmed.startsWith("{")) {
    const direct = JSON.parse(trimmed) as {
      result?: { content?: Array<{ text?: string }>; isError?: boolean };
      error?: { message?: string };
    };
    if (direct.error) {
      throw new InboxProviderUnavailableError(direct.error.message ?? "Erro MCP Composio.");
    }
    const text = direct.result?.content?.[0]?.text;
    if (text) return JSON.parse(text) as Record<string, unknown>;
    return direct as unknown as Record<string, unknown>;
  }

  let lastPayload: Record<string, unknown> | null = null;
  for (const line of rawBody.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const rawJson = line.slice(5).trim();
    if (!rawJson) continue;
    const frame = JSON.parse(rawJson) as {
      result?: { content?: Array<{ text?: string }>; isError?: boolean };
      error?: { message?: string };
    };
    if (frame.error) {
      throw new InboxProviderUnavailableError(frame.error.message ?? "Erro MCP Composio.");
    }
    const text = frame.result?.content?.[0]?.text;
    if (text) {
      lastPayload = JSON.parse(text) as Record<string, unknown>;
    }
  }

  if (!lastPayload) {
    throw new InboxProviderUnavailableError("Não foi possível ler os dados do fluxo SSE Composio.");
  }

  return lastPayload;
}

function isAuthErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  // Erros de política/janela 24h da Meta em mensagens individuais (403 subcode=2534022/2534037)
  // não representam revogação da conta OAuth.
  if (
    lower.includes("2534022") ||
    lower.includes("2534037") ||
    lower.includes("outside of allowed window")
  ) {
    return false;
  }
  return (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("access_token_scope_insufficient") ||
    lower.includes("insufficientpermissions") ||
    lower.includes("invalid oauth") ||
    lower.includes("token has been expired") ||
    lower.includes("revoked")
  );
}

function unwrapToolResult(
  payload: Record<string, unknown>,
  channel: InboxChannel
): { successful: boolean; data: Record<string, unknown>; offloaded: boolean; error?: string } {
  const dataRoot = (payload.data ?? {}) as Record<string, unknown>;
  const results = Array.isArray(dataRoot.results)
    ? (dataRoot.results as Array<Record<string, unknown>>)
    : [];
  const first = results[0];

  if (!first) {
    const topErr = typeof payload.error === "string" ? payload.error : "Sem resposta da ferramenta.";
    if (isAuthErrorMessage(topErr)) {
      throw new InboxProviderAuthError(channel, topErr);
    }
    throw new InboxProviderUnavailableError(topErr);
  }

  const response = (first.response ?? {}) as Record<string, unknown>;
  const topError = typeof first.error === "string" ? first.error : undefined;
  const innerError = typeof response.error === "string" ? response.error : undefined;
  const errMsg = innerError || topError;

  const isSuccess = response.successful === true && first.error == null;
  if (!isSuccess && errMsg) {
    if (isAuthErrorMessage(errMsg)) {
      throw new InboxProviderAuthError(channel, errMsg);
    }
  }

  const offloaded = Boolean(!response.data && response.data_preview);
  const responseData = (response.data ?? response.data_preview ?? {}) as Record<string, unknown>;
  return {
    successful: isSuccess,
    data: responseData,
    offloaded,
    error: errMsg,
  };
}

function extractMessageHeader(
  headers: Array<{ name?: string; value?: string }> | undefined,
  headerName: string
): string | undefined {
  if (!headers) return undefined;
  const target = headerName.toLowerCase();
  return headers.find((h) => (h.name ?? "").toLowerCase() === target)?.value;
}

function decodeBase64UrlUtf8(raw: string | undefined): string {
  if (!raw) return "";
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractTextFromMimePayload(payload: Record<string, unknown> | undefined): string {
  if (!payload) return "";

  const body = payload.body as { data?: string } | undefined;
  const mimeType = String(payload.mimeType ?? "").toLowerCase();
  const parts = Array.isArray(payload.parts)
    ? (payload.parts as Array<Record<string, unknown>>)
    : [];

  if (mimeType === "text/plain" && body?.data) {
    return decodeBase64UrlUtf8(body.data);
  }

  let plainCandidate = "";
  let htmlCandidate = "";

  for (const part of parts) {
    const partMime = String(part.mimeType ?? "").toLowerCase();
    if (partMime === "text/plain") {
      const text = extractTextFromMimePayload(part);
      if (text) plainCandidate = text;
    } else if (partMime === "text/html") {
      const html = extractTextFromMimePayload(part);
      if (html) htmlCandidate = html;
    } else if (partMime.startsWith("multipart/")) {
      const nested = extractTextFromMimePayload(part);
      if (nested && !plainCandidate) plainCandidate = nested;
    }
  }

  if (plainCandidate) return plainCandidate;
  if (htmlCandidate) return htmlCandidate;
  if (body?.data) return decodeBase64UrlUtf8(body.data);
  return "";
}

export class ComposioInboxProvider implements InboxChannelProvider {
  private readonly apiKey: string | undefined;

  constructor(apiKey = process.env.COMPOSIO_API_KEY?.trim()) {
    this.apiKey = apiKey || undefined;
  }

  isConfigured(): boolean {
    return process.env.INBOX_SYNC_ENABLED !== "false" && Boolean(this.apiKey);
  }

  private async callMcpTool(
    toolName: string,
    argumentsPayload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.apiKey) {
      throw new InboxProviderUnavailableError("COMPOSIO_API_KEY não configurada.");
    }

    const res = await fetch(COMPOSIO_MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-consumer-api-key": this.apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: argumentsPayload,
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 401 || res.status === 403) {
      throw new InboxProviderUnavailableError(
        `Chave Composio rejeitada (${res.status}). Verifica COMPOSIO_API_KEY.`
      );
    }

    if (!res.ok) {
      throw new InboxProviderUnavailableError(`Falha HTTP ${res.status} ao contactar Composio.`);
    }

    const text = await res.text();
    return parseMcpSsePayload(text);
  }

  private async executeSingleTool(
    channel: InboxChannel,
    toolSlug: string,
    account: string,
    argumentsPayload: Record<string, unknown>
  ): Promise<{ successful: boolean; data: Record<string, unknown>; offloaded: boolean; error?: string }> {
    const payload = await this.callMcpTool("COMPOSIO_MULTI_EXECUTE_TOOL", {
      sync_response_to_workbench: false,
      tools: [
        {
          tool_slug: toolSlug,
          account,
          arguments: argumentsPayload,
        },
      ],
    });
    return unwrapToolResult(payload, channel);
  }

  async discoverActiveAccount(channel: InboxChannel): Promise<DiscoveredAccount | null> {
    const envOverride =
      channel === "gmail"
        ? process.env.COMPOSIO_GMAIL_ACCOUNT_ID?.trim()
        : process.env.COMPOSIO_INSTAGRAM_ACCOUNT_ID?.trim();

    const payload = await this.callMcpTool("COMPOSIO_MANAGE_CONNECTIONS", {
      toolkits: [{ name: channel, action: "list" }],
    });

    const results = ((payload.data ?? {}) as Record<string, unknown>).results as
      | Record<string, { accounts?: Array<Record<string, unknown>> }>
      | undefined;
    const accounts = results?.[channel]?.accounts ?? [];
    const activeAccounts = accounts.filter(
      (acc) => String(acc.status ?? "").toLowerCase() === "active"
    );

    if (activeAccounts.length === 0) return null;

    const chosen =
      (envOverride
        ? activeAccounts.find((acc) => String(acc.id ?? "") === envOverride)
        : undefined) ??
      activeAccounts.find((acc) => acc.is_default === true) ??
      activeAccounts[0];

    const userInfo = (chosen.user_info ?? {}) as Record<string, unknown>;
    const displayHandle =
      channel === "gmail"
        ? String(userInfo.email ?? chosen.id ?? "gmail")
        : String(userInfo.username ? `@${String(userInfo.username).replace(/^@/, "")}` : chosen.id ?? "instagram");

    return {
      externalAccountId: String(chosen.id),
      displayHandle,
      externalUserId: userInfo.id ? String(userInfo.id) : undefined,
    };
  }

  async fetchGmailProfile(accountId: string): Promise<GmailProfileData> {
    const res = await this.executeSingleTool("gmail", "GMAIL_GET_PROFILE", accountId, {
      user_id: "me",
    });
    if (!res.successful) {
      throw new InboxProviderUnavailableError(res.error ?? "Erro ao ler perfil Gmail.");
    }

    return {
      emailAddress: String(res.data.emailAddress ?? ""),
      historyId: res.data.historyId ? String(res.data.historyId) : null,
      messagesTotal: Number(res.data.messagesTotal ?? 0),
      threadsTotal: Number(res.data.threadsTotal ?? 0),
    };
  }

  async fetchGmailBatch(params: {
    accountId: string;
    maxResults?: number;
    pageToken?: string | null;
    idsOnly?: boolean;
  }): Promise<GmailFetchBatchResult> {
    const args: Record<string, unknown> = {
      user_id: "me",
      max_results: params.maxResults ?? 5,
      verbose: !params.idsOnly,
      include_payload: !params.idsOnly,
      ids_only: Boolean(params.idsOnly),
    };
    if (params.pageToken) args.page_token = params.pageToken;

    const res = await this.executeSingleTool("gmail", "GMAIL_FETCH_EMAILS", params.accountId, args);
    if (!res.successful) {
      throw new InboxProviderUnavailableError(res.error ?? "Erro ao listar emails Gmail.");
    }

    const nextPageToken =
      typeof res.data.nextPageToken === "string" && res.data.nextPageToken.length > 0
        ? res.data.nextPageToken
        : null;

    if (res.offloaded && !params.idsOnly) {
      const idBatch = await this.fetchGmailBatch({
        accountId: params.accountId,
        maxResults: params.maxResults ?? 5,
        pageToken: params.pageToken,
        idsOnly: true,
      });
      const fetched = await Promise.all(
        idBatch.messages
          .filter((m) => Boolean(m.messageId))
          .map((m) =>
            this.fetchGmailMessageById({
              accountId: params.accountId,
              messageId: m.messageId,
            })
          )
      );
      return {
        messages: fetched.filter((m): m is GmailMessageRaw => m !== null),
        nextPageToken: idBatch.nextPageToken ?? nextPageToken,
      };
    }

    const rawMessages = Array.isArray(res.data.messages)
      ? (res.data.messages as GmailMessageRaw[])
      : [];

    return {
      messages: rawMessages,
      nextPageToken,
    };
  }

  async fetchGmailMessageById(params: {
    accountId: string;
    messageId: string;
  }): Promise<GmailMessageRaw | null> {
    const res = await this.executeSingleTool(
      "gmail",
      "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID",
      params.accountId,
      {
        user_id: "me",
        message_id: params.messageId,
        format: "full",
      }
    );

    if (!res.successful) {
      return null;
    }

    const payload = res.data.payload as Record<string, unknown> | undefined;
    const headers = Array.isArray(payload?.headers)
      ? (payload.headers as Array<{ name?: string; value?: string }>)
      : undefined;

    const internalDateMs = res.data.internalDate ? Number(res.data.internalDate) : Number.NaN;
    const timestamp = Number.isFinite(internalDateMs)
      ? new Date(internalDateMs).toISOString()
      : extractMessageHeader(headers, "Date");

    const extractedText =
      typeof res.data.messageText === "string" && res.data.messageText.length > 0
        ? res.data.messageText
        : extractTextFromMimePayload(payload) || String(res.data.snippet ?? "");

    return {
      messageId: String(res.data.id ?? res.data.messageId ?? params.messageId),
      threadId: String(res.data.threadId ?? params.messageId),
      sender:
        typeof res.data.sender === "string"
          ? res.data.sender
          : extractMessageHeader(headers, "From"),
      to: typeof res.data.to === "string" ? res.data.to : extractMessageHeader(headers, "To"),
      subject:
        typeof res.data.subject === "string"
          ? res.data.subject
          : extractMessageHeader(headers, "Subject"),
      messageText: extractedText,
      preview: {
        body: String(res.data.snippet ?? ""),
        subject: extractMessageHeader(headers, "Subject"),
      },
      messageTimestamp: timestamp,
      labelIds: Array.isArray(res.data.labelIds)
        ? res.data.labelIds.map((l) => String(l))
        : [],
    };
  }

  async fetchGmailHistory(params: {
    accountId: string;
    startHistoryId: string;
    pageToken?: string | null;
  }): Promise<GmailHistoryResult> {
    const args: Record<string, unknown> = {
      user_id: "me",
      start_history_id: params.startHistoryId,
      max_results: 100,
    };
    if (params.pageToken) args.page_token = params.pageToken;

    const res = await this.executeSingleTool("gmail", "GMAIL_LIST_HISTORY", params.accountId, args);
    if (!res.successful) {
      const errText = (res.error ?? "").toLowerCase();
      if (errText.includes("404") || errText.includes("historyidtooold")) {
        return { messageIds: [], historyId: null, nextPageToken: null, historyTooOld: true };
      }
      throw new InboxProviderUnavailableError(res.error ?? "Erro no histórico Gmail.");
    }

    const historyRows = Array.isArray(res.data.history)
      ? (res.data.history as Array<{
          messagesAdded?: Array<{ message?: { id?: string } }>;
          messages?: Array<{ id?: string }>;
        }>)
      : [];

    const ids = new Set<string>();
    for (const row of historyRows) {
      for (const added of row.messagesAdded ?? []) {
        if (added.message?.id) ids.add(added.message.id);
      }
      for (const msg of row.messages ?? []) {
        if (msg.id) ids.add(msg.id);
      }
    }

    return {
      messageIds: [...ids],
      historyId: res.data.historyId ? String(res.data.historyId) : null,
      nextPageToken:
        typeof res.data.nextPageToken === "string" && res.data.nextPageToken.length > 0
          ? res.data.nextPageToken
          : null,
      historyTooOld: false,
    };
  }

  async fetchInstagramConversations(params: {
    accountId: string;
    limit?: number;
    after?: string | null;
  }): Promise<InstagramConversationsResult> {
    const args: Record<string, unknown> = {
      platform: "instagram",
      limit: params.limit ?? 25,
    };
    if (params.after) args.after = params.after;

    const res = await this.executeSingleTool(
      "instagram",
      "INSTAGRAM_LIST_ALL_CONVERSATIONS",
      params.accountId,
      args
    );
    if (!res.successful) {
      throw new InboxProviderUnavailableError(res.error ?? "Erro ao listar conversas Instagram.");
    }

    const conversations = Array.isArray(res.data.data)
      ? (res.data.data as Array<{ id: string; updated_time?: string }>)
      : [];
    const paging = res.data.paging as { cursors?: { after?: string } } | undefined;

    return {
      conversations,
      nextAfter: paging?.cursors?.after ?? null,
    };
  }

  async fetchInstagramMessages(params: {
    accountId: string;
    conversationId: string;
    limit?: number;
    after?: string | null;
  }): Promise<InstagramMessagesResult> {
    const args: Record<string, unknown> = {
      conversation_id: params.conversationId,
      limit: params.limit ?? 20,
    };
    if (params.after) args.after = params.after;

    const res = await this.executeSingleTool(
      "instagram",
      "INSTAGRAM_LIST_ALL_MESSAGES",
      params.accountId,
      args
    );

    if (!res.successful) {
      // Conversas indisponíveis (HTTP 400 code=100 subcode=33) são ignoradas sem bloquear restantes
      const errText = (res.error ?? "").toLowerCase();
      if (errText.includes("subcode=33") || errText.includes("subcode\":33") || errText.includes("code=100")) {
        return { messages: [], nextAfter: null };
      }
      throw new InboxProviderUnavailableError(res.error ?? "Erro ao ler mensagens Instagram.");
    }

    const messages = Array.isArray(res.data.data)
      ? (res.data.data as InstagramMessageRaw[])
      : [];
    const paging = res.data.paging as { cursors?: { after?: string } } | undefined;

    return {
      messages,
      nextAfter: paging?.cursors?.after ?? null,
    };
  }

  async sendGmailReply(params: SendGmailReplyParams): Promise<SendReplyResult> {
    const res = await this.executeSingleTool("gmail", "GMAIL_REPLY_TO_THREAD", params.accountId, {
      user_id: "me",
      thread_id: params.threadId,
      recipient_email: params.recipientEmail,
      message_body: params.messageBody,
      is_html: false,
      include_signature: true,
    });

    if (!res.successful) {
      throw new InboxProviderSendError(
        "gmail",
        res.error ?? "Não foi possível enviar a resposta pelo Gmail.",
        { retryable: true }
      );
    }

    const returnedId =
      (typeof res.data.id === "string" && res.data.id) ||
      (typeof res.data.messageId === "string" && res.data.messageId) ||
      `sent-gmail-${Date.now()}`;

    return {
      externalMessageId: returnedId,
      sentAt: new Date().toISOString(),
    };
  }

  async sendInstagramReply(params: SendInstagramReplyParams): Promise<SendReplyResult> {
    const args: Record<string, unknown> = {
      recipient_id: params.recipientId,
      text: params.text,
      graph_api_version: "v21.0",
    };
    if (params.replyToMessageId) {
      args.reply_to_message_id = params.replyToMessageId;
    }

    const res = await this.executeSingleTool(
      "instagram",
      "INSTAGRAM_SEND_TEXT_MESSAGE",
      params.accountId,
      args
    );

    if (!res.successful) {
      const errText = res.error ?? "Não foi possível enviar a mensagem no Instagram.";
      const lower = errText.toLowerCase();
      const windowClosed =
        lower.includes("2534022") || lower.includes("outside of allowed window");
      const notOwner = lower.includes("2534037");

      throw new InboxProviderSendError("instagram", errText, {
        retryable: !(windowClosed || notOwner),
        windowClosed,
      });
    }

    const returnedId =
      (typeof res.data.message_id === "string" && res.data.message_id) ||
      (typeof res.data.id === "string" && res.data.id) ||
      `sent-ig-${Date.now()}`;

    return {
      externalMessageId: returnedId,
      sentAt: new Date().toISOString(),
    };
  }
}
