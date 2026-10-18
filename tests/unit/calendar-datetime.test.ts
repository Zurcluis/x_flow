import { describe, it, expect } from "vitest";
import {
  addCivilDays,
  civilDateKey,
  civilDateFromKey,
  parseDateKey,
  postgresDateKey,
  startOfCivilWeek,
  workshopDateKey,
  workshopIsoFromWallTime,
  workshopTime,
} from "@/domains/calendar/datetime";

describe("calendar datetime", () => {
  it("mapeia instantes UTC para a hora de Lisboa no verão e no inverno", () => {
    expect(workshopDateKey(new Date("2026-08-28T07:30:00.000Z"))).toBe("2026-08-28");
    expect(workshopTime(new Date("2026-08-28T07:30:00.000Z"))).toBe("08:30");

    expect(workshopDateKey(new Date("2026-12-15T23:30:00.000Z"))).toBe("2026-12-15");
    expect(workshopTime(new Date("2026-12-15T23:30:00.000Z"))).toBe("23:30");
  });

  it("converte hora de parede de Lisboa para ISO UTC com DST", () => {
    expect(workshopIsoFromWallTime("2026-08-28", "09:00")).toBe("2026-08-28T08:00:00.000Z");
    expect(workshopIsoFromWallTime("2026-12-15", "09:00")).toBe("2026-12-15T09:00:00.000Z");
  });

  it("faz round-trip entre hora de parede e instante", () => {
    const iso = workshopIsoFromWallTime("2026-10-17", "14:30");
    expect(iso).not.toBeNull();
    const date = new Date(iso!);
    expect(workshopDateKey(date)).toBe("2026-10-17");
    expect(workshopTime(date)).toBe("14:30");
  });

  it("preserva o dia original de valores DATE do Postgres", () => {
    expect(postgresDateKey(new Date(2026, 8, 4))).toBe("2026-09-04");
    expect(postgresDateKey("2026-09-04")).toBe("2026-09-04");
    expect(postgresDateKey(null)).toBe("");
  });

  it("rejeita datas e horas inválidas", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("2026-2-3")).toBeNull();
    expect(workshopIsoFromWallTime("2026-02-30", "09:00")).toBeNull();
    expect(workshopIsoFromWallTime("2026-02-03", "25:00")).toBeNull();
  });

  it("rejeita a hora de parede inexistente no início do horário de verão", () => {
    expect(workshopIsoFromWallTime("2026-03-29", "01:30")).toBeNull();
    expect(workshopIsoFromWallTime("2026-03-29", "03:00")).toBe("2026-03-29T02:00:00.000Z");
  });

  it("resolve a hora ambígua no fim do horário de verão", () => {
    const iso = workshopIsoFromWallTime("2026-10-25", "01:30");
    expect(iso).not.toBeNull();
    const date = new Date(iso!);
    expect(workshopDateKey(date)).toBe("2026-10-25");
    expect(workshopTime(date)).toBe("01:30");
  });

  it("faz aritmética de calendário em datas civis", () => {
    const saturday = civilDateFromKey("2026-10-17");
    expect(civilDateKey(saturday)).toBe("2026-10-17");
    expect(civilDateKey(addCivilDays(saturday, 1))).toBe("2026-10-18");
    expect(civilDateKey(startOfCivilWeek(saturday))).toBe("2026-10-12");
  });
});
