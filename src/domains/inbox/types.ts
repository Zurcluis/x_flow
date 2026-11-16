export type InboxChannel = "gmail" | "instagram";

export type InboxProviderKind = "composio" | "oauth";

export type InboxChannelStatus = "active" | "needs_reauth" | "paused";

export type InboxCategory = "lead" | "supplier" | "admin" | "hr" | "security" | "other";

export type InboxThreadStatus = "unread" | "needs_reply" | "replied" | "converted" | "archived";

export type InboxMessageDirection = "inbound" | "outbound";

export interface InboxAttachment {
  type: "image" | "video" | "file" | "unknown";
  name?: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface InstagramWindowStatus {
  state: "open" | "expiring_soon" | "expired" | "none";
  expiresAt: string | null;
  remainingMinutes: number;
}

export interface InboxChannelAccount {
  id: string;
  organizationId: string;
  channel: InboxChannel;
  provider: InboxProviderKind;
  externalAccountId: string;
  displayHandle: string;
  status: InboxChannelStatus;
  syncCursor: Record<string, unknown>;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface InboxThreadRecord {
  id: string;
  organizationId: string;
  channelAccountId: string;
  channel: InboxChannel;
  externalThreadId: string;
  participantName: string | null;
  participantHandle: string | null;
  participantExternalId: string | null;
  subject: string | null;
  snippet: string | null;
  category: InboxCategory;
  status: InboxThreadStatus;
  unreadCount: number;
  lastMessageAt: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  linkedCustomerId: string | null;
  linkedVehicleId: string | null;
  linkedQuoteId: string | null;
  aiSummary: string | null;
  aiExtractedVehicle: string | null;
  aiExtractedService: string | null;
}

export interface InboxMessageRecord {
  id: string;
  organizationId: string;
  threadId: string;
  externalMessageId: string;
  direction: InboxMessageDirection;
  senderName: string | null;
  senderHandle: string | null;
  recipientHandle: string | null;
  bodyText: string;
  bodyHtmlSanitized: string | null;
  attachments: InboxAttachment[];
  sentAt: string;
  sentByProfileId: string | null;
}

export interface SyncNormalizedMessage {
  externalMessageId: string;
  externalThreadId: string;
  direction: InboxMessageDirection;
  senderName: string | null;
  senderHandle: string | null;
  senderExternalId: string | null;
  recipientHandle: string | null;
  subject: string | null;
  bodyText: string;
  attachments: InboxAttachment[];
  sentAt: string;
  isUnread?: boolean;
}

export interface InboxSyncChannelReport {
  channel: InboxChannel;
  accountId: string;
  status: "ok" | "needs_reauth" | "skipped" | "error";
  threadsUpserted: number;
  messagesUpserted: number;
  error?: string;
}

export interface InboxSyncReport {
  organizationId: string;
  syncedAt: string;
  channels: InboxSyncChannelReport[];
}

export interface InboxShareableQuote {
  id: string;
  quoteNumber: string;
  status: string;
  publicToken: string;
}

