import {
  normalizeContactHandle,
  parseSenderIdentity,
  sanitizeMessageText,
} from "@/domains/inbox/rules";
import type {
  InboxAttachment,
  InboxChannelAccount,
  InboxSyncChannelReport,
  InboxSyncReport,
  SyncNormalizedMessage,
} from "@/domains/inbox/types";
import { ComposioInboxProvider } from "./providers/composio";
import {
  InboxProviderAuthError,
  type GmailMessageRaw,
  type InboxChannelProvider,
  type InstagramMessageRaw,
} from "./providers/types";
import {
  getStoredThreadTimestamps,
  updateChannelSyncState,
  upsertChannelAccount,
  upsertThreadBatch,
} from "./repository";

const GMAIL_BATCH_SIZE = 5;
const GMAIL_MAX_INITIAL_PAGES = 10;
const INSTAGRAM_CONVERSATION_PAGE_SIZE = 25;
const INSTAGRAM_MAX_PAGES = 2;
const INSTAGRAM_CONCURRENCY = 5;

function normalizeGmailMessage(
  raw: GmailMessageRaw,
  accountEmail: string
): SyncNormalizedMessage | null {
  if (!raw.messageId || !raw.threadId) return null;

  const senderParsed = parseSenderIdentity(raw.sender, "gmail");
  const recipientParsed = parseSenderIdentity(raw.to, "gmail");
  const normalizedOwnEmail = normalizeContactHandle(accountEmail, "gmail");
  const labelIds = raw.labelIds ?? [];
  const isOutbound =
    labelIds.includes("SENT") ||
    (Boolean(normalizedOwnEmail) && senderParsed.handle === normalizedOwnEmail);

  const rawBody = raw.messageText || raw.preview?.body || "";
  const bodyText = sanitizeMessageText(rawBody);
  const attachments: InboxAttachment[] = (raw.attachmentList ?? []).map((att) => ({
    type: att.mimeType?.startsWith("image/") ? "image" : "file",
    name: att.filename,
    mimeType: att.mimeType,
  }));

  const sentDate = raw.messageTimestamp ? new Date(raw.messageTimestamp) : new Date();
  const sentAt = Number.isNaN(sentDate.getTime()) ? new Date().toISOString() : sentDate.toISOString();

  return {
    externalMessageId: raw.messageId,
    externalThreadId: raw.threadId,
    direction: isOutbound ? "outbound" : "inbound",
    senderName: senderParsed.name,
    senderHandle: senderParsed.handle || null,
    senderExternalId: null,
    recipientHandle: recipientParsed.handle || null,
    subject: raw.subject ? sanitizeMessageText(raw.subject) : null,
    bodyText,
    attachments,
    sentAt,
    isUnread: !isOutbound && labelIds.includes("UNREAD"),
  };
}

function normalizeInstagramMessage(
  raw: InstagramMessageRaw,
  conversationId: string,
  ownHandle: string
): SyncNormalizedMessage | null {
  if (!raw.id) return null;

  const ownNormalized = normalizeContactHandle(ownHandle, "instagram").replace(/^@/, "");
  const senderUsername = (raw.from?.username ?? "").replace(/^@/, "").trim();
  const senderNormalized = normalizeContactHandle(senderUsername || raw.from?.id, "instagram");
  const isOutbound =
    Boolean(ownNormalized) && senderUsername.toLowerCase() === ownNormalized;

  const firstRecipient = raw.to?.data?.[0];
  const recipientHandle = firstRecipient
    ? normalizeContactHandle(firstRecipient.username || firstRecipient.id, "instagram")
    : null;

  const attachments: InboxAttachment[] = [];
  for (const att of raw.attachments?.data ?? []) {
    if (att.image_data) {
      attachments.push({
        type: "image",
        url: att.image_data.url || att.image_data.preview_url,
        width: att.image_data.width,
        height: att.image_data.height,
      });
    } else if (att.video_data) {
      attachments.push({
        type: "video",
        url: att.video_data.url || att.video_data.preview_url,
      });
    } else {
      attachments.push({ type: "unknown" });
    }
  }

  const sentDate = raw.created_time ? new Date(raw.created_time) : new Date();
  const sentAt = Number.isNaN(sentDate.getTime()) ? new Date().toISOString() : sentDate.toISOString();

  return {
    externalMessageId: raw.id,
    externalThreadId: conversationId,
    direction: isOutbound ? "outbound" : "inbound",
    senderName: senderUsername ? `@${senderUsername}` : null,
    senderHandle: senderNormalized || null,
    senderExternalId: !isOutbound && raw.from?.id ? String(raw.from.id) : null,
    recipientHandle,
    subject: null,
    bodyText: sanitizeMessageText(raw.message ?? ""),
    attachments,
    sentAt,
    isUnread: false,
  };
}

async function syncGmailChannel(
  organizationId: string,
  account: InboxChannelAccount,
  provider: InboxChannelProvider,
  fullRescan: boolean
): Promise<InboxSyncChannelReport> {
  let threadsUpserted = 0;
  let messagesUpserted = 0;

  try {
    const profile = await provider.fetchGmailProfile(account.externalAccountId);
    const storedHistoryId = !fullRescan && typeof account.syncCursor.historyId === "string"
      ? account.syncCursor.historyId
      : null;

    let runFullScan = !storedHistoryId;

    if (storedHistoryId) {
      let pageToken: string | null = null;
      const changedIds = new Set<string>();
      let historyExpired = false;

      do {
        const hist = await provider.fetchGmailHistory({
          accountId: account.externalAccountId,
          startHistoryId: storedHistoryId,
          pageToken,
        });
        if (hist.historyTooOld) {
          historyExpired = true;
          break;
        }
        for (const id of hist.messageIds) changedIds.add(id);
        pageToken = hist.nextPageToken;
      } while (pageToken);

      if (historyExpired) {
        runFullScan = true;
      } else if (changedIds.size > 0) {
        const normalized: SyncNormalizedMessage[] = [];
        for (const id of changedIds) {
          const msg = await provider.fetchGmailMessageById({
            accountId: account.externalAccountId,
            messageId: id,
          });
          if (msg) {
            const norm = normalizeGmailMessage(msg, profile.emailAddress || account.displayHandle);
            if (norm) normalized.push(norm);
          }
        }
        const res = await upsertThreadBatch(organizationId, account.id, "gmail", normalized);
        threadsUpserted += res.threadsUpserted;
        messagesUpserted += res.messagesInserted;
      }
    }

    if (runFullScan) {
      let pageToken: string | null = null;
      let pages = 0;
      do {
        const batch = await provider.fetchGmailBatch({
          accountId: account.externalAccountId,
          maxResults: GMAIL_BATCH_SIZE,
          pageToken,
        });

        const normalized: SyncNormalizedMessage[] = [];
        for (const raw of batch.messages) {
          const norm = normalizeGmailMessage(raw, profile.emailAddress || account.displayHandle);
          if (norm) normalized.push(norm);
        }

        const res = await upsertThreadBatch(organizationId, account.id, "gmail", normalized);
        threadsUpserted += res.threadsUpserted;
        messagesUpserted += res.messagesInserted;

        pageToken = batch.nextPageToken;
        pages += 1;
      } while (pageToken && pages < GMAIL_MAX_INITIAL_PAGES);
    }

    await updateChannelSyncState(organizationId, account.id, {
      status: "active",
      syncCursor: profile.historyId ? { historyId: profile.historyId } : undefined,
      lastError: null,
      markSyncedNow: true,
    });

    return {
      channel: "gmail",
      accountId: account.id,
      status: "ok",
      threadsUpserted,
      messagesUpserted,
    };
  } catch (error) {
    if (error instanceof InboxProviderAuthError) {
      await updateChannelSyncState(organizationId, account.id, {
        status: "needs_reauth",
        lastError: error.message.slice(0, 400),
      });
      return {
        channel: "gmail",
        accountId: account.id,
        status: "needs_reauth",
        threadsUpserted,
        messagesUpserted,
        error: error.message,
      };
    }

    const message = error instanceof Error ? error.message : "Erro ao sincronizar Gmail.";
    await updateChannelSyncState(organizationId, account.id, {
      lastError: message.slice(0, 400),
    });
    return {
      channel: "gmail",
      accountId: account.id,
      status: "error",
      threadsUpserted,
      messagesUpserted,
      error: message,
    };
  }
}

async function syncSingleInstagramConversation(
  organizationId: string,
  account: InboxChannelAccount,
  provider: InboxChannelProvider,
  conversationId: string
): Promise<{ threadsUpserted: number; messagesUpserted: number }> {
  let msgAfter: string | null = null;
  let msgPages = 0;
  const threadMessages: SyncNormalizedMessage[] = [];

  do {
    const msgRes = await provider.fetchInstagramMessages({
      accountId: account.externalAccountId,
      conversationId,
      limit: 25,
      after: msgAfter,
    });
    for (const raw of msgRes.messages) {
      const norm = normalizeInstagramMessage(raw, conversationId, account.displayHandle);
      if (norm) threadMessages.push(norm);
    }
    msgAfter = msgRes.nextAfter;
    msgPages += 1;
  } while (msgAfter && msgPages < 3);

  const res = await upsertThreadBatch(organizationId, account.id, "instagram", threadMessages);
  return {
    threadsUpserted: res.threadsUpserted,
    messagesUpserted: res.messagesInserted,
  };
}

async function syncInstagramChannel(
  organizationId: string,
  account: InboxChannelAccount,
  provider: InboxChannelProvider,
  fullRescan: boolean
): Promise<InboxSyncChannelReport> {
  let threadsUpserted = 0;
  let messagesUpserted = 0;

  try {
    const existingTimestamps = await getStoredThreadTimestamps(organizationId, "instagram");
    let after: string | null = null;
    let pages = 0;

    do {
      const convPage = await provider.fetchInstagramConversations({
        accountId: account.externalAccountId,
        limit: INSTAGRAM_CONVERSATION_PAGE_SIZE,
        after,
      });

      const pendingConversations = convPage.conversations.filter((conv) => {
        if (fullRescan) return true;
        const prevUpdatedAt = existingTimestamps.get(conv.id);
        const remoteUpdatedMs = conv.updated_time ? Date.parse(conv.updated_time) : Number.NaN;
        const prevMs = prevUpdatedAt ? Date.parse(prevUpdatedAt) : Number.NaN;
        return !prevUpdatedAt || Number.isNaN(remoteUpdatedMs) || remoteUpdatedMs > prevMs;
      });

      if (!fullRescan && pendingConversations.length === 0 && convPage.conversations.length > 0) {
        break;
      }

      for (let i = 0; i < pendingConversations.length; i += INSTAGRAM_CONCURRENCY) {
        const slice = pendingConversations.slice(i, i + INSTAGRAM_CONCURRENCY);
        const chunkResults = await Promise.all(
          slice.map((conv) =>
            syncSingleInstagramConversation(organizationId, account, provider, conv.id)
          )
        );
        for (const item of chunkResults) {
          threadsUpserted += item.threadsUpserted;
          messagesUpserted += item.messagesUpserted;
        }
      }

      after = convPage.nextAfter;
      pages += 1;
    } while (after && pages < INSTAGRAM_MAX_PAGES);

    await updateChannelSyncState(organizationId, account.id, {
      status: "active",
      lastError: null,
      markSyncedNow: true,
    });

    return {
      channel: "instagram",
      accountId: account.id,
      status: "ok",
      threadsUpserted,
      messagesUpserted,
    };
  } catch (error) {
    if (error instanceof InboxProviderAuthError) {
      await updateChannelSyncState(organizationId, account.id, {
        status: "needs_reauth",
        lastError: error.message.slice(0, 400),
      });
      return {
        channel: "instagram",
        accountId: account.id,
        status: "needs_reauth",
        threadsUpserted,
        messagesUpserted,
        error: error.message,
      };
    }

    const message = error instanceof Error ? error.message : "Erro ao sincronizar Instagram.";
    await updateChannelSyncState(organizationId, account.id, {
      lastError: message.slice(0, 400),
    });
    return {
      channel: "instagram",
      accountId: account.id,
      status: "error",
      threadsUpserted,
      messagesUpserted,
      error: message,
    };
  }
}

export async function syncOrganizationInbox(
  organizationId: string,
  options: {
    fullRescan?: boolean;
    provider?: InboxChannelProvider;
  } = {}
): Promise<InboxSyncReport> {
  const provider = options.provider ?? new ComposioInboxProvider();
  const syncedAt = new Date().toISOString();

  if (!provider.isConfigured()) {
    return {
      organizationId,
      syncedAt,
      channels: [
        {
          channel: "gmail",
          accountId: "",
          status: "skipped",
          threadsUpserted: 0,
          messagesUpserted: 0,
          error: "Integração Composio desativada ou sem COMPOSIO_API_KEY.",
        },
        {
          channel: "instagram",
          accountId: "",
          status: "skipped",
          threadsUpserted: 0,
          messagesUpserted: 0,
          error: "Integração Composio desativada ou sem COMPOSIO_API_KEY.",
        },
      ],
    };
  }

  const [gmailDiscovered, instagramDiscovered] = await Promise.all([
    provider.discoverActiveAccount("gmail"),
    provider.discoverActiveAccount("instagram"),
  ]);

  const channelReports: InboxSyncChannelReport[] = [];
  const tasks: Array<Promise<InboxSyncChannelReport>> = [];

  if (gmailDiscovered) {
    const gmailAccount = await upsertChannelAccount(organizationId, {
      channel: "gmail",
      externalAccountId: gmailDiscovered.externalAccountId,
      displayHandle: gmailDiscovered.displayHandle,
    });
    if (gmailAccount.status !== "paused") {
      tasks.push(
        syncGmailChannel(organizationId, gmailAccount, provider, Boolean(options.fullRescan))
      );
    }
  } else {
    channelReports.push({
      channel: "gmail",
      accountId: "",
      status: "skipped",
      threadsUpserted: 0,
      messagesUpserted: 0,
      error: "Nenhuma ligação Gmail ativa encontrada no Composio.",
    });
  }

  if (instagramDiscovered) {
    const instagramAccount = await upsertChannelAccount(organizationId, {
      channel: "instagram",
      externalAccountId: instagramDiscovered.externalAccountId,
      displayHandle: instagramDiscovered.displayHandle,
    });
    if (instagramAccount.status !== "paused") {
      tasks.push(
        syncInstagramChannel(
          organizationId,
          instagramAccount,
          provider,
          Boolean(options.fullRescan)
        )
      );
    }
  } else {
    channelReports.push({
      channel: "instagram",
      accountId: "",
      status: "skipped",
      threadsUpserted: 0,
      messagesUpserted: 0,
      error: "Nenhuma ligação Instagram ativa encontrada no Composio.",
    });
  }

  const finished = await Promise.all(tasks);
  return {
    organizationId,
    syncedAt,
    channels: [...finished, ...channelReports],
  };
}
