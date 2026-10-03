"use server";

import { revalidatePath } from "next/cache";
import { TeamMember, WorkshopTool } from "@/lib/demo-data/tools-team-data";
import { requireAuth } from "@/server/auth";
import {
  createTeamMember,
  listTeam,
  setTeamMemberStatus,
  setToolStatus,
  TeamMemberCreateInput,
} from "@/server/team";

export type TeamActionResult =
  | { ok: true; member: TeamMember }
  | { ok: false; error: string };

export async function createTeamMemberAction(
  input: TeamMemberCreateInput
): Promise<TeamActionResult> {
  const auth = await requireAuth();
  try {
    if (!input.name?.trim()) {
      return { ok: false, error: "O nome do colaborador é obrigatório." };
    }
    if (!input.role?.trim()) {
      return { ok: false, error: "A função é obrigatória." };
    }
    const organizationId = auth.organizationId;
    const member = await createTeamMember(organizationId, {
      name: input.name.trim(),
      role: input.role.trim(),
      specialty: input.specialty?.trim() ?? "Geral",
      level: input.level ?? "Assistente",
      status: input.status ?? "disponivel",
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      certifications: input.certifications ?? [],
    });
    revalidatePath("/team");
    return { ok: true, member };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao criar o colaborador.",
    };
  }
}

export async function setTeamMemberStatusAction(
  memberId: string,
  status: TeamMember["status"]
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    const organizationId = auth.organizationId;
    await setTeamMemberStatus(organizationId, memberId, status);
    revalidatePath("/team");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao atualizar o estado.",
    };
  }
}

export async function setToolStatusAction(
  toolId: string,
  status: WorkshopTool["status"]
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    const organizationId = auth.organizationId;
    await setToolStatus(organizationId, toolId, status);
    revalidatePath("/tools");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao atualizar a ferramenta.",
    };
  }
}

export async function getTeamAction(): Promise<TeamMember[]> {
  const auth = await requireAuth();
  const organizationId = auth.organizationId;
  return listTeam(organizationId);
}
