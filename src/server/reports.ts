import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";

export interface ServiceStat {
  service: string;
  jobsCount: number;
  revenue: number;
  directCost: number;
  marginPercent: number;
  avgLaborHours: number;
}

export interface ReportsData {
  serviceStats: ServiceStat[];
  quarterlyRevenue: number;
  avgMargin: number;
  laborEfficiency: number;
  scrapRate: number;
}

export async function getReportsData(): Promise<ReportsData> {
  const db = getDb();
  const organizationId = await getPrimaryOrganizationId();

  const { rows: statRows } = await db.query<Record<string, unknown>>(
    `SELECT o.name AS service,
            count(*)::int AS jobs,
            SUM(o.total_with_vat) AS revenue,
            SUM(o.estimated_cost) AS cost,
            AVG(o.estimated_margin_percentage) AS margin_pct,
            AVG(o.estimated_hours) AS avg_hours
     FROM quote_options o
     JOIN quotes q ON q.id = o.quote_id
     WHERE q.organization_id = $1 AND q.status = 'approved'
     GROUP BY o.name
     ORDER BY revenue DESC
     LIMIT 8`,
    [organizationId]
  );

  const serviceStats: ServiceStat[] = statRows.map((r) => ({
    service: String(r.service),
    jobsCount: Number(r.jobs),
    revenue: Number(r.revenue),
    directCost: Number(r.cost),
    marginPercent: Number(r.margin_pct),
    avgLaborHours: Number(r.avg_hours),
  }));

  const { rows: kpiRows } = await db.query<Record<string, unknown>>(
    `SELECT
      (SELECT COALESCE(SUM(total_amount),0) FROM invoices
        WHERE organization_id = $1 AND issued_at >= date_trunc('quarter', NOW())) AS quarter_revenue,
      (SELECT CASE WHEN SUM(o.total_with_vat) > 0
              THEN AVG(o.estimated_margin_percentage) ELSE 0 END
        FROM quote_options o JOIN quotes q ON q.id = o.quote_id
        WHERE q.organization_id = $1 AND q.status = 'approved') AS avg_margin,
      (SELECT CASE WHEN SUM(estimated_hours) > 0
              THEN ROUND((SUM(actual_hours_spent) / SUM(estimated_hours)) * 100) ELSE 0 END
        FROM work_orders WHERE organization_id = $1 AND status = 'completed') AS labor_eff,
      (SELECT COALESCE(AVG(scrap_percentage), 0)
        FROM work_order_material_usages WHERE work_order_id IN
          (SELECT id FROM work_orders WHERE organization_id = $1)) AS scrap
     FROM organizations WHERE id = $1`,
    [organizationId]
  );

  return {
    serviceStats,
    quarterlyRevenue: Number(kpiRows[0]?.quarter_revenue ?? 0),
    avgMargin: Number(kpiRows[0]?.avg_margin ?? 0),
    laborEfficiency: Number(kpiRows[0]?.labor_eff ?? 0),
    scrapRate: Number(kpiRows[0]?.scrap ?? 0),
  };
}
