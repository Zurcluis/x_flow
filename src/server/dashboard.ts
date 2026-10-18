import { getDb } from "@/lib/db";
import { canSeeFinancials, type OrganizationRole } from "@/lib/roles";
import type { DashboardData } from "@/lib/demo-data/dashboard-data";

const WORKDAY_HOURS = 8;
const WORKDAYS_PER_WEEK = 5;

const ROLE_LABELS: Record<OrganizationRole, string> = {
  admin: "Administrador",
  workshop_manager: "Gestor",
  technician: "Técnico",
  customer: "Cliente",
  b2b_user: "B2B",
};

export function formatLisbonTime(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatLisbonDateTime(
  value: Date | string | null | undefined
): string {
  if (value === null || value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function getDashboardData(
  organizationId: string,
  viewer: { name: string; role: OrganizationRole }
): Promise<DashboardData> {
  const db = getDb();
  const showFinancials = canSeeFinancials(viewer.role);

  const kpiRes = await db.query<{
    today_vehicles: number;
    pending_quotes: number;
    critical_stock: number;
    ready_for_delivery: number;
  }>(
    `SELECT
      (SELECT count(*)::int FROM work_orders
        WHERE organization_id = $1 AND status IN ('in_progress','waiting_parts','quality_control')) AS today_vehicles,
      (SELECT count(*)::int FROM quotes
        WHERE organization_id = $1 AND status IN ('sent','viewed')) AS pending_quotes,
      (SELECT count(*)::int FROM materials
        WHERE organization_id = $1 AND current_stock_meters < minimum_stock_alert_meters) AS critical_stock,
      (SELECT count(*)::int FROM work_orders w
        WHERE w.organization_id = $1 AND w.status = 'completed'
          AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.work_order_id = w.id)) AS ready_for_delivery`,
    [organizationId]
  );
  const k = kpiRes.rows[0];

  const baysRes = await db.query<{ active_bays: number }>(
    `SELECT count(*) FILTER (WHERE status <> 'maintenance')::int AS active_bays
     FROM bays WHERE organization_id = $1`,
    [organizationId]
  );
  const activeBays = Number(baysRes.rows[0]?.active_bays ?? 0);
  const weeklyCapacityHours = activeBays * WORKDAY_HOURS * WORKDAYS_PER_WEEK;

  const capacityRes = await db.query<{ booked: string | null }>(
    `SELECT SUM(estimated_hours) AS booked FROM appointments
     WHERE organization_id = $1
       AND start_time >= (date_trunc('week', NOW() AT TIME ZONE 'Europe/Lisbon') AT TIME ZONE 'Europe/Lisbon')
       AND start_time < ((date_trunc('week', NOW() AT TIME ZONE 'Europe/Lisbon') + interval '7 days') AT TIME ZONE 'Europe/Lisbon')
       AND status <> 'cancelled'`,
    [organizationId]
  );
  const bookedHours = Number(capacityRes.rows[0].booked ?? 0);
  const capacityPct =
    weeklyCapacityHours > 0
      ? Math.round((bookedHours / weeklyCapacityHours) * 100)
      : 0;

  const activeWorksRes = await db.query<{
    id: string;
    vehicle: string;
    service_title: string;
    status: string;
    technician: string | null;
    started_at: Date;
    progress_percentage: number;
  }>(
    `SELECT w.id, v.model || ' ' || v.make AS vehicle, w.service_title, w.status,
            p.name AS technician, w.started_at, w.progress_percentage
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     LEFT JOIN profiles p ON p.id = w.primary_technician_id
     WHERE w.organization_id = $1 AND w.status IN ('in_progress','waiting_parts','quality_control')
     ORDER BY w.started_at`,
    [organizationId]
  );

  const agendaRes = await db.query<{
    id: string;
    start_time: Date;
    plate: string;
    make: string;
    model: string;
    service_type: string;
    technician: string | null;
    status: string;
  }>(
    `SELECT a.id, a.start_time, v.plate_display AS plate, v.make, v.model,
            b.service_type, p.name AS technician, a.status
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN bays b ON b.id = a.bay_id
     LEFT JOIN profiles p ON p.id = a.technician_id
     WHERE a.organization_id = $1
       AND a.start_time >= (date_trunc('day', NOW() AT TIME ZONE 'Europe/Lisbon') AT TIME ZONE 'Europe/Lisbon')
       AND a.start_time < ((date_trunc('day', NOW() AT TIME ZONE 'Europe/Lisbon') + interval '1 day') AT TIME ZONE 'Europe/Lisbon')
     ORDER BY a.start_time`,
    [organizationId]
  );

  // X-Flow Intelligence — regras determinísticas sobre estado real
  const alertsRes = await db.query<{
    id: string;
    severity: "danger" | "warning" | "info";
    title: string;
    subtitle: string;
    href: string;
  }>(
    `SELECT * FROM (
      SELECT 'st' AS id, 'danger' AS severity,
        'Material abaixo do stock mínimo' AS title,
        count(*)::text || ' materiais precisam de reposição' AS subtitle,
        '/stock'::text AS href
      FROM materials WHERE organization_id = $1 AND current_stock_meters < minimum_stock_alert_meters
      HAVING count(*) > 0
      UNION ALL
      SELECT 'q', 'warning', 'Orçamentos sem resposta há mais de 4 dias',
        count(*)::text || ' orçamento(s) · ' || ROUND(SUM(o.total_with_vat))::text || ' € em jogo', '/quotes'
      FROM quotes q
      JOIN quote_options o ON o.quote_id = q.id AND o.is_recommended
      WHERE q.organization_id = $1 AND q.status IN ('sent','viewed')
        AND q.updated_at < NOW() - interval '4 days'
      HAVING count(*) > 0
      UNION ALL
      SELECT 'wo', 'danger', 'Trabalho a aguardar peças',
        w.work_order_number || ' — ' || v.make || ' ' || v.model, '/production'
      FROM work_orders w JOIN vehicles v ON v.id = w.vehicle_id
      WHERE w.organization_id = $1 AND w.status = 'waiting_parts'
      UNION ALL
      SELECT 'qc', 'info', 'Trabalho em correção de qualidade',
        w.work_order_number || ' — ' || v.make || ' ' || v.model, '/production'
      FROM work_orders w JOIN vehicles v ON v.id = w.vehicle_id
      WHERE w.organization_id = $1 AND w.status = 'quality_control'
      UNION ALL
      SELECT 'delay', 'warning', 'Trabalhos acima das horas previstas',
        count(*)::text || ' trabalho(s) com derrapagem de tempo', '/production'
      FROM work_orders
      WHERE organization_id = $1 AND status = 'in_progress' AND actual_hours_spent > estimated_hours * 0.5
      HAVING count(*) > 0
    ) alerts LIMIT 5`,
    [organizationId]
  );

  let revenueSeries: number[] = [];
  let revenue = 0;
  let revenueChange = 0;
  let marginSeries: number[] = [];
  let marginValue = 0;
  let marginRate = 0;
  let marginChange = 0;

  if (showFinancials) {
    const revenueRes = await db.query<{ month: Date; total: string }>(
      `SELECT date_trunc('month', issued_at) AS month, SUM(total_amount) AS total
       FROM invoices WHERE organization_id = $1 AND payment_status <> 'cancelled'
       GROUP BY 1 ORDER BY 1 DESC LIMIT 6`,
      [organizationId]
    );
    revenueSeries = revenueRes.rows.reverse().map((r) => Number(r.total));
    revenue = revenueSeries.at(-1) ?? 0;
    const prevRevenue = revenueSeries.at(-2) ?? 0;
    revenueChange =
      prevRevenue > 0
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
        : 0;

    const marginRes = await db.query<{
      month: Date;
      total: string;
      cost: string;
    }>(
      `SELECT date_trunc('month', q.created_at) AS month,
              COALESCE(SUM(o.total_with_vat), 0) AS total,
              COALESCE(SUM(o.estimated_cost), 0) AS cost
       FROM quote_options o
       JOIN quotes q ON q.id = o.quote_id
       WHERE q.organization_id = $1
         AND o.is_recommended
         AND q.created_at >= date_trunc('month', NOW()) - interval '5 months'
       GROUP BY 1 ORDER BY 1 DESC`,
      [organizationId]
    );
    const marginRows = marginRes.rows.reverse();
    marginSeries = marginRows.map(
      (r) => Number(r.total) - Number(r.cost)
    );
    const currentMargin = marginRows.at(-1);
    marginValue = marginSeries.at(-1) ?? 0;
    const currentTotal = Number(currentMargin?.total ?? 0);
    marginRate =
      currentTotal > 0
        ? Math.round((marginValue / currentTotal) * 1000) / 10
        : 0;
    const prevMargin = marginSeries.at(-2) ?? 0;
    marginChange =
      prevMargin !== 0
        ? Math.round(((marginValue - prevMargin) / Math.abs(prevMargin)) * 100)
        : 0;
  }

  const qcRes = await db.query<{ passed: number; total: number }>(
    `SELECT count(*) FILTER (WHERE q.status = 'passed')::int AS passed,
            count(*)::int AS total
     FROM qc_inspections q
     JOIN work_orders w ON w.id = q.work_order_id
     WHERE w.organization_id = $1`,
    [organizationId]
  );
  const qcTotal = qcRes.rows[0].total;
  const qcScore = qcTotal > 0 ? qcRes.rows[0].passed / qcTotal : 0;

  const occupancyRes = await db.query<{ week: Date; booked: string }>(
    `SELECT date_trunc('week', start_time AT TIME ZONE 'Europe/Lisbon') AS week,
            SUM(estimated_hours) AS booked
     FROM appointments WHERE organization_id = $1
       AND start_time >= NOW() - interval '8 weeks'
     GROUP BY 1 ORDER BY 1`,
    [organizationId]
  );
  const occupancyBars = occupancyRes.rows.map((r) =>
    weeklyCapacityHours > 0
      ? Math.round((Number(r.booked) / weeklyCapacityHours) * 100)
      : 0
  );

  const statusMap: Record<string, "Em Curso" | "A Guardar Peças" | "Concluído"> = {
    in_progress: "Em Curso",
    waiting_parts: "A Guardar Peças",
    quality_control: "Em Curso",
  };
  const agendaService: Record<string, string> = {
    ppf: "PPF",
    wrap: "Wrap",
    detailing: "Detailing",
    tint: "Tint",
    general: "Geral",
  };

  const nameParts = viewer.name.trim().split(/\s+/).filter(Boolean);
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const firstName = nameParts[0] ?? viewer.name;
  const capacityDetail =
    weeklyCapacityHours > 0
      ? `${bookedHours} de ${weeklyCapacityHours} horas`
      : "Sem capacidade configurada";

  return {
    user: {
      name: viewer.name,
      greeting: `Olá, ${firstName}`,
      role: ROLE_LABELS[viewer.role],
      initials: initials || "?",
      unreadNotifications: alertsRes.rows.length,
    },
    kpis: {
      todayVehicles: {
        count: k.today_vehicles,
        label: "Viaturas",
        linkText: "Ver detalhes",
        href: "/production",
      },
      pendingQuotes: {
        count: k.pending_quotes,
        label: "Total",
        linkText: "Ver orçamentos",
        href: "/quotes",
      },
      weeklyCapacity: {
        percentage: capacityPct,
        detail: capacityDetail,
        linkText: "Ver calendário",
        href: "/calendar",
      },
      criticalStock: {
        count: k.critical_stock,
        label: "Itens",
        linkText: "Ver stock",
        href: "/stock",
      },
      todayDeliveries: {
        count: k.ready_for_delivery,
        label: "Prontas",
        linkText: "Ver entregas",
        href: "/deliveries",
      },
    },
    activeWorks: activeWorksRes.rows.map((r) => ({
      id: r.id,
      vehicle: r.vehicle,
      service: r.service_title,
      status: statusMap[r.status] ?? "Em Curso",
      technician: r.technician ?? "Sem técnico",
      startTime: formatLisbonTime(r.started_at),
      progress: r.progress_percentage,
    })),
    todayAgenda: agendaRes.rows.map((r) => ({
      id: r.id,
      time: formatLisbonTime(r.start_time),
      vehicle: `${r.make} ${r.model}`,
      service: agendaService[r.service_type] ?? "Geral",
      technician: r.technician ?? "",
      status:
        r.status === "completed"
          ? "completed"
          : r.status === "in_progress"
            ? "in_progress"
            : "scheduled",
    })),
    intelligenceAlerts: alertsRes.rows,
    metrics: {
      monthlyRevenue: {
        value: revenue,
        changePercentage: revenueChange,
        comparisonText:
          revenueSeries.length > 0 ? "vs mês anterior" : "Sem faturação registada",
        sparkline: revenueSeries,
      },
      estimatedMargin: {
        value: marginValue,
        changePercentage: marginChange,
        marginRate,
        sparkline: marginSeries,
      },
      occupancyRate: {
        percentage: capacityPct,
        changePercentage: 0,
        hoursDetail: capacityDetail,
        barChart: occupancyBars,
      },
      customerSatisfaction: {
        score: Math.round(qcScore * 100),
        maxScore: 100,
        changeScore: 0,
        reviewsCount: qcTotal,
        stars: Math.round(qcScore * 5),
      },
    },
  };
}
