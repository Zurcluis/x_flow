"use server";

import { getOptionalAuth } from "@/server/auth";
import {
  askAssistant,
  assistantAccessError,
  getAssistantBriefing,
  type AssistantViewer,
} from "@/server/assistant";
import type { AssistantAnswer, AssistantBriefing } from "@/domains/assistant/types";

export type AssistantBriefingResult =
  | { ok: true; briefing: AssistantBriefing }
  | { ok: false; error: string };

export type AssistantAnswerResult =
  | { ok: true; answer: AssistantAnswer }
  | { ok: false; error: string };

function viewerFromAuth(
  auth: Awaited<ReturnType<typeof getOptionalAuth>>
): AssistantViewer | null {
  if (!auth) return null;
  return {
    organizationId: auth.organizationId,
    profileId: auth.profileId,
    name: auth.name,
    role: auth.role,
  };
}

export async function getAssistantBriefingAction(): Promise<AssistantBriefingResult> {
  const auth = await getOptionalAuth();
  const viewer = viewerFromAuth(auth);
  if (!auth || !viewer) {
    return { ok: false, error: "A sessão expirou. Volta a entrar para usar o assistente." };
  }
  if (auth.mustChangePassword) {
    return { ok: false, error: "Muda a password antes de usar o assistente." };
  }

  const accessError = assistantAccessError(viewer);
  if (accessError) return { ok: false, error: accessError };

  try {
    return { ok: true, briefing: await getAssistantBriefing(viewer) };
  } catch (error) {
    console.error(
      "[assistant] briefing falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return {
      ok: false,
      error: "Não consegui preparar o resumo agora. Tenta novamente ou abre a área pretendida.",
    };
  }
}

export async function askAssistantAction(
  question: string
): Promise<AssistantAnswerResult> {
  if (typeof question !== "string") {
    return { ok: false, error: "Pergunta inválida." };
  }

  const auth = await getOptionalAuth();
  const viewer = viewerFromAuth(auth);
  if (!auth || !viewer) {
    return { ok: false, error: "A sessão expirou. Volta a entrar para usar o assistente." };
  }
  if (auth.mustChangePassword) {
    return { ok: false, error: "Muda a password antes de usar o assistente." };
  }

  const accessError = assistantAccessError(viewer);
  if (accessError) return { ok: false, error: accessError };

  try {
    return { ok: true, answer: await askAssistant(viewer, question) };
  } catch (error) {
    console.error(
      "[assistant] pergunta falhou:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return {
      ok: false,
      error: "Não consegui responder agora. Tenta novamente.",
    };
  }
}
