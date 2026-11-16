import type { BadgeProps } from "@/components/ui/badge";
import type { InboxCategory, InboxChannel, InboxThreadStatus } from "@/domains/inbox/types";

export const CATEGORY_LABELS: Record<InboxCategory, string> = {
  lead: "Lead / Orçamento",
  supplier: "Fornecedor",
  admin: "Administrativo",
  hr: "Candidatura",
  security: "Segurança",
  other: "Outros",
};

export const STATUS_LABELS: Record<InboxThreadStatus, string> = {
  unread: "Não lido",
  needs_reply: "Por responder",
  replied: "Respondido",
  converted: "Convertido",
  archived: "Arquivado",
};

export const STATUS_BADGE_VARIANT: Record<InboxThreadStatus, NonNullable<BadgeProps["variant"]>> = {
  unread: "gold",
  needs_reply: "in_progress",
  replied: "success",
  converted: "waiting_parts",
  archived: "default",
};

export const CHANNEL_LABELS: Record<InboxChannel, string> = {
  gmail: "Gmail",
  instagram: "Instagram",
};

const LISBON_DT_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const LISBON_FULL_DT_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLisbonShort(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return LISBON_DT_FORMATTER.format(date);
}

export function formatLisbonFull(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return LISBON_FULL_DT_FORMATTER.format(date);
}
