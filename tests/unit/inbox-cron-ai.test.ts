import { afterEach, describe, expect, it, vi } from "vitest";
import { isAuthorizedCronRequest } from "@/domains/inbox/cron";
import { answerQuestion } from "@/domains/assistant/intents";
import type { AssistantBriefing } from "@/domains/assistant/types";
import { draftInboxReplyWithAi } from "@/server/inbox/ai";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("isAuthorizedCronRequest", () => {
  it("accepts only exact Bearer CRON_SECRET", () => {
    expect(isAuthorizedCronRequest("Bearer secret-123", "secret-123")).toBe(true);
    expect(isAuthorizedCronRequest("Bearer wrong-secret", "secret-123")).toBe(false);
    expect(isAuthorizedCronRequest("Basic secret-123", "secret-123")).toBe(false);
    expect(isAuthorizedCronRequest(null, "secret-123")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer secret-123", undefined)).toBe(false);
  });
});

describe("draftInboxReplyWithAi", () => {
  it("fails gracefully when AI is disabled (AI_PROVIDER=none)", async () => {
    process.env.AI_PROVIDER = "none";
    const res = await draftInboxReplyWithAi({
      organizationId: "org-1",
      threadId: "thread-1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("IA não está ativada");
    }
  });
});

describe("Assistant inbox awareness & RBAC", () => {
  const baseBriefing: AssistantBriefing = {
    generatedAt: "2026-11-16T08:00:00.000Z",
    operationalDate: "2026-11-16",
    timezone: "Europe/Lisbon",
    greeting: "Bom dia",
    firstName: "Luís",
    sources: [],
    priorities: [],
    agenda: [],
    activeWorks: [],
    blocked: [],
    quality: [],
    deliveries: [],
    quotes: [],
    stock: [],
    narration: "",
    hasAnyData: true,
  };

  it("answers pending lead messages for managers", () => {
    const answer = answerQuestion("Que mensagens tenho no Instagram por responder?", {
      ...baseBriefing,
      inboxMessages: [
        {
          id: "th-1",
          kind: "inbox",
          title: "@pedrozzz._",
          detail: "Instagram",
          time: null,
          href: "/inbox?thread=th-1",
          severity: "warning",
        },
      ],
    });

    expect(answer.text).toContain("1 conversa de lead por responder");
    expect(answer.text).toContain("@pedrozzz._");
    expect(answer.references[0]?.href).toBe("/inbox?thread=th-1");
  });

  it("blocks inbox answers when inboxMessages is omitted (technician RBAC)", () => {
    const answer = answerQuestion("Tenho emails por responder?", baseBriefing);
    expect(answer.text).toContain("apenas para administradores e gestores");
    expect(answer.references).toHaveLength(0);
  });
});
