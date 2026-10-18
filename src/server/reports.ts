import { getDb } from "@/lib/db";

export interface ServiceStat {
  service: string;
  jobsCount: number;
  revenue: number;
  directCost: number;
  marginPercent: number;
  avgLaborHours: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface ReportsData {
  serviceStats: ServiceStat[];
  quarterlyRevenue: number;
  previousQuarterRevenue: number;
  quarterChangePercent: number | null;
  avgMargin: number;
  laborEfficiency: number;
  scrapRate: number;
  monthlyRevenue: MonthlyRevenue[];
}

type Row = Record<string, unknown>;

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function getReportsData(organizationId: string): Promise<ReportsData> {
  const db = getDb();

  const { rows: statRows } = await db.query<Row>(
    `SELECT o.name AS service,
            count(DISTINCT q.id)::int AS jobs,
            COALESCE(SUM(o.total_with_vat), 0) AS revenue,
            COALESCE(SUM(o.estimated_cost), 0) AS cost,
            CASE WHEN SUM(o.taxable_base) > 0
                 THEN SUM(o.estimated_margin_amount) / SUM(o.taxable_base) * 100
                 ELSE 0 END AS margin_pct,
            COALESCE(AVG(o.estimated_hours), 0) AS avg_hours
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
    jobsCount: num(r.jobs),
    revenue: num(r.revenue),
    directCost: num(r.cost),
    marginPercent: Math.round(num(r.margin_pct) * 10) / 10,
    avgLaborHours: num(r.avg_hours),
  }));

  const { rows: kpiRows } = await db.query<Row>(
    `SELECT
      (SELECT COALESCE(SUM(total_amount), 0) FROM invoices
        WHERE organization_id = $1 AND payment_status <> 'cancelled'
          AND issued_at >= date_trunc('quarter', NOW() AT TIME ZONE 'Europe/Lisbon')
              AT TIME ZONE 'Europe/Lisbon') AS quarter_revenue,      (SELECT COALESCE(SUM(total_amount), 0) FROM invoices
        WHERE organization_id = $1 AND payment_status <> 'cancelled'
          AND issued_at >= (date_trunc('quarter', NOW() AT TIME ZONE 'Europe/Lisbon') - interval '3 months')
              AT TIME ZONE 'Europe/Lisbon'
          AND issued_at < (date_trunc('quarter', NOW() AT TIME ZONE 'Europe/Lisbon'))
              AT TIME ZONE 'Europe/Lisbon') AS previous_quarter_revenue,
      (SELECT CASE WHEN SUM(o.taxable_base) > 0
              THEN SUM(o.estimated_margin_amount) / SUM(o.taxable_base) * 100
              ELSE 0 END
        FROM quote_options o JOIN quotes q ON q.id = o.quote_id
        WHERE q.organization_id = $1 AND q.status = 'approved') AS avg_margin,
      (SELECT CASE WHEN SUM(estimated_hours) > 0
              THEN ROUND((SUM(actual_hours_spent) / SUM(estimated_hours)) * 100, 1) ELSE 0 END
        FROM work_orders WHERE organization_id = $1 AND status = 'completed') AS labor_eff,
      (SELECT COALESCE(AVG(scrap_percentage), 0)
        FROM work_order_material_usages WHERE work_order_id IN
          (SELECT id FROM work_orders WHERE organization_id = $1)) AS scrap
     FROM organizations WHERE id = $1`,
    [organizationId]
  );

  const { rows: monthRows } = await db.query<Row>(
    `SELECT to_char(m.month, 'YYYY-MM') AS month,
            COALESCE(SUM(i.total_amount), 0) AS revenue
     FROM generate_series(
            date_trunc('month', NOW() AT TIME ZONE 'Europe/Lisbon') - interval '5 months',
            date_trunc('month', NOW() AT TIME ZONE 'Europe/Lisbon'),
            interval '1 month'
          ) AS m(month)
     LEFT JOIN invoices i
       ON i.organization_id = $1
      AND i.payment_status <> 'cancelled'
      AND i.issued_at >= (m.month AT TIME ZONE 'Europe/Lisbon')
      AND i.issued_at < ((m.month + interval '1 month') AT TIME ZONE 'Europe/Lisbon')
     GROUP BY m.month
     ORDER BY m.month`,
    [organizationId]
  );

  const quarterlyRevenue = num(kpiRows[0]?.quarter_revenue);
  const previousQuarterRevenue = num(kpiRows[0]?.previous_quarter_revenue);
  const quarterChangePercent =
    previousQuarterRevenue > 0
      ? Math.round(((quarterlyRevenue - previousQuarterRevenue) / previousQuarterRevenue) * 1000) / 10
      : null;

  return {
    serviceStats,
    quarterlyRevenue,
    previousQuarterRevenue,
    quarterChangePercent,
    avgMargin: Math.round(num(kpiRows[0]?.avg_margin) * 10) / 10,
    laborEfficiency: num(kpiRows[0]?.labor_eff),
    scrapRate: Math.round(num(kpiRows[0]?.scrap) * 10) / 10,
    monthlyRevenue: monthRows.map((r) => ({
      month: String(r.month),
      revenue: num(r.revenue),
    })),
  };
}
