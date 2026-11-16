import { describe, expect, it, vi } from "vitest";
import { ComposioInboxProvider, parseMcpSsePayload } from "@/server/inbox/providers/composio";
import { InboxProviderAuthError, InboxProviderSendError } from "@/server/inbox/providers/types";

describe("parseMcpSsePayload", () => {
  it("parses Composio SSE event-stream responses cleanly", () => {
    const rawSse = [
      ": connected",
      "",
      "event: message",
      'data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{\\"successful\\":true,\\"data\\":{\\"ok\\":42}}"}]}}',
    ].join("\n");

    expect(parseMcpSsePayload(rawSse)).toEqual({
      successful: true,
      data: { ok: 42 },
    });
  });

  it("parses direct JSON responses when returned", () => {
    const rawJson = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: { content: [{ type: "text", text: JSON.stringify({ successful: true, data: { x: 1 } }) }] },
    });
    expect(parseMcpSsePayload(rawJson)).toEqual({ successful: true, data: { x: 1 } });
  });
});

describe("ComposioInboxProvider auth error detection", () => {
  it("throws InboxProviderAuthError on insufficient Gmail OAuth scopes", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        `event: message\ndata: ${JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  successful: false,
                  data: {
                    results: [
                      {
                        tool_slug: "GMAIL_GET_PROFILE",
                        error: "403 Forbidden: ACCESS_TOKEN_SCOPE_INSUFFICIENT",
                        response: { successful: false },
                      },
                    ],
                  },
                }),
              },
            ],
          },
        })}\n`,
        { status: 200, headers: { "content-type": "text/event-stream" } }
      )
    );

    vi.stubGlobal("fetch", mockFetch);
    const provider = new ComposioInboxProvider("ck_test_key");

    await expect(provider.fetchGmailProfile("gmail_test")).rejects.toBeInstanceOf(
      InboxProviderAuthError
    );

    vi.unstubAllGlobals();
  });

  it("sends Gmail replies via GMAIL_REPLY_TO_THREAD", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        `event: message\ndata: ${JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  successful: true,
                  data: {
                    results: [
                      {
                        tool_slug: "GMAIL_REPLY_TO_THREAD",
                        response: { successful: true, data: { id: "msg_sent_123" } },
                      },
                    ],
                  },
                }),
              },
            ],
          },
        })}\n`,
        { status: 200, headers: { "content-type": "text/event-stream" } }
      )
    );

    vi.stubGlobal("fetch", mockFetch);
    const provider = new ComposioInboxProvider("ck_test_key");

    const res = await provider.sendGmailReply({
      accountId: "gmail_test",
      threadId: "thread_abc",
      recipientEmail: "cliente@exemplo.pt",
      messageBody: "Boa tarde, orçamento enviado.",
    });

    expect(res.externalMessageId).toBe("msg_sent_123");
    vi.unstubAllGlobals();
  });

  it("marks Instagram 24h window blocks (subcode 2534022) as non-retryable InboxProviderSendError", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        `event: message\ndata: ${JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  successful: false,
                  data: {
                    results: [
                      {
                        tool_slug: "INSTAGRAM_SEND_TEXT_MESSAGE",
                        error: "403 IGApiException code=10 error_subcode=2534022 outside of allowed window",
                        response: { successful: false },
                      },
                    ],
                  },
                }),
              },
            ],
          },
        })}\n`,
        { status: 200, headers: { "content-type": "text/event-stream" } }
      )
    );

    vi.stubGlobal("fetch", mockFetch);
    const provider = new ComposioInboxProvider("ck_test_key");

    await expect(
      provider.sendInstagramReply({
        accountId: "ig_test",
        recipientId: "psid_1",
        text: "Olá!",
      })
    ).rejects.toMatchObject({
      name: InboxProviderSendError.name,
      windowClosed: true,
      retryable: false,
    });

    vi.unstubAllGlobals();
  });
});
