import { describe, expect, it } from "vitest";
import {
  buildNarration,
  greetingForHour,
  type NarrationInput,
} from "@/domains/assistant/narration";
import type { AssistantItem } from "@/domains/assistant/types";

function item(overrides: Partial<AssistantItem> & { id: string; title: string }): AssistantItem {
  return {
    kind: "work_order",
    detail: null,
    time: null,
    href: "/production",
    severity: "info",
    ...overrides,
  };
}

function narration(overrides: Partial<NarrationInput> = {}): NarrationInput {
  return {
    firstName: "Luís",
    greeting: "Bom dia",
    agenda: [],
    agendaStatus: "empty",
    activeWorks: [],
    blocked: [],
    quality: [],
    delayed: [],
    deliveries: [],
    quotes: [],
    stock: [],
    priorities: [],
    unavailableLabels: [],
    ...overrides,
  };
}

describe("greetingForHour", () => {
  it("uses the workshop day periods", () => {
    expect(greetingForHour(7)).toBe("Bom dia");
    expect(greetingForHour(12)).toBe("Boa tarde");
    expect(greetingForHour(20)).toBe("Boa noite");
  });
});

describe("buildNarration", () => {
  it("never turns an unavailable agenda into zero appointments", () => {
    const text = buildNarration(
      narration({
        agendaStatus: "unavailable",
        unavailableLabels: ["a agenda"],
      })
    );

    expect(text).toContain("Não consegui consultar a agenda");
    expect(text).not.toContain("Não há marcações para hoje");
  });

  it("states an empty agenda only when the source answered", () => {
    const text = buildNarration(narration({ agendaStatus: "empty" }));

    expect(text).toContain("Não há marcações para hoje");
    expect(text).not.toContain("Não consegui consultar");
  });

  it("reads the first priority and the appointment time", () => {
    const priority = item({ id: "w1", title: "WO-1 · Audi RS6", detail: "À espera de peças" });
    const appointment = item({
      id: "a1",
      title: "BMW M4 · AA-00-AA",
      kind: "appointment",
      time: "09:30",
    });

    const text = buildNarration(
      narration({
        priorities: [priority],
        agenda: [appointment],
        agendaStatus: "available",
      })
    );

    expect(text).toContain("A tua prioridade é WO-1 · Audi RS6, À espera de peças");
    expect(text).toContain("às 09:30");
  });

  it("uses singular and plural correctly", () => {
    const single = buildNarration(
      narration({
        stock: [item({ id: "s1", title: "Stek DYNOshield", kind: "stock" })],
        quotes: [item({ id: "q1", title: "ORC-1", kind: "quote" })],
      })
    );

    expect(single).toContain("O material Stek DYNOshield está abaixo do stock mínimo");
    expect(single).toContain("Há um orçamento sem resposta há mais de quatro dias");

    const plural = buildNarration(
      narration({
        stock: [
          item({ id: "s1", title: "Stek DYNOshield", kind: "stock" }),
          item({ id: "s2", title: "3M 2080", kind: "stock" }),
        ],
      })
    );

    expect(plural).toContain("Há 2 materiais abaixo do stock mínimo");
  });

  it("mentions work waiting for quality control", () => {
    const text = buildNarration(
      narration({
        quality: [item({ id: "qc1", title: "WO-2026-10 · BMW M4", kind: "work_order" })],
      })
    );

    expect(text).toContain(
      "Há um trabalho em controlo de qualidade: WO-2026-10 · BMW M4"
    );
  });

  it("mentions ready deliveries without inventing a forecast", () => {
    const text = buildNarration(
      narration({
        deliveries: [item({ id: "d1", title: "WO-9 · Golf", kind: "work_order" })],
      })
    );

    expect(text).toContain("WO-9 · Golf está pronta para entrega");
    expect(text).not.toContain("previsão");
  });

  it("confirms the sources answered when there is nothing to report", () => {
    const text = buildNarration(narration());

    expect(text).toContain("As fontes responderam");
  });
});
