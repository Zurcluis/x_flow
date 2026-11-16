import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InboxView } from "@/app/inbox/InboxView";
import { navSectionsForRole } from "@/components/xflow/Sidebar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("Inbox RBAC navigation", () => {
  it("shows Mensagens (/inbox) to admin and workshop_manager, and hides it from technician", () => {
    const adminHrefs = navSectionsForRole("admin").flatMap((s) => s.items.map((i) => i.href));
    const managerHrefs = navSectionsForRole("workshop_manager").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    const techHrefs = navSectionsForRole("technician").flatMap((s) => s.items.map((i) => i.href));

    expect(adminHrefs).toContain("/inbox");
    expect(managerHrefs).toContain("/inbox");
    expect(techHrefs).not.toContain("/inbox");
  });
});

describe("InboxView UI states", () => {
  it("renders empty state when there are no threads", () => {
    render(
      <InboxView
        initialAccounts={[]}
        initialThreads={[]}
        initialCounts={{
          total: 0,
          needsReply: 0,
          leads: 0,
          gmail: 0,
          instagram: 0,
          archived: 0,
        }}
        initialCustomers={[]}
        initialDetail={null}
        newWebsiteLeadsCount={2}
        renderedAt="2026-11-16T18:00:00.000Z"
      />
    );

    expect(screen.getByText("Mensagens (Gmail + Instagram)")).toBeInTheDocument();
    expect(screen.getByText("Ainda não existem conversas sincronizadas")).toBeInTheDocument();
    expect(screen.getByText("2 pedido(s) do site")).toBeInTheDocument();
  });

  it("renders synchronized Gmail and Instagram threads with deterministic 24h IG window", () => {
    const igThread = {
      id: "th-ig-1",
      organizationId: "org-1",
      channelAccountId: "acc-ig",
      channel: "instagram" as const,
      externalThreadId: "conv-ig-1",
      participantName: "@pedrozzz._",
      participantHandle: "@pedrozzz._",
      participantExternalId: "12345",
      subject: null,
      snippet: "Pedido de orçamento PPF Tesla",
      category: "lead" as const,
      status: "needs_reply" as const,
      unreadCount: 1,
      lastMessageAt: "2026-11-16T16:00:00.000Z",
      lastInboundAt: "2026-11-16T16:00:00.000Z",
      lastOutboundAt: null,
      linkedCustomerId: null,
      linkedVehicleId: null,
      linkedQuoteId: null,
      aiSummary: null,
      aiExtractedVehicle: null,
      aiExtractedService: null,
    };

    render(
      <InboxView
        initialAccounts={[
          {
            id: "acc-ig",
            organizationId: "org-1",
            channel: "instagram",
            provider: "composio",
            externalAccountId: "ig_1",
            displayHandle: "@x_motion.wrap",
            status: "active",
            syncCursor: {},
            lastSyncedAt: "2026-11-16T17:50:00.000Z",
            lastError: null,
          },
        ]}
        initialThreads={[igThread]}
        initialCounts={{
          total: 1,
          needsReply: 1,
          leads: 1,
          gmail: 0,
          instagram: 1,
          archived: 0,
        }}
        initialCustomers={[]}
        initialDetail={{
          thread: igThread,
          messages: [
            {
              id: "msg-1",
              organizationId: "org-1",
              threadId: "th-ig-1",
              externalMessageId: "ext-1",
              direction: "inbound",
              senderName: "@pedrozzz._",
              senderHandle: "@pedrozzz._",
              recipientHandle: "@x_motion.wrap",
              bodyText: "Boa noite, queria orçamento para PPF num Tesla.",
              bodyHtmlSanitized: null,
              attachments: [],
              sentAt: "2026-11-16T16:00:00.000Z",
              sentByProfileId: null,
            },
          ],
        }}
        newWebsiteLeadsCount={0}
        renderedAt="2026-11-16T18:00:00.000Z"
      />
    );

    expect(screen.getAllByText("@pedrozzz._").length).toBeGreaterThan(0);
    expect(screen.getByText(/Janela IG 24h ativa/i)).toBeInTheDocument();
    expect(screen.getByText("Boa noite, queria orçamento para PPF num Tesla.")).toBeInTheDocument();
    expect(screen.getByText("Converter em Lead / Cliente")).toBeInTheDocument();

    // Two-step confirmation flow in reply composer
    const textarea = screen.getByLabelText("Mensagem de resposta");
    fireEvent.change(textarea, { target: { value: "Boa noite! Temos disponibilidade esta sexta-feira." } });
    fireEvent.click(screen.getByRole("button", { name: /Rever e enviar/i }));
    expect(screen.getByText(/Confirmar envio externo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar envio/i })).toBeInTheDocument();
  });

  it("blocks Instagram DM composer cleanly when 24h window is expired", () => {
    const expiredIgThread = {
      id: "th-ig-old",
      organizationId: "org-1",
      channelAccountId: "acc-ig",
      channel: "instagram" as const,
      externalThreadId: "conv-ig-old",
      participantName: "@nuno1717_",
      participantHandle: "@nuno1717_",
      participantExternalId: "999",
      subject: null,
      snippet: "Mota",
      category: "lead" as const,
      status: "needs_reply" as const,
      unreadCount: 0,
      lastMessageAt: "2026-11-04T14:26:31.000Z",
      lastInboundAt: "2026-11-03T11:24:11.000Z",
      lastOutboundAt: null,
      linkedCustomerId: null,
      linkedVehicleId: null,
      linkedQuoteId: null,
      aiSummary: null,
      aiExtractedVehicle: null,
      aiExtractedService: null,
    };

    render(
      <InboxView
        initialAccounts={[]}
        initialThreads={[expiredIgThread]}
        initialCounts={{ total: 1, needsReply: 1, leads: 1, gmail: 0, instagram: 1, archived: 0 }}
        initialCustomers={[]}
        initialDetail={{ thread: expiredIgThread, messages: [] }}
        newWebsiteLeadsCount={0}
        renderedAt="2026-11-16T18:00:00.000Z"
      />
    );

    expect(screen.getByText("Janela IG 24h expirada")).toBeInTheDocument();
    expect(
      screen.getByText(/A janela de 24 horas da Meta para resposta por API expirou/i)
    ).toBeInTheDocument();
  });
});
