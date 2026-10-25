import { describe, expect, it } from "vitest";
import { answerQuestion } from "@/domains/assistant/intents";
import type {
  AssistantBriefing,
  AssistantItem,
  AssistantSource,
  AssistantSourceId,
  SourceStatus,
} from "@/domains/assistant/types";

function source(id: AssistantSourceId, status: SourceStatus): AssistantSource {
  return {
    id,
    label: id,
    status,
    consultedAt: status === "unavailable" ? null : "2026-10-23T08:00:00.000Z",
  };
}

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

const blockedItem = item({
  id: "w1",
  title: "WO-1 · Audi RS6",
  detail: "À espera de peças",
  severity: "danger",
  href: "/production/w1",
});

const deliveryItem = item({
  id: "w9",
  title: "WO-9 · Golf",
  detail: "Concluída e pronta para entrega",
  href: "/production/w9",
});

const quoteItem = item({
  id: "q1",
  title: "ORC-1 · Cliente Silva",
  kind: "quote",
  detail: "Enviado · sem resposta há 6 dias",
  href: "/quotes/q1",
});

const stockItem = item({
  id: "s1",
  title: "Stek DYNOshield",
  kind: "stock",
  detail: "4 m em stock · mínimo 15 m",
  href: "/stock",
});

const agendaItems = [
  item({
    id: "a1",
    title: "BMW M4 · AA-00-AA",
    kind: "appointment",
    time: "10:00",
    detail: "Cliente · PPF · Baía 1",
    href: "/calendar",
  }),
  item({
    id: "a2",
    title: "Audi RS6 · BB-11-BB",
    kind: "appointment",
    time: "14:00",
    detail: "Cliente · Wrap · Baía 2",
    href: "/calendar",
  }),
];

function briefing(overrides: Partial<AssistantBriefing> = {}): AssistantBriefing {
  return {
    generatedAt: "2026-10-23T08:00:00.000Z",
    operationalDate: "2026-10-23",
    timezone: "Europe/Lisbon",
    greeting: "Bom dia",
    firstName: "Luís",
    sources: [
      source("agenda", "available"),
      source("production", "available"),
      source("quotes", "available"),
      source("stock", "available"),
    ],
    priorities: [blockedItem],
    agenda: agendaItems,
    activeWorks: [],
    blocked: [blockedItem],
    quality: [],
    deliveries: [deliveryItem],
    quotes: [quoteItem],
    stock: [stockItem],
    narration: "Bom dia, Luís. Há um trabalho à espera de peças.",
    hasAnyData: true,
    ...overrides,
  };
}

describe("answerQuestion", () => {
  it("answers what is planned for today from the agenda", () => {
    const answer = answerQuestion("O que tenho planeado para hoje?", briefing());

    expect(answer.text).toContain("Hoje há 2 marcações");
    expect(answer.text).toContain("10:00");
    expect(answer.references).toHaveLength(2);
  });

  it("is honest about the absence of a delivery forecast", () => {
    const answer = answerQuestion("Qual é a próxima entrega?", briefing());

    expect(answer.text).toContain("Não tenho uma previsão de entrega");
    expect(answer.text).toContain("WO-9 · Golf");
    expect(answer.text).not.toContain("previsão para");
  });

  it("lists blocked work", () => {
    const answer = answerQuestion("Que trabalhos estão bloqueados?", briefing());

    expect(answer.text).toContain("trabalho bloqueado");
    expect(answer.text).toContain("WO-1 · Audi RS6");
  });

  it("lists quotes waiting for follow-up", () => {
    const answer = answerQuestion("Que orçamentos precisam de seguimento?", briefing());

    expect(answer.text).toContain("orçamento à espera de seguimento");
    expect(answer.text).toContain("ORC-1");
  });

  it("lists stock below the minimum", () => {
    const answer = answerQuestion("Que materiais estão abaixo do mínimo?", briefing());

    expect(answer.text).toContain("material abaixo do mínimo");
    expect(answer.text).toContain("Stek DYNOshield");
  });

  it("explains the first priority", () => {
    const answer = answerQuestion("Explica-me melhor a primeira prioridade.", briefing());

    expect(answer.text).toContain("A primeira prioridade é WO-1 · Audi RS6");
  });

  it("repeats the agenda when asked", () => {
    const answer = answerQuestion("Repete a agenda", briefing());

    expect(answer.text).toContain("marcações");
    expect(answer.text).toContain("10:00");
  });

  it("finds the next appointment using Lisbon time", () => {
    const answer = answerQuestion(
      "Qual é a próxima marcação?",
      briefing({ generatedAt: "2026-10-23T16:00:00.000Z" })
    );

    expect(answer.text).toBe("Não há mais marcações para hoje.");
  });

  it("does not invent an answer outside the allowed domains", () => {
    const answer = answerQuestion("Quem ganhou o jogo ontem?", briefing());

    expect(answer.text).toContain("Não tenho dados");
    expect(answer.references).toHaveLength(0);
  });

  it("reports an unavailable agenda instead of an empty day", () => {
    const answer = answerQuestion(
      "O que tenho para hoje?",
      briefing({
        sources: [
          source("agenda", "unavailable"),
          source("production", "available"),
          source("quotes", "available"),
          source("stock", "available"),
        ],
      })
    );

    expect(answer.text).toContain("Não consegui consultar a agenda");
    expect(answer.text).not.toContain("não tem marcações");
  });

  it("reports an unavailable production instead of no blockers", () => {
    const answer = answerQuestion(
      "Que trabalhos estão bloqueados?",
      briefing({
        sources: [
          source("agenda", "available"),
          source("production", "unavailable"),
          source("quotes", "available"),
          source("stock", "available"),
        ],
      })
    );

    expect(answer.text).toContain("Não consegui consultar a produção");
  });

  it("normalizes accents in the question", () => {
    const answer = answerQuestion("Que orcamentos precisam de seguimento?", briefing());

    expect(answer.text).toContain("ORC-1");
  });

  it("never exposes monetary values in the pilot answers", () => {
    const questions = [
      "O que tenho planeado para hoje?",
      "Qual é a próxima entrega?",
      "Que trabalhos estão bloqueados?",
      "Que orçamentos precisam de seguimento?",
      "Que materiais estão abaixo do mínimo?",
      "Explica-me melhor a primeira prioridade.",
    ];

    for (const question of questions) {
      expect(answerQuestion(question, briefing()).text).not.toContain("€");
    }
  });
});
