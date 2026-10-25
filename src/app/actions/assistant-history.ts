"use server";

import { getOptionalAuth } from "@/server/auth";
import {
  clearAssistantHistory,
  deleteAssistantConversation,
  getAssistantConversation,
  listAssistantConversations,
  type AssistantConversation,
  type AssistantConversationSummary,
} from "@/server/assistant-history";
import {
  assistantAccessError,
  type AssistantViewer,
} from "@/server/assistant";

type ViewerResult =
  | { ok: true; viewer: AssistantViewer }
  | { ok: false; error: string };

async function resolveViewer(): Promise<ViewerResult> {
  const auth = await getOptionalAuth();
  if (!auth) {
    return {
      ok: false,
      error: "A sessão expirou. Volta a entrar para usar o assistente.",
    };
  }
  if (auth.mustChangePassword) {
    return { ok: false, error: "Muda a password antes de usar o assistente." };
  }

  const viewer: AssistantViewer = {
    organizationId: auth.organizationId,
    profileId: auth.profileId,
    name: auth.name,
    role: auth.role,
  };
  const accessError = assistantAccessError(viewer);
  if (accessError) return { ok: false, error: accessError };
  return { ok: true, viewer };
}

export type AssistantHistoryListResult =
  | { ok: true; conversations: AssistantConversationSummary[] }
  | { ok: false; error: string };

export async function listAssistantConversationsAction(): Promise<AssistantHistoryListResult> {
  const access = await resolveViewer();
  if (!access.ok) return access;

  try {
    return {
      ok: true,
      conversations: await listAssistantConversations(access.viewer),
    };
  } catch (error) {
    console.error(
      "[assistant] histórico falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return { ok: false, error: "Não consegui carregar o histórico." };
  }
}

export type AssistantConversationResult =
  | { ok: true; conversation: AssistantConversation }
  | { ok: false; error: string };

export async function getAssistantConversationAction(
  conversationId: string
): Promise<AssistantConversationResult> {
  const access = await resolveViewer();
  if (!access.ok) return access;

  try {
    const conversation = await getAssistantConversation(
      access.viewer,
      conversationId
    );
    if (!conversation) {
      return { ok: false, error: "Essa conversa já não existe." };
    }
    return { ok: true, conversation };
  } catch (error) {
    console.error(
      "[assistant] conversa falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return { ok: false, error: "Não consegui abrir a conversa." };
  }
}

export type AssistantHistoryMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteAssistantConversationAction(
  conversationId: string
): Promise<AssistantHistoryMutationResult> {
  const access = await resolveViewer();
  if (!access.ok) return access;

  try {
    const removed = await deleteAssistantConversation(
      access.viewer,
      conversationId
    );
    if (!removed) {
      return { ok: false, error: "Essa conversa já não existe." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[assistant] apagar conversa falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return { ok: false, error: "Não consegui apagar a conversa." };
  }
}

export async function clearAssistantHistoryAction(): Promise<AssistantHistoryMutationResult> {
  const access = await resolveViewer();
  if (!access.ok) return access;

  try {
    await clearAssistantHistory(access.viewer);
    return { ok: true };
  } catch (error) {
    console.error(
      "[assistant] limpar histórico falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return { ok: false, error: "Não consegui limpar o histórico." };
  }
}
