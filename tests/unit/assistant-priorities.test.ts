import { describe, expect, it } from "vitest";
import { buildPriorities, type PriorityInput } from "@/domains/assistant/priorities";
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

function input(overrides: Partial<PriorityInput> = {}): PriorityInput {
  return {
    blocked: [],
    quality: [],
    delayed: [],
    deliveries: [],
    agenda: [],
    quotes: [],
    stock: [],
    ...overrides,
  };
}

describe("buildPriorities", () => {
  it("puts blocked work before commitments and commercial follow-up", () => {
    const priorities = buildPriorities(
      input({
        stock: [item({ id: "s1", title: "Película PPF", kind: "stock" })],
        quotes: [item({ id: "q1", title: "ORC-1", kind: "quote" })],
        agenda: [item({ id: "a1", title: "BMW M4", kind: "appointment", time: "09:00" })],
        blocked: [item({ id: "w1", title: "WO-1 · Audi RS6" })],
        limit: 3,
      })
    );

    expect(priorities.map((entry) => entry.id)).toEqual(["w1", "a1", "q1"]);
  });

  it("orders quality control above delayed work and deliveries", () => {
    const priorities = buildPriorities(
      input({
        deliveries: [item({ id: "d1", title: "WO-9 · Golf", kind: "work_order" })],
        delayed: [item({ id: "l1", title: "WO-8 · Polo" })],
        quality: [item({ id: "c1", title: "WO-7 · Ibiza" })],
      })
    );

    expect(priorities.map((entry) => entry.id)).toEqual(["c1", "l1", "d1"]);
  });

  it("uses the appointment time as tie-breaker", () => {
    const priorities = buildPriorities(
      input({
        agenda: [
          item({ id: "late", title: "Audi", kind: "appointment", time: "15:30" }),
          item({ id: "early", title: "BMW", kind: "appointment", time: "08:15" }),
        ],
      })
    );

    expect(priorities.map((entry) => entry.id)).toEqual(["early", "late"]);
  });

  it("never repeats the same item", () => {
    const shared = item({ id: "w1", title: "WO-1 · Audi" });
    const priorities = buildPriorities(
      input({
        blocked: [shared],
        delayed: [shared],
        quality: [shared],
      })
    );

    expect(priorities).toHaveLength(1);
  });

  it("caps the list at three by default", () => {
    const priorities = buildPriorities(
      input({
        blocked: [
          item({ id: "b1", title: "B1" }),
          item({ id: "b2", title: "B2" }),
        ],
        quality: [item({ id: "c1", title: "C1" })],
        agenda: [item({ id: "a1", title: "A1", kind: "appointment" })],
      })
    );

    expect(priorities).toHaveLength(3);
  });
});
