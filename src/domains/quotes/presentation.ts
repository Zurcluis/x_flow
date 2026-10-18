import { WORKSHOP_TIME_ZONE } from "@/domains/calendar/datetime";
import type { QuoteStatus } from "./types";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: WORKSHOP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: WORKSHOP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatQuoteDateTime(value?: string | null): string {
  if (!value) return "Data indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return DATE_TIME_FORMATTER.format(date);
}

export function formatQuoteDate(value?: string | null): string {
  if (!value) return "Data indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return DATE_FORMATTER.format(date);
}

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "approved":
      return "Aprovado";
    case "sent":
      return "Enviado";
    case "viewed":
      return "Visualizado";
    case "draft":
      return "Rascunho";
    case "rejected":
      return "Recusado";
    case "expired":
      return "Expirado";
    default:
      return "Estado desconhecido";
  }
}

export type QuoteStatusBadgeVariant =
  | "default"
  | "in_progress"
  | "waiting_parts"
  | "success"
  | "danger"
  | "gold"
  | "outline";

export function quoteStatusBadgeVariant(
  status: QuoteStatus
): QuoteStatusBadgeVariant {
  switch (status) {
    case "approved":
      return "success";
    case "sent":
      return "in_progress";
    case "viewed":
      return "gold";
    case "rejected":
      return "danger";
    case "expired":
      return "outline";
    case "draft":
    default:
      return "outline";
  }
}
