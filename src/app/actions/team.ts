"use server";

import { revalidatePath } from "next/cache";
import { TeamMember, WorkshopTool } from "@/lib/demo-data/tools-team-data";
import { assertManagementAccess, requireAuth } from "@/server/auth";
import {
  createTeamMember,
  listTeam,
  setTeamMemberStatus,
  setToolStatus,
  TeamMemberCreateInput,
} from "@/server/team";
import {
  TeamValidationError,
  parseTeamMemberInput,
  parseTeamMemberStatus,
  parseToolStatus,
} from "@/domains/identity/team";

export type TeamActionResult =
  | { ok: true; member: TeamMember }
  | { ok: false; error: string };

function actionError(error: unknown, fallback: string): string {
  return error instanceof TeamValidationError ? error.message : fallback;
}

export async function createTeamMemberAction(
  input: TeamMemberCreateInput
): Promise<TeamActionResult> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    const parsed = parseTeamMemberInput(input);
    const member = await createTeamMember(auth.organizationId, {
      name: parsed.name,
      role: parsed.role,
      specialty: parsed.specialty,
      level: parsed.level,
      status: parsed.status,
      email: parsed.email,
      phone: parsed.phone,
      certifications: parsed.certifications,
    });
    revalidatePath("/team");
    return { ok: true, member };
  } catch (error) {
    return {
      ok: false,
      error: actionError(error, "Não foi possível criar o colaborador."),
    };
  }
}

export async function setTeamMemberStatusAction(
  memberId: string,
  status: TeamMember["status"]
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    parseTeamMemberStatus(status);
    await setTeamMemberStatus(auth.organizationId, memberId, status);
    revalidatePath("/team");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: actionError(error, "Não foi possível atualizar o estado."),
    };
  }
}

export async function setToolStatusAction(
  toolId: string,
  status: WorkshopTool["status"]
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAuth();
  try {
    assertManagementAccess(auth);
    parseToolStatus(status);
    await setToolStatus(auth.organizationId, toolId, status);
    revalidatePath("/tools");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: actionError(error, "Não foi possível atualizar a ferramenta."),
    };
  }
}

export async function getTeamAction(): Promise<TeamMember[]> {
  const auth = await requireAuth();
  return listTeam(auth.organizationId);
}
