import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import type { DashboardData } from "@/lib/demo-data/dashboard-data";

const WEEKLY_CAPACITY_HOURS = 120; // 3 baias × 8h × 5 dias

export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb();
  const orgId = await getPrimaryOrganizationId();

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
    [orgId]
  );
  const k = kpiRes.rows[0];

  const capacityRes = await db.query<{ booked: string | null }>(
    `SELECT SUM(estimated_hours) AS booked FROM appointments
     WHERE organization_id = $1
       AND start_time >= date_trunc('week', NOW())
       AND start_time < date_trunc('week', NOW()) + interval '7 days'
       AND status <> 'cancelled'`,
    [orgId]
  );
  const bookedHours = Number(capacityRes.rows[0].booked ?? 0);
  const capacityPct = Math.round((bookedHours / WEEKLY_CAPACITY_HOURS) * 100);

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
    [orgId]
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
       AND a.start_time >= date_trunc('day', NOW())
       AND a.start_time < date_trunc('day', NOW()) + interval '1 day'
     ORDER BY a.start_time`,
    [orgId]
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
    [orgId]
  );

  const revenueRes = await db.query<{ month: Date; total: string }>(
    `SELECT date_trunc('month', issued_at) AS month, SUM(total_amount) AS total
     FROM invoices WHERE organization_id = $1 AND payment_status <> 'cancelled'
     GROUP BY 1 ORDER BY 1 DESC LIMIT 6`,
    [orgId]
  );
  const revenueSeries = revenueRes.rows.reverse().map((r) => Number(r.total));
  const revenue = revenueSeries.at(-1) ?? 0;
  const prevRevenue = revenueSeries.at(-2) ?? 0;
  const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

  const marginRes = await db.query<{ total: string; cost: string }>(
    `SELECT COALESCE(SUM(o.total_with_vat),0) AS total, COALESCE(SUM(o.estimated_cost),0) AS cost
     FROM quote_options o JOIN quotes q ON q.id = o.quote_id
     WHERE q.organization_id = $1 AND o.is_recommended AND q.created_at >= date_trunc('month', NOW())`,
    [orgId]
  );
  const marginValue = Number(marginRes.rows[0].total) - Number(marginRes.rows[0].cost);
  const marginRate = Number(marginRes.rows[0].total) > 0
    ? Math.round((marginValue / Number(marginRes.rows[0].total)) * 1000) / 10
    : 0;

  const qcRes = await db.query<{ passed: number; total: number }>(
    `SELECT count(*) FILTER (WHERE status = 'passed')::int AS passed, count(*)::int AS total
     FROM qc_inspections WHERE work_order_id IN (SELECT id FROM work_orders WHERE organization_id = $1)`,
    [orgId]
  );
  const qcScore = qcRes.rows[0].total > 0 ? qcRes.rows[0].passed / qcRes.rows[0].total : 0;

  const occupancyRes = await db.query<{ week: Date; booked: string }>(
    `SELECT date_trunc('week', start_time) AS week, SUM(estimated_hours) AS booked
     FROM appointments WHERE organization_id = $1
       AND start_time >= NOW() - interval '8 weeks'
     GROUP BY 1 ORDER BY 1`,
    [orgId]
  );
  const occupancyBars = occupancyRes.rows.map((r) =>
    Math.round((Number(r.booked) / WEEKLY_CAPACITY_HOURS) * 100)
  );

  const statusMap: Record<string, "Em Curso" | "A Guardar Peças" | "Concluído"> = {
    in_progress: "Em Curso",
    waiting_parts: "A Guardar Peças",
    quality_control: "Concluído",
  };
  const agendaService: Record<string, string> = {
    ppf: "PPF",
    wrap: "Wrap",
    detailing: "Detailing",
    tint: "Tint",
    general: "Geral",
  };

  return {
    user: {
      name: "Luís Gonçalves",
      greeting: "Olá, Luís",
      role: "Gestor",
      initials: "LG",
      unreadNotifications: alertsRes.rows.length,
    },
    kpis: {
      todayVehicles: {
        count: k.today_vehicles,
        label: "Viaturas",
        linkText: "Ver detalhes",
        href: "/production",
      },
      pendingQuotes: { count: k.pending_quotes, label: "Total", linkText: "Ver orçamentos", href: "/quotes" },
      weeklyCapacity: {
        percentage: capacityPct,
        detail: `${bookedHours} de ${WEEKLY_CAPACITY_HOURS} horas`,
        linkText: "Ver calendário",
        href: "/calendar",
      },
      criticalStock: { count: k.critical_stock, label: "Itens", linkText: "Ver stock", href: "/stock" },
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
      startTime: new Date(r.started_at).toTimeString().slice(0, 5),
      progress: r.progress_percentage,
    })),
    todayAgenda: agendaRes.rows.map((r) => ({
      id: r.id,
      time: new Date(r.start_time).toTimeString().slice(0, 5),
      vehicle: `${r.make} ${r.model}`,
      service: agendaService[r.service_type] ?? "Geral",
      technician: r.technician ?? "",
      status:
        r.status === "completed" ? "completed" : r.status === "in_progress" ? "in_progress" : "scheduled",
    })),
    intelligenceAlerts: alertsRes.rows,
    metrics: {
      monthlyRevenue: {
        value: revenue,
        changePercentage: revenueChange,
        comparisonText: "vs mês anterior",
        sparkline: revenueSeries.length > 1 ? revenueSeries : [revenue, revenue],
      },
      estimatedMargin: {
        value: marginValue,
        changePercentage: 0,
        marginRate,
        sparkline: [marginValue * 0.7, marginValue * 0.8, marginValue * 0.9, marginValue],
      },
      occupancyRate: {
        percentage: capacityPct,
        changePercentage: 0,
        hoursDetail: `${bookedHours} de ${WEEKLY_CAPACITY_HOURS} horas`,
        barChart: occupancyBars.length > 1 ? occupancyBars : [capacityPct, capacityPct],
      },
      customerSatisfaction: {
        score: Math.round(qcScore * 10) / 10,
        maxScore: 5,
        changeScore: 0,
        reviewsCount: qcRes.rows[0].total,
        stars: Math.round(qcScore * 5),
      },
    },
  };
}
