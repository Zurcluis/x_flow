import { validateInboxReplyDraft } from "@/domains/inbox/rules";
import type { InboxMessageRecord, InboxThreadRecord } from "@/domains/inbox/types";
import { ComposioInboxProvider } from "./providers/composio";
import {
  InboxProviderAuthError,
  InboxProviderSendError,
  type InboxChannelProvider,
} from "./providers/types";
import {
  getInboxSendContext,
  recordOutboundInboxMessage,
  updateChannelSyncState,
} from "./repository";

export type SendInboxReplyOutcome =
  | { ok: true; thread: InboxThreadRecord; message: InboxMessageRecord }
  | { ok: false; error: string; windowClosed?: boolean };

export async function sendInboxReply(input: {
  organizationId: string;
  profileId: string;
  threadId: string;
  text: string;
  confirmed: boolean;
  provider?: InboxChannelProvider;
  now?: Date;
}): Promise<SendInboxReplyOutcome> {
  if (!input.confirmed) {
    return {
      ok: false,
      error: "O envio requer confirmação explícita antes de contactar o cliente.",
    };
  }

  const provider = input.provider ?? new ComposioInboxProvider();
  if (!provider.isConfigured()) {
    return {
      ok: false,
      error: "A integração Composio não está configurada neste ambiente.",
    };
  }

  const candidateTrimmed = input.text.replace(/\r\n?/g, "\n").trim();
  const context = await getInboxSendContext(input.organizationId, input.threadId, candidateTrimmed);
  if (!context) {
    return { ok: false, error: "Conversa ou conta de canal não encontrada." };
  }

  const { thread, account, recentDuplicateSent } = context;

  if (account.status === "paused") {
    return { ok: false, error: "Este canal está em pausa nas configurações." };
  }
  if (account.status === "needs_reauth") {
    return {
      ok: false,
      error: "Este canal precisa de reautenticação antes de enviar mensagens.",
    };
  }

  const validation = validateInboxReplyDraft({
    channel: thread.channel,
    text: candidateTrimmed,
    recipientHandle: thread.participantHandle,
    participantExternalId: thread.participantExternalId,
    lastInboundAt: thread.lastInboundAt,
    now: input.now,
  });

  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      windowClosed: validation.windowClosed,
    };
  }

  if (recentDuplicateSent) {
    return {
      ok: false,
      error: "Esta mensagem idêntica já foi enviada nos últimos segundos.",
    };
  }

  try {
    const sendResult =
      thread.channel === "gmail"
        ? await provider.sendGmailReply({
            accountId: account.externalAccountId,
            threadId: thread.externalThreadId,
            recipientEmail: validation.recipient,
            messageBody: validation.cleanText,
          })
        : await provider.sendInstagramReply({
            accountId: account.externalAccountId,
            recipientId: validation.recipient,
            text: validation.cleanText,
          });

    const recorded = await recordOutboundInboxMessage(input.organizationId, {
      threadId: thread.id,
      externalMessageId: sendResult.externalMessageId,
      senderHandle: account.displayHandle,
      recipientHandle: thread.participantHandle,
      bodyText: validation.cleanText,
      sentAt: sendResult.sentAt,
      sentByProfileId: input.profileId,
    });

    return {
      ok: true,
      thread: recorded.thread,
      message: recorded.message,
    };
  } catch (error) {
    if (error instanceof InboxProviderAuthError) {
      await updateChannelSyncState(input.organizationId, account.id, {
        status: "needs_reauth",
        lastError: error.message.slice(0, 400),
      });
      return {
        ok: false,
        error: "Ligação OAuth expirada ou sem permissões. É necessário reautorizar o canal.",
      };
    }

    if (error instanceof InboxProviderSendError) {
      if (error.windowClosed) {
        return {
          ok: false,
          error:
            "A Meta bloqueou o envio porque a janela de 24 horas desta conversa no Instagram já fechou.",
          windowClosed: true,
        };
      }
      return {
        ok: false,
        error: `Falha ao enviar (${error.channel === "gmail" ? "Gmail" : "Instagram"}): ${error.message}`,
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível enviar a resposta.",
    };
  }
}
