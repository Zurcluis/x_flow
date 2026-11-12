import nodemailer from "nodemailer";
import { buildEnrichedMessage, validateProposal, type ProposalData } from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 20_000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const attempts = new Map<string, { count: number; reset: number }>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.reset <= now) {
    attempts.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }

  if (current.count >= MAX_REQUESTS) return true;

  current.count += 1;
  return false;
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function createBudgetReference() {
  const year = new Date().getUTCFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `ORC-${year}-${suffix}`;
}

async function sendGmailNotification(data: ProposalData, reference: string) {
  const user = process.env.GMAIL_SMTP_USER?.trim();
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD?.trim();
  const to = process.env.PROPOSALS_TO_EMAIL?.trim() || siteConfig.email;

  if (!user || !pass) {
    return { configured: false as const, sent: false as const };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const subject = cleanHeaderValue(`[Orçamento X-Motion] ${data.service} · ${data.vehicle}`);
  const originLabel = data.source || "Site X-Motion";
  const createdAt = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  const textLines = [
    `Novo pedido de orçamento X-Motion (${reference})`,
    `Data: ${createdAt}`,
    `Serviço: ${data.service}`,
    data.coverage ? `Âmbito: ${data.coverage}` : null,
    `Viatura: ${data.vehicle}`,
    `Nome: ${data.name}`,
    `E-mail: ${data.email}`,
    data.phone ? `Telefone: ${data.phone}` : null,
    `Origem: ${originLabel}`,
    data.message ? `\nNotas do cliente:\n${data.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const rows: Array<[string, string]> = [
    ["Referência", reference],
    ["Serviço", data.service],
    ...(data.coverage ? [["Âmbito", data.coverage] as [string, string]] : []),
    ["Viatura", data.vehicle],
    ["Nome", data.name],
    ["E-mail", data.email],
    ...(data.phone ? [["Telefone", data.phone] as [string, string]] : []),
    ["Origem", originLabel],
    ["Data", createdAt],
  ];

  const tableRowsHtml = rows
    .map(
      ([label, val]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #262926;color:#8c9485;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;width:140px;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #262926;color:#f2f2ee;font-size:14px;">${escapeHtml(val)}</td>
        </tr>`,
    )
    .join("");

  const messageHtml = data.message
    ? `
      <div style="margin-top:22px;padding:16px;background:#171a18;border-left:2px solid #c5aa79;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c5aa79;margin-bottom:8px;">Ideia / Mensagem</div>
        <div style="color:#d6dad2;font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
      </div>`
    : "";

  const html = `
    <div style="background:#101211;color:#f2f2ee;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;border:1px solid #2a2e2a;background:#101211;padding:28px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c5aa79;margin-bottom:10px;">X-MOTION · PEDIDO DE ORÇAMENTO</div>
        <h1 style="margin:0 0 20px;font-size:24px;font-weight:400;color:#f2f2ee;">${escapeHtml(data.vehicle)}</h1>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #262926;">
          ${tableRowsHtml}
        </table>
        ${messageHtml}
        <p style="margin:24px 0 0;font-size:12px;color:#8c9485;">Responda diretamente a este e-mail para contactar <strong style="color:#f2f2ee;font-weight:500;">${escapeHtml(data.name)}</strong>.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `X-Motion <${user}>`,
    to,
    replyTo: cleanHeaderValue(`${data.name} <${data.email}>`),
    subject,
    text: textLines,
    html,
  });

  return { configured: true as const, sent: true as const };
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return json({ error: "Demasiados pedidos. Tente novamente mais tarde." }, 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Formato de pedido inválido." }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) {
    return json({ error: "O pedido é demasiado grande." }, 413);
  }

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: "Não foi possível ler o pedido." }, 400);
  }

  const parsed = validateProposal(input);
  if (!parsed.ok) {
    if (parsed.errors.website) {
      return json({ error: "Pedido inválido." }, 400);
    }

    return json({ error: "Verifique os campos do formulário.", fields: parsed.errors }, 422);
  }

  const endpoint = process.env.XFLOW_PROPOSALS_URL?.trim();
  const secret = process.env.XFLOW_SITE_SECRET?.trim();
  const smtpConfigured = Boolean(
    process.env.GMAIL_SMTP_USER?.trim() && process.env.GMAIL_SMTP_APP_PASSWORD?.trim(),
  );
  const erpConfigured = Boolean(endpoint && secret);

  if (!smtpConfigured && !erpConfigured) {
    return json(
      {
        error: `O envio automático está a ser ativado. Pode enviar diretamente para ${siteConfig.email} ou por mensagem no Instagram.`,
      },
      503,
    );
  }

  const idempotencyKey =
    request.headers.get("x-idempotency-key")?.slice(0, 100) || crypto.randomUUID();
  let reference = createBudgetReference();
  let erpOk = false;
  let emailSent = false;

  if (erpConfigured && endpoint && secret) {
    try {
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: siteConfig.url,
          "x-forwarded-for": clientKey(request),
          "x-xflow-site-secret": secret,
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          service: parsed.data.service,
          vehicle: parsed.data.vehicle,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: buildEnrichedMessage(parsed.data),
          consent: parsed.data.consent,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      const upstreamPayload = (await upstream.json().catch(() => null)) as {
        error?: string;
        reference?: string;
        fields?: unknown;
      } | null;

      if (upstream.ok) {
        erpOk = true;
        if (upstreamPayload?.reference) {
          reference = upstreamPayload.reference;
        }
      } else if (!smtpConfigured) {
        const passthrough = new Set([400, 413, 415, 422, 429, 503]);
        return json(
          {
            error: upstreamPayload?.error ?? "Não foi possível registar o pedido.",
            fields: upstreamPayload?.fields,
          },
          passthrough.has(upstream.status) ? upstream.status : 502,
        );
      }
    } catch {
      if (!smtpConfigured) {
        return json({ error: "O serviço de pedidos está indisponível." }, 502);
      }
    }
  }

  if (smtpConfigured) {
    try {
      const mailResult = await sendGmailNotification(parsed.data, reference);
      emailSent = mailResult.sent;
    } catch (error) {
      console.error(
        "[proposals] falha no envio SMTP:",
        error instanceof Error ? error.message : "erro desconhecido",
      );
      if (!erpOk) {
        return json(
          {
            error: `Não foi possível enviar o pedido neste momento. Tente novamente ou escreva para ${siteConfig.email}.`,
          },
          502,
        );
      }
    }
  }

  if (!emailSent && !erpOk) {
    return json({ error: "O serviço de pedidos está indisponível." }, 502);
  }

  return json({ ok: true, reference }, 202);
}
