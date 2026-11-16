import type {
  InboxCategory,
  InboxChannel,
  InboxThreadStatus,
  InstagramWindowStatus,
} from "./types";

const INSTAGRAM_WINDOW_MS = 24 * 60 * 60 * 1000;
const INSTAGRAM_EXPIRING_SOON_MS = 4 * 60 * 60 * 1000;

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&ccedil;": "ç",
  "&Ccedil;": "Ç",
  "&atilde;": "ã",
  "&Atilde;": "Ã",
  "&otilde;": "õ",
  "&Otilde;": "Õ",
  "&aacute;": "á",
  "&Aacute;": "Á",
  "&eacute;": "é",
  "&Eacute;": "É",
  "&iacute;": "í",
  "&Iacute;": "Í",
  "&oacute;": "ó",
  "&Oacute;": "Ó",
  "&uacute;": "ú",
  "&Uacute;": "Ú",
  "&agrave;": "à",
  "&Agrave;": "À",
  "&acirc;": "â",
  "&Acirc;": "Â",
  "&ecirc;": "ê",
  "&Ecirc;": "Ê",
  "&ocirc;": "ô",
  "&Ocirc;": "Ô",
};

/**
 * Avalia deterministicamente a janela de 24 horas exigida pela API da Meta
 * para responder por Instagram Direct após a última mensagem recebida.
 */
export function evaluateInstagramReplyWindow(
  lastInboundAt: string | Date | null | undefined,
  now: Date = new Date()
): InstagramWindowStatus {
  if (!lastInboundAt) {
    return { state: "none", expiresAt: null, remainingMinutes: 0 };
  }

  const inboundDate = lastInboundAt instanceof Date ? lastInboundAt : new Date(lastInboundAt);
  if (Number.isNaN(inboundDate.getTime())) {
    return { state: "none", expiresAt: null, remainingMinutes: 0 };
  }

  const expiresMs = inboundDate.getTime() + INSTAGRAM_WINDOW_MS;
  const remainingMs = expiresMs - now.getTime();
  const expiresAt = new Date(expiresMs).toISOString();

  if (remainingMs <= 0) {
    return { state: "expired", expiresAt, remainingMinutes: 0 };
  }

  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  return {
    state: remainingMs <= INSTAGRAM_EXPIRING_SOON_MS ? "expiring_soon" : "open",
    expiresAt,
    remainingMinutes,
  };
}

/**
 * Normaliza identificadores de contacto por canal (email em minúsculas ou @handle).
 */
export function normalizeContactHandle(raw: string | null | undefined, channel: InboxChannel): string {
  const value = (raw ?? "").trim();
  if (!value) return "";

  if (channel === "gmail") {
    return value.toLowerCase();
  }

  const stripped = value.replace(/^@+/, "").trim().toLowerCase();
  return stripped ? `@${stripped}` : "";
}

/**
 * Separa nome e endereço/handle de cabeçalhos tipo `"Nome" <email@dominio.pt>`.
 */
export function parseSenderIdentity(
  raw: string | null | undefined,
  channel: InboxChannel = "gmail"
): { name: string | null; handle: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { name: null, handle: "" };
  }

  if (channel === "instagram") {
    const handle = normalizeContactHandle(trimmed, "instagram");
    return { name: handle || trimmed, handle };
  }

  const angleMatch = trimmed.match(/^(.*?)<([^>]+)>$/);
  if (angleMatch) {
    const rawName = angleMatch[1].replace(/^[\s"']+|[\s"']+$/g, "").trim();
    const email = normalizeContactHandle(angleMatch[2], "gmail");
    return {
      name: rawName || null,
      handle: email,
    };
  }

  if (trimmed.includes("@")) {
    return {
      name: null,
      handle: normalizeContactHandle(trimmed, "gmail"),
    };
  }

  return { name: trimmed, handle: trimmed.toLowerCase() };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp|ccedil|atilde|otilde|aacute|eacute|iacute|oacute|uacute|agrave|acirc|ecirc|ocirc);|&#39;/gi,
      (match) => {
        return HTML_ENTITY_MAP[match] ?? HTML_ENTITY_MAP[match.toLowerCase()] ?? match;
      }
    )
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    });
}

/**
 * Limpa scripts, estilos e tags HTML de mensagens antes de guardar ou mostrar na UI.
 */
export function sanitizeMessageText(raw: string | null | undefined): string {
  if (!raw) return "";

  const withoutScripts = raw
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeHtmlEntities(withoutScripts)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return decoded;
}

export function buildMessageSnippet(raw: string | null | undefined, maxLength = 160): string {
  const clean = sanitizeMessageText(raw).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function normalizeForClassification(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const SECURITY_MARKERS = [
  "accounts.google.com",
  "alerta de seguranca",
  "security alert",
  "token de acesso",
  "validacao em dois passos",
  "two-step verification",
  "app authenticator",
];

const HR_MARKERS = ["europass", "curriculo", "curriculum", "candidatura"];

const ADMIN_MARKERS = [
  "grupoyour",
  "contabilidade",
  "faturacao",
  "securitas",
  "contrato",
  "cessao de posicao",
];

const SUPPLIER_MARKERS = [
  "isffilm",
  "nkoda",
  "carcareeurope",
  "automechanika",
  "roll",
  "booth",
  "wholesale",
  "ppf enhance gyeon",
  "gloss black film",
];

const LEAD_MARKERS = [
  "orcamento",
  "cotacao",
  "proposta",
  "disponibilidade",
  "ppf",
  "car wrap",
  "wrap",
  "covering",
  "vinil",
  "pelicula",
  "chrome delete",
  "escurecer",
  "mota",
  "viatura",
  "para-choques",
  "parachoques",
  "tejadilho",
  "audi",
  "bmw",
  "mercedes",
  "porsche",
  "volvo",
  "tesla",
  "toyota",
  "polestar",
  "ferrari",
  "lamborghini",
  "yamaha",
  "megane",
  "tucson",
  "skoda",
];

const SPAM_MARKERS = ["eletricidade", "energia", "enerlusa", "acibraoenergia"];

const AUTOMATED_SYSTEM_SENDERS = [
  "accounts.google.com",
  "google.com",
  "dropbox.com",
  "dropboxmail.com",
  "txn.dropbox.com",
  "composio.dev",
  "vercel.com",
  "github.com",
];

function containsMarker(normalizedText: string, marker: string): boolean {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
}

/**
 * Classificação determinística baseada em remetente, assunto e texto (funciona sem IA).
 */
export function classifyInboxThread(input: {
  channel: InboxChannel;
  senderHandle?: string | null;
  subject?: string | null;
  text?: string | null;
}): InboxCategory {
  const normalizedSender = normalizeForClassification(input.senderHandle ?? "");
  const combined = normalizeForClassification(
    [input.senderHandle ?? "", input.subject ?? "", input.text ?? ""].join(" ")
  );

  if (SECURITY_MARKERS.some((marker) => combined.includes(marker))) {
    return "security";
  }

  if (HR_MARKERS.some((marker) => containsMarker(combined, marker))) {
    return "hr";
  }

  if (ADMIN_MARKERS.some((marker) => combined.includes(marker))) {
    return "admin";
  }

  if (SUPPLIER_MARKERS.some((marker) => combined.includes(marker))) {
    return "supplier";
  }

  if (SPAM_MARKERS.some((marker) => combined.includes(marker))) {
    return "other";
  }

  if (
    input.channel === "gmail" &&
    (AUTOMATED_SYSTEM_SENDERS.some((domain) => normalizedSender.includes(domain)) ||
      normalizedSender.includes("no-reply@") ||
      normalizedSender.includes("noreply@"))
  ) {
    return "other";
  }

  if (LEAD_MARKERS.some((marker) => containsMarker(combined, marker))) {
    return "lead";
  }

  return input.channel === "instagram" ? "lead" : "other";
}

/**
 * Calcula deterministicamente o estado da conversa em função das datas inbound/outbound.
 */
export function computeThreadStatus(input: {
  currentStatus?: InboxThreadStatus | null;
  hasUnreadInbound?: boolean;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  linkedQuoteId?: string | null;
}): InboxThreadStatus {
  if (input.currentStatus === "archived") {
    return "archived";
  }

  if (input.linkedQuoteId || input.currentStatus === "converted") {
    return "converted";
  }

  const inboundMs = input.lastInboundAt ? Date.parse(input.lastInboundAt) : Number.NaN;
  const outboundMs = input.lastOutboundAt ? Date.parse(input.lastOutboundAt) : Number.NaN;

  if (!Number.isNaN(outboundMs) && (Number.isNaN(inboundMs) || outboundMs >= inboundMs)) {
    return "replied";
  }

  if (!Number.isNaN(outboundMs) && !Number.isNaN(inboundMs) && inboundMs > outboundMs) {
    return "needs_reply";
  }

  return input.hasUnreadInbound ? "unread" : "needs_reply";
}

export const GMAIL_REPLY_MAX_CHARS = 5000;
export const INSTAGRAM_DM_MAX_CHARS = 1000;
const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type InboxReplyValidationResult =
  | { ok: true; cleanText: string; recipient: string }
  | { ok: false; error: string; windowClosed?: boolean };

/**
 * Valida deterministicamente o rascunho de resposta antes de qualquer envio externo.
 */
export function validateInboxReplyDraft(input: {
  channel: InboxChannel;
  text: string;
  recipientHandle: string | null | undefined;
  participantExternalId?: string | null;
  lastInboundAt?: string | null;
  now?: Date;
}): InboxReplyValidationResult {
  const cleanText = input.text.replace(/\r\n?/g, "\n").trim();
  if (cleanText.length < 2) {
    return { ok: false, error: "Escreve uma mensagem com pelo menos 2 caracteres." };
  }

  const maxChars = input.channel === "instagram" ? INSTAGRAM_DM_MAX_CHARS : GMAIL_REPLY_MAX_CHARS;
  if (cleanText.length > maxChars) {
    return {
      ok: false,
      error: `A mensagem excede o limite de ${maxChars} caracteres para ${
        input.channel === "instagram" ? "Instagram Direct" : "Gmail"
      }.`,
    };
  }

  if (input.channel === "gmail") {
    const recipient = (input.recipientHandle ?? "").trim().toLowerCase();
    if (!recipient || !BASIC_EMAIL_RE.test(recipient)) {
      return {
        ok: false,
        error: "Este tópico não tem um endereço de e-mail de destinatário válido.",
      };
    }
    return { ok: true, cleanText, recipient };
  }

  const recipientId = (input.participantExternalId ?? "").trim();
  if (!recipientId) {
    return {
      ok: false,
      error: "Falta o identificador PSID deste contacto do Instagram. Sincroniza novamente.",
    };
  }

  const windowStatus = evaluateInstagramReplyWindow(input.lastInboundAt, input.now ?? new Date());
  if (windowStatus.state === "expired" || windowStatus.state === "none") {
    return {
      ok: false,
      error:
        "A janela de resposta de 24 horas do Instagram expirou. Responde pela app Instagram ou contacta o cliente por telefone/e-mail.",
      windowClosed: true,
    };
  }

  return { ok: true, cleanText, recipient: recipientId };
}

