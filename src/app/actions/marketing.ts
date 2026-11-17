"use server";

import { revalidatePath } from "next/cache";
import { MarketingValidationError } from "@/domains/marketing/rules";
import type {
  SocialFormat,
  SocialHighlightItem,
  SocialInstagramProfile,
  SocialInstagramPublishedPost,
  SocialPillar,
  SocialPostRecord,
} from "@/domains/marketing/types";
import { MANAGEMENT_ROLES } from "@/lib/roles";
import { requireRole } from "@/server/auth";
import { draftSocialPostWithAi } from "@/server/marketing/ai";
import { fetchLiveInstagramSnapshot } from "@/server/marketing/composio-instagram";
import {
  createSocialPost,
  deleteSocialPost,
  importDecember2026Plan,
  moveSocialPostGridPosition,
  recordInstagramSyncError,
  saveInstagramSyncSnapshot,
  updateSimulatedInstagramProfile,
  updateSocialPost,
} from "@/server/marketing/repository";

function formatActionError(error: unknown, fallback: string): string {
  if (error instanceof MarketingValidationError) return error.message;
  console.error("[marketing]", error);
  return fallback;
}

export async function syncMarketingInstagramAction(): Promise<
  | {
      ok: true;
      profile: SocialInstagramProfile;
      publishedPosts: SocialInstagramPublishedPost[];
    }
  | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const snapshot = await fetchLiveInstagramSnapshot();
    const saved = await saveInstagramSyncSnapshot(
      auth.organizationId,
      snapshot.profile,
      snapshot.media
    );
    revalidatePath("/marketing");
    return {
      ok: true,
      profile: saved.profile,
      publishedPosts: saved.publishedPosts,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível sincronizar o Instagram neste momento.";
    await recordInstagramSyncError(auth.organizationId, message).catch(() => undefined);
    return { ok: false, error: message };
  }
}

export async function updateSimulatedProfileAction(input: {
  simulatedName: string;
  simulatedBio: string;
  simulatedWebsite: string;
  highlights: SocialHighlightItem[];
}): Promise<{ ok: true; profile: SocialInstagramProfile } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const profile = await updateSimulatedInstagramProfile(auth.organizationId, input);
    revalidatePath("/marketing");
    return { ok: true, profile };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao guardar perfil simulado.") };
  }
}

export async function createSocialPostAction(
  input: Record<string, unknown>
): Promise<{ ok: true; post: SocialPostRecord } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const post = await createSocialPost(auth.organizationId, auth.profileId, input);
    revalidatePath("/marketing");
    return { ok: true, post };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao criar publicação.") };
  }
}

export async function updateSocialPostAction(
  postId: string,
  input: Record<string, unknown>
): Promise<{ ok: true; post: SocialPostRecord } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const post = await updateSocialPost(auth.organizationId, postId, input);
    if (!post) {
      return { ok: false, error: "Publicação não encontrada." };
    }
    revalidatePath("/marketing");
    return { ok: true, post };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao atualizar publicação.") };
  }
}

export async function deleteSocialPostAction(
  postId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const deleted = await deleteSocialPost(auth.organizationId, postId);
    if (!deleted) {
      return { ok: false, error: "Publicação não encontrada." };
    }
    revalidatePath("/marketing");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao remover publicação.") };
  }
}

export async function moveSocialPostGridOrderAction(
  postId: string,
  direction: "earlier" | "later"
): Promise<{ ok: true; posts: SocialPostRecord[] } | { ok: false; error: string }> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const posts = await moveSocialPostGridPosition(auth.organizationId, postId, direction);
    revalidatePath("/marketing");
    return { ok: true, posts };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao reordenar grelha.") };
  }
}

export async function importDecemberPlanAction(): Promise<
  { ok: true; insertedCount: number; posts: SocialPostRecord[] } | { ok: false; error: string }
> {
  const auth = await requireRole(MANAGEMENT_ROLES);
  try {
    const result = await importDecember2026Plan(auth.organizationId, auth.profileId);
    revalidatePath("/marketing");
    return { ok: true, insertedCount: result.insertedCount, posts: result.posts };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao importar plano de dezembro.") };
  }
}

export async function draftSocialPostAiAction(input: {
  title: string;
  format: SocialFormat;
  pillar: SocialPillar;
  vehicleLabel?: string | null;
  existingHook?: string;
  existingCaption?: string;
}): Promise<
  | { ok: true; hook: string; caption: string; cta: string; scriptNotes: string }
  | { ok: false; error: string }
> {
  await requireRole(MANAGEMENT_ROLES);
  try {
    if (!input.title.trim()) {
      return { ok: false, error: "Indica primeiro um título ou tema." };
    }
    const draft = await draftSocialPostWithAi(input);
    if (!draft) {
      return { ok: false, error: "Assistente X-Flow AI indisponível neste momento." };
    }
    return { ok: true, ...draft };
  } catch (error) {
    return { ok: false, error: formatActionError(error, "Erro ao gerar sugestão com IA.") };
  }
}
