import { describe, expect, it } from "vitest";
import {
  AiResponseError,
  buildAssistantContext,
  parseAnswerPayload,
  referencesFromIds,
} from "@/server/ai/gemini";
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
    consultedAt: status === "unavailable" ? null : "2026-10-25T08:00:00.000Z",
  };
}

function item(
  overrides: Partial<AssistantItem> & { id: string; title: string }
): AssistantItem {
  return {
    kind: "work_order",
    detail: null,
    time: null,
    href: "/production",
    severity: "info",
    ...overrides,
  };
}

const blocked = item({
  id: "w1",
  title: "WO-1 - Audi RS6",
  detail: "À espera de peças",
  href: "/production/w1",
  severity: "danger",
});

const appointment = item({
  id: "a1",
  title: "BMW M4 - AA-00-AA",
  kind: "appointment",
  time: "10:00",
  href: "/calendar",
});

function briefing(overrides: Partial<AssistantBriefing> = {}): AssistantBriefing {
  return {
    generatedAt: "2026-10-25T08:00:00.000Z",
    operationalDate: "2026-10-25",
    timezone: "Europe/Lisbon",
    greeting: "Bom dia",
    firstName: "Luís",
    sources: [
      source("agenda", "available"),
      source("production", "available"),
      source("quotes", "empty"),
      source("stock", "empty"),
    ],
    priorities: [blocked],
    agenda: [appointment],
    activeWorks: [],
    blocked: [blocked],
    quality: [],
    deliveries: [],
    quotes: [],
    stock: [],
    narration: "Bom dia, Luís.",
    hasAnyData: true,
    ...overrides,
  };
}

describe("buildAssistantContext", () => {
  it("includes ids and operational data without exposing hrefs", () => {
    const context = buildAssistantContext(briefing());

    expect(context).toContain("w1");
    expect(context).toContain("WO-1 - Audi RS6");
    expect(context).toContain("10:00");
    expect(context).not.toContain("/production/w1");
    expect(context).not.toContain("/calendar");
  });

  it("reports unavailable sources instead of hiding them", () => {
    const context = buildAssistantContext(
      briefing({
        sources: [
          source("agenda", "unavailable"),
          source("production", "available"),
          source("quotes", "available"),
          source("stock", "available"),
        ],
      })
    );

    expect(context).toContain("unavailable");
  });
});

describe("referencesFromIds", () => {
  it("maps known ids to trusted records, removing duplicates", () => {
    const references = referencesFromIds(briefing(), ["w1", "a1", "w1", "unknown"]);

    expect(references).toEqual([
      { label: "WO-1 - Audi RS6", href: "/production/w1" },
      { label: "BMW M4 - AA-00-AA", href: "/calendar" },
    ]);
  });

  it("limits references to four", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      item({ id: `w${index}`, title: `WO-${index}`, href: `/production/w${index}` })
    );
    const references = referencesFromIds(
      briefing({ blocked: items, priorities: items }),
      items.map((entry) => entry.id)
    );

    expect(references).toHaveLength(4);
  });
});

describe("parseAnswerPayload", () => {
  it("parses JSON with a fence and maps references", () => {
    const result = parseAnswerPayload(
      '```json\n{"text":"A prioridade é a WO-1.","transcript":"Qual é a prioridade?","referenceIds":["w1"]}\n```',
      briefing()
    );

    expect(result.answer.text).toBe("A prioridade é a WO-1.");
    expect(result.answer.references).toEqual([
      { label: "WO-1 - Audi RS6", href: "/production/w1" },
    ]);
    expect(result.transcript).toBe("Qual é a prioridade?");
  });

  it("rejects responses without text", () => {
    expect(() => parseAnswerPayload('{"referenceIds":["w1"]}', briefing())).toThrow(
      AiResponseError
    );
  });

  it("rejects invalid JSON", () => {
    expect(() => parseAnswerPayload("não é json", briefing())).toThrow(AiResponseError);
  });

  it("ignores unknown and non-string reference ids", () => {
    const result = parseAnswerPayload(
      '{"text":"Resposta.","referenceIds":["unknown",5,null,"a1"]}',
      briefing()
    );

    expect(result.answer.references).toEqual([
      { label: "BMW M4 - AA-00-AA", href: "/calendar" },
    ]);
    expect(result.transcript).toBeNull();
  });
});
