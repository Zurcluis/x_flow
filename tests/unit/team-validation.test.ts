import { describe, expect, it } from "vitest";
import {
  TeamValidationError,
  parseTeamMemberInput,
  parseTeamMemberStatus,
  parseToolStatus,
} from "@/domains/identity/team";

describe("parseTeamMemberInput", () => {
  it("normalizes names and defaults", () => {
    const parsed = parseTeamMemberInput({
      name: "  Ana Silva ",
      role: " Instaladora PPF ",
      level: "Sénior",
    });
    expect(parsed.name).toBe("Ana Silva");
    expect(parsed.role).toBe("Instaladora PPF");
    expect(parsed.specialty).toBe("Geral");
    expect(parsed.status).toBe("disponivel");
    expect(parsed.certifications).toEqual([]);
  });

  it("rejects missing required fields", () => {
    expect(() => parseTeamMemberInput({ role: "Instalador", level: "Master" })).toThrow(
      TeamValidationError
    );
    expect(() => parseTeamMemberInput({ name: "Ana", role: "  ", level: "Master" })    ).toThrow("Campo obrigatório: função.");
  });

  it("rejects unknown levels and statuses", () => {
    expect(() =>
      parseTeamMemberInput({ name: "Ana", role: "Instalador", level: "Chefe" })
    ).toThrow("Nível do colaborador inválido.");
    expect(() =>
      parseTeamMemberInput({
        name: "Ana",
        role: "Instalador",
        level: "Master",
        status: "ferias",
      })
    ).toThrow("Estado do colaborador inválido.");
  });

  it("validates email format", () => {
    expect(() =>
      parseTeamMemberInput({
        name: "Ana",
        role: "Instalador",
        level: "Master",
        email: "ana-at-exemplo",
      })
    ).toThrow("O email do colaborador é inválido.");
  });

  it("trims and validates certifications", () => {
    const parsed = parseTeamMemberInput({
      name: "Ana",
      role: "Instalador",
      level: "Master",
      certifications: [" STEK ", "3M"],
    });
    expect(parsed.certifications).toEqual(["STEK", "3M"]);
    expect(() =>
      parseTeamMemberInput({
        name: "Ana",
        role: "Instalador",
        level: "Master",
        certifications: ["   "],
      })
    ).toThrow("Certificação inválida.");
  });
});

describe("status parsers", () => {
  it("accepts only known member and tool statuses", () => {
    expect(parseTeamMemberStatus("ausente")).toBe("ausente");
    expect(() => parseTeamMemberStatus("ferias")).toThrow(TeamValidationError);
    expect(parseToolStatus("manutencao")).toBe("manutencao");
    expect(() => parseToolStatus("perdida")).toThrow(TeamValidationError);
  });
});
