"use server";

import { revalidatePath } from "next/cache";
import { TeamMember } from "@/lib/demo-data/tools-team-data";
import { getPrimaryOrganizationId } from "@/server/org";
import {
  createTeamMember,
  listTeam,
  setTeamMemberStatus,
  TeamMemberCreateInput,
} from "@/server/team";

export type TeamActionResult =
  | { ok: true; member: TeamMember }
  | { ok: false; error: string };

export async function createTeamMemberAction(
  input: TeamMemberCreateInput
): Promise<TeamActionResult> {
  try {
    if (!input.name?.trim()) {
      return { ok: false, error: "O nome do colaborador é obrigatório." };
    }
    if (!input.role?.trim()) {
      return { ok: false, error: "A função é obrigatória." };
    }
    const organizationId = await getPrimaryOrganizationId();
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
  try {
    const organizationId = await getPrimaryOrganizationId();
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

export async function getTeamAction(): Promise<TeamMember[]> {
  const organizationId = await getPrimaryOrganizationId();
  return listTeam(organizationId);
}
