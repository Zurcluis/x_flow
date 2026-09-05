"use server";

import { SearchResultItem } from "@/domains/search/types";
import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";

export async function searchDatabaseAction(
  query: string
): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const db = getDb();
  const organizationId = await getPrimaryOrganizationId();
  const like = `%${q}%`;

  const results: SearchResultItem[] = [];

  const { rows: customerRows } = await db.query<Record<string, unknown>>(
    `SELECT id, name, email, phone, type, status FROM customers
     WHERE organization_id = $1 AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2 OR nif ILIKE $2)
     LIMIT 5`,
    [organizationId, like]
  );
  for (const r of customerRows) {
    results.push({
      id: `cust-${r.id}`,
      title: String(r.name),
      subtitle: `${String(r.email)} · ${String(r.phone)}`,
      category: "customers",
      categoryLabel: "Cliente",
      href: `/customers/${r.id}`,
      badge: r.status === "lead" ? "Lead" : r.type === "business" ? "B2B" : undefined,
      badgeVariant: r.status === "lead" ? "gold" : "outline",
      keywords: [],
    });
  }

  const { rows: vehicleRows } = await db.query<Record<string, unknown>>(
    `SELECT v.id, v.plate_display, v.make, v.model, v.generation_year,
            c.name AS owner_name
     FROM vehicles v
     LEFT JOIN vehicle_customer_links l ON l.vehicle_id = v.id AND l.is_current
     LEFT JOIN customers c ON c.id = l.customer_id
     WHERE v.organization_id = $1
       AND (v.plate_display ILIKE $2 OR v.plate_normalized ILIKE $2 OR v.make ILIKE $2 OR v.model ILIKE $2 OR v.vin ILIKE $2)
     LIMIT 5`,
    [organizationId, like]
  );
  for (const r of vehicleRows) {
    results.push({
      id: `veh-${r.id}`,
      title: `${r.make} ${r.model}`,
      subtitle: `${r.plate_display} · ${r.owner_name ?? "Sem proprietário"}`,
      category: "vehicles",
      categoryLabel: "Viatura",
      href: `/vehicles/${r.id}`,
      keywords: [],
    });
  }

  const { rows: quoteRows } = await db.query<Record<string, unknown>>(
    `SELECT q.id, q.quote_number, q.status, c.name AS customer_name
     FROM quotes q JOIN customers c ON c.id = q.customer_id
     WHERE q.organization_id = $1 AND (q.quote_number ILIKE $2 OR c.name ILIKE $2)
     LIMIT 4`,
    [organizationId, like]
  );
  for (const r of quoteRows) {
    results.push({
      id: `quote-${r.id}`,
      title: `Orçamento ${r.quote_number}`,
      subtitle: String(r.customer_name),
      category: "quotes",
      categoryLabel: "Orçamento",
      href: `/quotes/${r.id}`,
      badge: String(r.status),
      badgeVariant: r.status === "approved" ? "success" : r.status === "draft" ? "outline" : "in_progress",
      keywords: [],
    });
  }

  const { rows: woRows } = await db.query<Record<string, unknown>>(
    `SELECT w.id, w.work_order_number, w.service_title, w.status,
            v.make || ' ' || v.model AS vehicle
     FROM work_orders w JOIN vehicles v ON v.id = w.vehicle_id
     WHERE w.organization_id = $1 AND (w.work_order_number ILIKE $2 OR w.service_title ILIKE $2 OR v.make ILIKE $2 OR v.model ILIKE $2)
     LIMIT 4`,
    [organizationId, like]
  );
  for (const r of woRows) {
    results.push({
      id: `wo-${r.id}`,
      title: `Ordem ${r.work_order_number}`,
      subtitle: `${r.service_title} · ${r.vehicle}`,
      category: "production",
      categoryLabel: "Produção",
      href: `/production/${r.id}`,
      badge: String(r.status),
      badgeVariant: r.status === "completed" ? "success" : "in_progress",
      keywords: [],
    });
  }

  const { rows: materialRows } = await db.query<Record<string, unknown>>(
    `SELECT id, brand, name, current_stock_meters, unit FROM materials
     WHERE organization_id = $1 AND (name ILIKE $2 OR brand ILIKE $2)
     LIMIT 4`,
    [organizationId, like]
  );
  for (const r of materialRows) {
    results.push({
      id: `mat-${r.id}`,
      title: `${r.brand} ${r.name}`,
      subtitle: `Stock: ${Number(r.current_stock_meters)} ${Number(r.current_stock_meters) === 1 ? (r.unit === "meter" ? "metro" : String(r.unit)) : r.unit === "meter" ? "metros" : String(r.unit)}`,
      category: "stock",
      categoryLabel: "Stock",
      href: "/stock",
      keywords: [],
    });
  }

  return results;
}
