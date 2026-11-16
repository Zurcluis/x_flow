import { describe, expect, it } from "vitest";
import {
  buildMessageSnippet,
  classifyInboxThread,
  computeThreadStatus,
  evaluateInstagramReplyWindow,
  normalizeContactHandle,
  parseSenderIdentity,
  sanitizeMessageText,
  validateInboxReplyDraft,
} from "@/domains/inbox/rules";

describe("evaluateInstagramReplyWindow", () => {
  const now = new Date("2026-11-16T16:00:00.000Z");

  it("returns none when no inbound timestamp exists", () => {
    expect(evaluateInstagramReplyWindow(null, now)).toEqual({
      state: "none",
      expiresAt: null,
      remainingMinutes: 0,
    });
  });

  it("returns open when inbound message was sent 2 hours ago", () => {
    const res = evaluateInstagramReplyWindow("2026-11-16T14:00:00.000Z", now);
    expect(res.state).toBe("open");
    expect(res.remainingMinutes).toBe(22 * 60);
    expect(res.expiresAt).toBe("2026-11-17T14:00:00.000Z");
  });

  it("returns expiring_soon when less than 4 hours remain", () => {
    const res = evaluateInstagramReplyWindow("2026-11-15T18:30:00.000Z", now);
    expect(res.state).toBe("expiring_soon");
    expect(res.remainingMinutes).toBe(150);
  });

  it("returns expired when 24 hours or more have elapsed", () => {
    const res = evaluateInstagramReplyWindow("2026-11-15T15:59:00.000Z", now);
    expect(res.state).toBe("expired");
    expect(res.remainingMinutes).toBe(0);
  });
});

describe("parseSenderIdentity & normalizeContactHandle", () => {
  it("extracts display name and lowercase email", () => {
    expect(parseSenderIdentity('"Márcio Silva" <Marcio.Silva@Gmail.com>', "gmail")).toEqual({
      name: "Márcio Silva",
      handle: "marcio.silva@gmail.com",
    });
  });

  it("handles bare email addresses", () => {
    expect(parseSenderIdentity("geral@p1poleone.pt", "gmail")).toEqual({
      name: null,
      handle: "geral@p1poleone.pt",
    });
  });

  it("normalizes instagram handles consistently", () => {
    expect(normalizeContactHandle("@@Pedrozzz._ ", "instagram")).toBe("@pedrozzz._");
    expect(parseSenderIdentity("nuno1717_", "instagram")).toEqual({
      name: "@nuno1717_",
      handle: "@nuno1717_",
    });
  });
});

describe("sanitizeMessageText & buildMessageSnippet", () => {
  it("strips scripts, styles, HTML tags and decodes entities", () => {
    const raw =
      "<style>body{color:red}</style><p>Boa tarde!<br/>Gostava de or&ccedil;amento &#39;PPF&#39; &amp; Wrap.</p><script>alert(1)</script>";
    const clean = sanitizeMessageText(raw);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("color:red");
    expect(clean).toContain("orçamento 'PPF' & Wrap.");
  });

  it("truncates snippets cleanly to maxLength", () => {
    const snippet = buildMessageSnippet("Linha um\nLinha dois com texto suficientemente longo para cortar.", 25);
    expect(snippet.length).toBeLessThanOrEqual(25);
    expect(snippet.endsWith("…")).toBe(true);
  });
});

describe("classifyInboxThread", () => {
  it("classifies Google security alerts as security", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "no-reply@accounts.google.com",
        subject: "Alerta de segurança",
        text: "Nova token de acesso",
      })
    ).toBe("security");
  });

  it("classifies CVs as hr", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "candidato@example.com",
        subject: "Copia_de_CV_Europass.pdf",
        text: "Envio o meu currículo em anexo",
      })
    ).toBe("hr");
  });

  it("classifies accounting emails as admin", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "margarida@grupoyour.pt",
        subject: "Pastas Contabilidade",
        text: "Recolha no Grupo Your",
      })
    ).toBe("admin");
  });

  it("classifies film suppliers as supplier", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "sales@isffilm.com",
        subject: "Gloss Black PPF",
        text: "Invitation to booth F31 at Automechanika",
      })
    ).toBe("supplier");
  });

  it("classifies quote requests and Instagram DMs as lead", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "cliente@example.pt",
        subject: "Orçamento PPF BMW",
        text: "Preciso de cotação para pára-choques dianteiro",
      })
    ).toBe("lead");

    expect(
      classifyInboxThread({
        channel: "instagram",
        senderHandle: "@pedrozzz._",
        text: "Olá, tenho um Tesla novo e queria wrap transparente",
      })
    ).toBe("lead");
  });

  it("does not misclassify no-reply system emails or substring false positives as leads", () => {
    expect(
      classifyInboxThread({
        channel: "gmail",
        senderHandle: "no-reply@txn.dropbox.com",
        subject: "Welcome to Dropbox! Your audio checklist",
        text: "Sign in audit report for your new team setup",
      })
    ).toBe("other");
  });
});

describe("computeThreadStatus", () => {
  it("marks replied when outbound is newer than or equal to inbound", () => {
    expect(
      computeThreadStatus({
        lastInboundAt: "2026-11-12T10:00:00.000Z",
        lastOutboundAt: "2026-11-12T12:00:00.000Z",
      })
    ).toBe("replied");
  });

  it("marks needs_reply when client writes after our outbound message", () => {
    expect(
      computeThreadStatus({
        lastInboundAt: "2026-11-12T15:00:00.000Z",
        lastOutboundAt: "2026-11-12T12:00:00.000Z",
      })
    ).toBe("needs_reply");
  });

  it("preserves archived and converted statuses", () => {
    expect(
      computeThreadStatus({
        currentStatus: "archived",
        lastInboundAt: "2026-11-12T15:00:00.000Z",
      })
    ).toBe("archived");

    expect(
      computeThreadStatus({
        linkedQuoteId: "q-123",
        lastInboundAt: "2026-11-12T15:00:00.000Z",
      })
    ).toBe("converted");
  });
});

describe("validateInboxReplyDraft", () => {
  const now = new Date("2026-11-16T18:00:00.000Z");

  it("validates a valid Gmail reply draft", () => {
    const res = validateInboxReplyDraft({
      channel: "gmail",
      text: "  Bom dia, podemos agendar a inspeção para amanhã.  ",
      recipientHandle: "Cliente@Exemplo.pt ",
      now,
    });
    expect(res).toEqual({
      ok: true,
      cleanText: "Bom dia, podemos agendar a inspeção para amanhã.",
      recipient: "cliente@exemplo.pt",
    });
  });

  it("rejects empty text or invalid Gmail address", () => {
    expect(
      validateInboxReplyDraft({
        channel: "gmail",
        text: " ",
        recipientHandle: "cliente@exemplo.pt",
        now,
      }).ok
    ).toBe(false);

    expect(
      validateInboxReplyDraft({
        channel: "gmail",
        text: "Olá",
        recipientHandle: "email-invalido",
        now,
      }).ok
    ).toBe(false);
  });

  it("blocks Instagram reply when 24h window has expired or PSID is missing", () => {
    const expired = validateInboxReplyDraft({
      channel: "instagram",
      text: "Olá!",
      recipientHandle: "@cliente",
      participantExternalId: "psid-123",
      lastInboundAt: "2026-11-15T10:00:00.000Z",
      now,
    });
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.windowClosed).toBe(true);

    const missingPsid = validateInboxReplyDraft({
      channel: "instagram",
      text: "Olá!",
      recipientHandle: "@cliente",
      participantExternalId: null,
      lastInboundAt: "2026-11-16T17:00:00.000Z",
      now,
    });
    expect(missingPsid.ok).toBe(false);
  });

  it("enforces Instagram 1000-char limit and allows valid DM inside 24h window", () => {
    const tooLong = validateInboxReplyDraft({
      channel: "instagram",
      text: "a".repeat(1001),
      recipientHandle: "@cliente",
      participantExternalId: "psid-123",
      lastInboundAt: "2026-11-16T17:00:00.000Z",
      now,
    });
    expect(tooLong.ok).toBe(false);

    const valid = validateInboxReplyDraft({
      channel: "instagram",
      text: "Olá! Temos disponibilidade esta semana.",
      recipientHandle: "@cliente",
      participantExternalId: "psid-123",
      lastInboundAt: "2026-11-16T17:00:00.000Z",
      now,
    });
    expect(valid).toEqual({
      ok: true,
      cleanText: "Olá! Temos disponibilidade esta semana.",
      recipient: "psid-123",
    });
  });
});
