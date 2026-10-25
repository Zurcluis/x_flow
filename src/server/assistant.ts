import { getDb } from "@/lib/db";
import { canUseAssistant, type OrganizationRole } from "@/lib/roles";
import {
  addCivilDays,
  civilDateFromKey,
  civilDateKey,
  todayWorkshopDateKey,
  WORKSHOP_TIME_ZONE,
  workshopDateTimeParts,
  workshopIsoFromWallTime,
  workshopTime,
} from "@/domains/calendar/datetime";
import { buildNarration, greetingForHour } from "@/domains/assistant/narration";
import { buildPriorities } from "@/domains/assistant/priorities";
import { answerQuestion } from "@/domains/assistant/intents";
import {
  ASSISTANT_SOURCE_LABELS,
  type AssistantAnswer,
  type AssistantBriefing,
  type AssistantItem,
  type AssistantSource,
  type AssistantSourceId,
} from "@/domains/assistant/types";

export interface AssistantViewer {
  organizationId: string;
  profileId: string;
  name: string;
  role: OrganizationRole;
}

const QUANTITY_FORMAT = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

function formatQuantity(value: number): string {
  return QUANTITY_FORMAT.format(value);
}

function unitLabel(unit: string | null | undefined): string {
  if (unit === "bottle") return "un";
  if (unit === "kit") return "kit";
  return "m";
}

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Provisória",
  confirmed: "Confirmada",
  in_progress: "Em curso",
  completed: "Concluída",
  no_show: "Não compareceu",
};

const SERVICE_LABELS: Record<string, string> = {
  ppf: "PPF",
  wrap: "Wrap",
  detailing: "Detailing",
  tint: "Tint",
  general: "Geral",
};

const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  in_progress: "Em curso",
  waiting_parts: "À espera de peças",
  quality_control: "Controlo de qualidade",
  completed: "Concluído",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  viewed: "Visto pelo cliente",
};

interface AgendaRow {
  id: string;
  start_time: Date;
  status: string;
  make: string;
  model: string;
  plate_display: string;
  customer_name: string;
  bay_name: string;
  service_type: string;
  technician_name: string | null;
}

interface WorkOrderRow {
  id: string;
  work_order_number: string;
  service_title: string;
  status: string;
  progress_percentage: number;
  estimated_hours: string;
  actual_hours_spent: string;
  make: string;
  model: string;
  plate_display: string;
  technician_name: string | null;
}

type DeliveryRow = WorkOrderRow;

interface QuoteRow {
  id: string;
  quote_number: string;
  status: string;
  updated_at: Date;
  customer_name: string;
  days_waiting: number;
}

interface StockRow {
  id: string;
  brand: string | null;
  name: string;
  unit: string | null;
  current_stock_meters: string;
  minimum_stock_alert_meters: string;
}

interface LoadedSource {
  source: AssistantSource;
  items: AssistantItem[];
}

interface LoadedProduction {
  source: AssistantSource;
  active: AssistantItem[];
  blocked: AssistantItem[];
  quality: AssistantItem[];
  delayed: AssistantItem[];
  deliveries: AssistantItem[];
}

function source(
  id: AssistantSourceId,
  status: AssistantSource["status"],
  consultedAt: string,
  message?: string
): AssistantSource {
  return {
    id,
    label: ASSISTANT_SOURCE_LABELS[id],
    status,
    consultedAt: status === "unavailable" ? null : consultedAt,
    ...(message ? { message } : {}),
  };
}

function statusFrom(items: AssistantItem[]): AssistantSource["status"] {
  return items.length > 0 ? "available" : "empty";
}

function logSourceFailure(id: AssistantSourceId, error: unknown): void {
  const message = error instanceof Error ? error.message : "erro desconhecido";
  console.error(`[assistant] fonte ${id} indisponível: ${message}`);
}

function workOrderItem(
  row: WorkOrderRow,
  detailSuffix: string,
  severity: AssistantItem["severity"]
): AssistantItem {
  const progress = Number(row.progress_percentage);
  const detailParts = [
    row.service_title,
    WORK_ORDER_STATUS_LABELS[row.status] ?? row.status,
    row.technician_name,
    Number.isFinite(progress) ? `${Math.round(progress)}%` : null,
    detailSuffix || null,
  ].filter((part): part is string => Boolean(part));

  return {
    id: row.id,
    kind: "work_order",
    title: `${row.work_order_number} · ${row.make} ${row.model}`,
    detail: detailParts.join(" · "),
    time: null,
    href: `/production/${row.id}`,
    severity,
  };
}

async function loadAgenda(
  viewer: AssistantViewer,
  startIso: string,
  endIso: string,
  consultedAt: string
): Promise<LoadedSource> {
  try {
    const technicianFilter = viewer.role === "technician" ? " AND a.technician_id = $4" : "";
    const params: unknown[] = [viewer.organizationId, startIso, endIso];
    if (viewer.role === "technician") params.push(viewer.profileId);

    const { rows } = await getDb().query<AgendaRow>(
      `SELECT a.id, a.start_time, a.status,
              v.make, v.model, v.plate_display,
              c.name AS customer_name,
              b.name AS bay_name, b.service_type,
              p.name AS technician_name
       FROM appointments a
       JOIN vehicles v ON v.id = a.vehicle_id AND v.organization_id = a.organization_id
       JOIN customers c ON c.id = a.customer_id AND c.organization_id = a.organization_id
       JOIN bays b ON b.id = a.bay_id AND b.organization_id = a.organization_id
       LEFT JOIN profiles p ON p.id = a.technician_id
       WHERE a.organization_id = $1
         AND a.start_time >= $2
         AND a.start_time < $3
         AND a.status <> 'cancelled'
         ${technicianFilter}
       ORDER BY a.start_time
       LIMIT 50`,
      params
    );

    const items: AssistantItem[] = rows.map((row) => {
      const statusLabel = APPOINTMENT_STATUS_LABELS[row.status] ?? row.status;
      const service = SERVICE_LABELS[row.service_type] ?? row.service_type;
      const detailParts = [
        row.customer_name,
        service,
        row.bay_name,
        row.technician_name,
        statusLabel,
      ].filter((part): part is string => Boolean(part));

      return {
        id: row.id,
        kind: "appointment",
        title: `${row.make} ${row.model} · ${row.plate_display}`,
        detail: detailParts.join(" · "),
        time: workshopTime(new Date(row.start_time)),
        href: "/calendar",
        severity:
          row.status === "no_show"
            ? "danger"
            : row.status === "scheduled"
              ? "warning"
              : "info",
      };
    });

    return { source: source("agenda", statusFrom(items), consultedAt), items };
  } catch (error) {
    logSourceFailure("agenda", error);
    return {
      source: source(
        "agenda",
        "unavailable",
        consultedAt,
        "Não foi possível consultar a agenda."
      ),
      items: [],
    };
  }
}

async function loadProduction(
  viewer: AssistantViewer,
  consultedAt: string
): Promise<LoadedProduction> {
  const empty = (status: AssistantSource["status"]): LoadedProduction => ({
    source: source("production", status, consultedAt),
    active: [],
    blocked: [],
    quality: [],
    delayed: [],
    deliveries: [],
  });

  try {
    const technicianFilter =
      viewer.role === "technician" ? " AND w.primary_technician_id = $2" : "";
    const params: unknown[] = [viewer.organizationId];
    if (viewer.role === "technician") params.push(viewer.profileId);

    const [activeResult, deliveryResult] = await Promise.all([
      getDb().query<WorkOrderRow>(
        `SELECT w.id, w.work_order_number, w.service_title, w.status,
                w.progress_percentage, w.estimated_hours, w.actual_hours_spent,
                v.make, v.model, v.plate_display,
                p.name AS technician_name
         FROM work_orders w
         JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
         LEFT JOIN profiles p ON p.id = w.primary_technician_id
         WHERE w.organization_id = $1
           AND w.status IN ('in_progress','waiting_parts','quality_control')
           ${technicianFilter}
         ORDER BY CASE w.status
                    WHEN 'waiting_parts' THEN 0
                    WHEN 'quality_control' THEN 1
                    ELSE 2
                  END,
                  w.started_at NULLS LAST
         LIMIT 100`,
        params
      ),
      getDb().query<DeliveryRow>(
        `SELECT w.id, w.work_order_number, w.service_title, w.status,
                w.progress_percentage, w.estimated_hours, w.actual_hours_spent,
                v.make, v.model, v.plate_display,
                p.name AS technician_name
         FROM work_orders w
         JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
         LEFT JOIN profiles p ON p.id = w.primary_technician_id
         WHERE w.organization_id = $1
           AND w.status = 'completed'
           AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.work_order_id = w.id)
           ${technicianFilter}
         ORDER BY w.completed_at DESC NULLS LAST
         LIMIT 20`,
        params
      ),
    ]);

    const active: AssistantItem[] = [];
    const blocked: AssistantItem[] = [];
    const quality: AssistantItem[] = [];
    const delayed: AssistantItem[] = [];

    for (const row of activeResult.rows) {
      const item = workOrderItem(row, "", "info");

      if (row.status === "waiting_parts") {
        blocked.push({ ...item, severity: "danger" });
        continue;
      }
      if (row.status === "quality_control") {
        quality.push({ ...item, severity: "warning" });
        continue;
      }

      const estimated = Number(row.estimated_hours);
      const actual = Number(row.actual_hours_spent);
      if (estimated > 0 && actual > estimated) {
        delayed.push({ ...item, severity: "warning" });
      }
      active.push(item);
    }

    const deliveries: AssistantItem[] = deliveryResult.rows.map((row) => ({
      ...workOrderItem(row, "Pronta para entrega", "warning"),
      id: row.id,
      href: `/production/${row.id}`,
    }));

    const total =
      active.length + blocked.length + quality.length + deliveries.length;
    return {
      source: source(
        "production",
        total > 0 ? "available" : "empty",
        consultedAt
      ),
      active,
      blocked,
      quality,
      delayed,
      deliveries,
    };
  } catch (error) {
    logSourceFailure("production", error);
    const failed = empty("unavailable");
    failed.source.message = "Não foi possível consultar a produção.";
    return failed;
  }
}

async function loadQuotes(
  viewer: AssistantViewer,
  consultedAt: string
): Promise<LoadedSource> {
  try {
    const { rows } = await getDb().query<QuoteRow>(
      `SELECT q.id, q.quote_number, q.status, q.updated_at,
              c.name AS customer_name,
              GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - q.updated_at)) / 86400))::int AS days_waiting
       FROM quotes q
       JOIN customers c ON c.id = q.customer_id AND c.organization_id = q.organization_id
       WHERE q.organization_id = $1
         AND q.status IN ('sent','viewed')
         AND q.updated_at < NOW() - interval '4 days'
       ORDER BY q.updated_at ASC
       LIMIT 20`,
      [viewer.organizationId]
    );

    const items: AssistantItem[] = rows.map((row) => {
      const days = Number(row.days_waiting);
      const statusLabel = QUOTE_STATUS_LABELS[row.status] ?? row.status;
      return {
        id: row.id,
        kind: "quote",
        title: `${row.quote_number} · ${row.customer_name}`,
        detail: `${statusLabel} · sem resposta há ${days} ${
          days === 1 ? "dia" : "dias"
        }`,
        time: null,
        href: `/quotes/${row.id}`,
        severity: "warning",
      };
    });

    return { source: source("quotes", statusFrom(items), consultedAt), items };
  } catch (error) {
    logSourceFailure("quotes", error);
    return {
      source: source(
        "quotes",
        "unavailable",
        consultedAt,
        "Não foi possível consultar os orçamentos."
      ),
      items: [],
    };
  }
}

async function loadStock(
  viewer: AssistantViewer,
  consultedAt: string
): Promise<LoadedSource> {
  try {
    const { rows } = await getDb().query<StockRow>(
      `SELECT id, brand, name, unit,
              current_stock_meters, minimum_stock_alert_meters
       FROM materials
       WHERE organization_id = $1
         AND current_stock_meters < minimum_stock_alert_meters
       ORDER BY (minimum_stock_alert_meters - current_stock_meters) DESC
       LIMIT 20`,
      [viewer.organizationId]
    );

    const items: AssistantItem[] = rows.map((row) => {
      const current = Number(row.current_stock_meters);
      const minimum = Number(row.minimum_stock_alert_meters);
      const unit = unitLabel(row.unit);
      const name = row.brand ? `${row.brand} ${row.name}` : row.name;
      return {
        id: row.id,
        kind: "stock",
        title: name,
        detail: `${formatQuantity(current)} ${unit} em stock · mínimo ${formatQuantity(minimum)} ${unit}`,
        time: null,
        href: "/stock",
        severity: current <= 0 ? "danger" : "warning",
      };
    });

    return { source: source("stock", statusFrom(items), consultedAt), items };
  } catch (error) {
    logSourceFailure("stock", error);
    return {
      source: source(
        "stock",
        "unavailable",
        consultedAt,
        "Não foi possível consultar o stock."
      ),
      items: [],
    };
  }
}

function unavailableLabels(sources: AssistantSource[]): string[] {
  const articles: Partial<Record<AssistantSourceId, string>> = {
    agenda: "a agenda",
    production: "a produção",
    quotes: "os orçamentos",
    stock: "o stock",
  };
  return sources
    .filter((item) => item.status === "unavailable")
    .map((item) => articles[item.id])
    .filter((item): item is string => Boolean(item));
}

export function assistantAccessError(viewer: AssistantViewer): string | null {
  if (!canUseAssistant(viewer.role)) {
    return "O assistente está disponível para administradores, gestores e técnicos.";
  }
  return null;
}

export async function getAssistantBriefing(
  viewer: AssistantViewer,
  now = new Date()
): Promise<AssistantBriefing> {
  const accessError = assistantAccessError(viewer);
  if (accessError) throw new Error(accessError);

  const todayKey = todayWorkshopDateKey(now);
  const tomorrowKey = civilDateKey(addCivilDays(civilDateFromKey(todayKey), 1));
  const startIso = workshopIsoFromWallTime(todayKey, "00:00");
  const endIso = workshopIsoFromWallTime(tomorrowKey, "00:00");

  if (!startIso || !endIso) {
    throw new Error("Não foi possível calcular o dia operacional.");
  }

  const consultedAt = now.toISOString();
  const [agenda, production, quotes, stock] = await Promise.all([
    loadAgenda(viewer, startIso, endIso, consultedAt),
    loadProduction(viewer, consultedAt),
    loadQuotes(viewer, consultedAt),
    loadStock(viewer, consultedAt),
  ]);

  const priorities = buildPriorities({
    blocked: production.blocked,
    quality: production.quality,
    delayed: production.delayed,
    deliveries: production.deliveries,
    agenda: agenda.items,
    quotes: quotes.items,
    stock: stock.items,
    limit: 3,
  });

  const firstName = viewer.name.trim().split(/\s+/)[0] || viewer.name;
  const greeting = greetingForHour(workshopDateTimeParts(now).hour);
  const sources = [agenda.source, production.source, quotes.source, stock.source];

  const narration = buildNarration({
    firstName,
    greeting,
    agenda: agenda.items,
    agendaStatus: agenda.source.status,
    activeWorks: production.active,
    blocked: production.blocked,
    quality: production.quality,
    delayed: production.delayed,
    deliveries: production.deliveries,
    quotes: quotes.items,
    stock: stock.items,
    priorities,
    unavailableLabels: unavailableLabels(sources),
  });

  const hasAnyData =
    agenda.items.length > 0 ||
    production.active.length > 0 ||
    production.blocked.length > 0 ||
    production.quality.length > 0 ||
    production.deliveries.length > 0 ||
    quotes.items.length > 0 ||
    stock.items.length > 0;

  return {
    generatedAt: now.toISOString(),
    operationalDate: todayKey,
    timezone: WORKSHOP_TIME_ZONE,
    greeting,
    firstName,
    sources,
    priorities,
    agenda: agenda.items,
    activeWorks: production.active,
    blocked: production.blocked,
    quality: production.quality,
    deliveries: production.deliveries,
    quotes: quotes.items,
    stock: stock.items,
    narration,
    hasAnyData,
  };
}

export async function askAssistant(
  viewer: AssistantViewer,
  question: string
): Promise<AssistantAnswer> {
  const accessError = assistantAccessError(viewer);
  if (accessError) throw new Error(accessError);

  const trimmed = question.trim();
  if (!trimmed) {
    return {
      text: "Escreve ou dita uma pergunta sobre a agenda, a produção, os orçamentos ou o stock.",
      references: [],
    };
  }
  if (trimmed.length > 500) {
    return {
      text: "A pergunta é demasiado longa. Resume-a a uma frase.",
      references: [],
    };
  }

  const briefing = await getAssistantBriefing(viewer);
  return answerQuestion(trimmed, briefing);
}
