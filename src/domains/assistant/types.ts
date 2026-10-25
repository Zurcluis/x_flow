export type AssistantSourceId =
  | "agenda"
  | "production"
  | "quotes"
  | "stock"
  | "my_day";

export type SourceStatus =
  | "available"
  | "empty"
  | "unavailable"
  | "not_applicable";

export interface AssistantSource {
  id: AssistantSourceId;
  label: string;
  status: SourceStatus;
  consultedAt: string | null;
  message?: string;
}

export type AssistantItemKind =
  | "appointment"
  | "work_order"
  | "quote"
  | "stock"
  | "task";

export type AssistantSeverity = "danger" | "warning" | "info";

export interface AssistantItem {
  id: string;
  kind: AssistantItemKind;
  title: string;
  detail: string | null;
  time: string | null;
  href: string;
  severity: AssistantSeverity;
}

export interface AssistantBriefing {
  generatedAt: string;
  operationalDate: string;
  timezone: string;
  greeting: string;
  firstName: string;
  sources: AssistantSource[];
  priorities: AssistantItem[];
  agenda: AssistantItem[];
  activeWorks: AssistantItem[];
  blocked: AssistantItem[];
  quality: AssistantItem[];
  deliveries: AssistantItem[];
  quotes: AssistantItem[];
  stock: AssistantItem[];
  narration: string;
  hasAnyData: boolean;
}

export interface AssistantReference {
  label: string;
  href: string;
}

export interface AssistantAnswer {
  text: string;
  references: AssistantReference[];
}

export const ASSISTANT_SOURCE_LABELS: Record<AssistantSourceId, string> = {
  agenda: "Agenda",
  production: "Produção",
  quotes: "Orçamentos",
  stock: "Stock",
  my_day: "O Meu Dia",
};
