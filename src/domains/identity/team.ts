export const TEAM_LEVELS = [
  "Master",
  "Sénior",
  "Especialista",
  "Assistente",
] as const;

export const TEAM_STATUSES = ["disponivel", "em_trabalho", "ausente"] as const;

export const TOOL_STATUSES = ["disponivel", "em_uso", "manutencao"] as const;

export type TeamLevel = (typeof TEAM_LEVELS)[number];
export type TeamStatus = (typeof TEAM_STATUSES)[number];
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export class TeamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamValidationError";
  }
}

export interface TeamMemberInput {
  name: string;
  role: string;
  specialty: string;
  level: TeamLevel;
  status: TeamStatus;
  email?: string;
  phone?: string;
  certifications: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 255;
const ROLE_MAX = 100;
const SPECIALTY_MAX = 100;
const EMAIL_MAX = 255;
const PHONE_MAX = 50;
const CERTIFICATION_MAX = 100;
const MAX_CERTIFICATIONS = 20;

function text(
  value: unknown,
  label: string,
  maxLength: number,
  required: boolean
): string | undefined {
  if (value === undefined || value === null) {
    if (required) throw new TeamValidationError(`Campo obrigatório: ${label}.`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new TeamValidationError(`Campo inválido: ${label}.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new TeamValidationError(`Campo obrigatório: ${label}.`);
  }
  if (trimmed.length > maxLength) {
    throw new TeamValidationError(`Campo demasiado longo: ${label}.`);
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseTeamMemberInput(input: unknown): TeamMemberInput {
  if (!input || typeof input !== "object") {
    throw new TeamValidationError("Dados do colaborador inválidos.");
  }
  const raw = input as Record<string, unknown>;
  const name = text(raw.name, "nome do colaborador", NAME_MAX, true)!;
  const role = text(raw.role, "função", ROLE_MAX, true)!;
  const specialty =
    text(raw.specialty, "especialidade", SPECIALTY_MAX, false) ?? "Geral";

  const level = raw.level;
  if (typeof level !== "string" || !TEAM_LEVELS.includes(level as TeamLevel)) {
    throw new TeamValidationError("Nível do colaborador inválido.");
  }

  const status = raw.status ?? "disponivel";
  if (typeof status !== "string" || !TEAM_STATUSES.includes(status as TeamStatus)) {
    throw new TeamValidationError("Estado do colaborador inválido.");
  }

  const email = text(raw.email, "email", EMAIL_MAX, false);
  if (email && !EMAIL_RE.test(email)) {
    throw new TeamValidationError("O email do colaborador é inválido.");
  }
  const phone = text(raw.phone, "telefone", PHONE_MAX, false);

  let certifications: string[] = [];
  if (raw.certifications !== undefined && raw.certifications !== null) {
    if (!Array.isArray(raw.certifications)) {
      throw new TeamValidationError("As certificações são inválidas.");
    }
    if (raw.certifications.length > MAX_CERTIFICATIONS) {
      throw new TeamValidationError("Demasiadas certificações.");
    }
    certifications = raw.certifications.map((item) => {
      if (typeof item !== "string") {
        throw new TeamValidationError("Certificação inválida.");
      }
      const value = item.trim();
      if (value.length === 0 || value.length > CERTIFICATION_MAX) {
        throw new TeamValidationError("Certificação inválida.");
      }
      return value;
    });
  }

  return {
    name,
    role,
    specialty,
    level: level as TeamLevel,
    status: status as TeamStatus,
    email,
    phone,
    certifications,
  };
}

export function parseTeamMemberStatus(value: unknown): TeamStatus {
  if (typeof value !== "string" || !TEAM_STATUSES.includes(value as TeamStatus)) {
    throw new TeamValidationError("Estado do colaborador inválido.");
  }
  return value as TeamStatus;
}

export function parseToolStatus(value: unknown): ToolStatus {
  if (typeof value !== "string" || !TOOL_STATUSES.includes(value as ToolStatus)) {
    throw new TeamValidationError("Estado da ferramenta inválido.");
  }
  return value as ToolStatus;
}
