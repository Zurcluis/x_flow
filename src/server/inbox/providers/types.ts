import type { InboxChannel } from "@/domains/inbox/types";

export class InboxProviderAuthError extends Error {
  readonly channel: InboxChannel;

  constructor(channel: InboxChannel, message: string) {
    super(message);
    this.name = "InboxProviderAuthError";
    this.channel = channel;
  }
}

export class InboxProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InboxProviderUnavailableError";
  }
}

export class InboxProviderSendError extends Error {
  readonly channel: InboxChannel;
  readonly retryable: boolean;
  readonly windowClosed: boolean;

  constructor(
    channel: InboxChannel,
    message: string,
    options: { retryable?: boolean; windowClosed?: boolean } = {}
  ) {
    super(message);
    this.name = "InboxProviderSendError";
    this.channel = channel;
    this.retryable = options.retryable ?? true;
    this.windowClosed = options.windowClosed ?? false;
  }
}

export interface SendGmailReplyParams {
  accountId: string;
  threadId: string;
  recipientEmail: string;
  messageBody: string;
}

export interface SendInstagramReplyParams {
  accountId: string;
  recipientId: string;
  text: string;
  replyToMessageId?: string;
}

export interface SendReplyResult {
  externalMessageId: string;
  sentAt: string;
}

export interface DiscoveredAccount {
  externalAccountId: string;
  displayHandle: string;
  externalUserId?: string;
}

export interface GmailProfileData {
  emailAddress: string;
  historyId: string | null;
  messagesTotal: number;
  threadsTotal: number;
}

export interface GmailAttachmentRaw {
  filename?: string;
  mimeType?: string;
  attachmentId?: string;
}

export interface GmailMessageRaw {
  messageId: string;
  threadId: string;
  sender?: string;
  to?: string;
  subject?: string;
  messageText?: string;
  preview?: { body?: string; subject?: string };
  messageTimestamp?: string;
  labelIds?: string[];
  attachmentList?: GmailAttachmentRaw[];
}

export interface GmailFetchBatchResult {
  messages: GmailMessageRaw[];
  nextPageToken: string | null;
}

export interface GmailHistoryResult {
  messageIds: string[];
  historyId: string | null;
  nextPageToken: string | null;
  historyTooOld: boolean;
}

export interface InstagramConversationRaw {
  id: string;
  updated_time?: string;
}

export interface InstagramConversationsResult {
  conversations: InstagramConversationRaw[];
  nextAfter: string | null;
}

export interface InstagramAttachmentDataRaw {
  image_data?: {
    url?: string;
    preview_url?: string;
    width?: number;
    height?: number;
  };
  video_data?: {
    url?: string;
    preview_url?: string;
  };
}

export interface InstagramMessageRaw {
  id: string;
  created_time?: string;
  from?: { id?: string; username?: string };
  to?: { data?: Array<{ id?: string; username?: string }> };
  message?: string;
  attachments?: { data?: InstagramAttachmentDataRaw[] };
}

export interface InstagramMessagesResult {
  messages: InstagramMessageRaw[];
  nextAfter: string | null;
}

export interface InboxChannelProvider {
  isConfigured(): boolean;
  discoverActiveAccount(channel: InboxChannel): Promise<DiscoveredAccount | null>;
  fetchGmailProfile(accountId: string): Promise<GmailProfileData>;
  fetchGmailBatch(params: {
    accountId: string;
    maxResults?: number;
    pageToken?: string | null;
    idsOnly?: boolean;
  }): Promise<GmailFetchBatchResult>;
  fetchGmailMessageById(params: {
    accountId: string;
    messageId: string;
  }): Promise<GmailMessageRaw | null>;
  fetchGmailHistory(params: {
    accountId: string;
    startHistoryId: string;
    pageToken?: string | null;
  }): Promise<GmailHistoryResult>;
  fetchInstagramConversations(params: {
    accountId: string;
    limit?: number;
    after?: string | null;
  }): Promise<InstagramConversationsResult>;
  fetchInstagramMessages(params: {
    accountId: string;
    conversationId: string;
    limit?: number;
    after?: string | null;
  }): Promise<InstagramMessagesResult>;
  sendGmailReply(params: SendGmailReplyParams): Promise<SendReplyResult>;
  sendInstagramReply(params: SendInstagramReplyParams): Promise<SendReplyResult>;
}
