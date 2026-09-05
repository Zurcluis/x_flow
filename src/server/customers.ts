import { getDb } from "@/lib/db";
import {
  B2BAccountDetails,
  Customer,
  CustomerStatus,
  CustomerType,
  PreferredChannel,
} from "@/domains/crm/types";

export const PRIMARY_ORG_SLUG = "x-motion";

type CustomerRow = Record<string, unknown>;

const ORG_NOT_FOUND =
  "Organização não encontrada na base de dados. Corre o seed (scripts/seed.mjs) antes de usar a app.";

export async function getPrimaryOrganizationId(): Promise<string> {
  const { rows } = await getDb().query<{ id: string }>(
    "SELECT id FROM organizations WHERE slug = $1 LIMIT 1",
    [PRIMARY_ORG_SLUG]
  );
  if (rows.length === 0) throw new Error(ORG_NOT_FOUND);
  return rows[0].id;
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    type: row.type as CustomerType,
    name: String(row.name),
    legalName: (row.legal_name as string) ?? undefined,
    nif: (row.nif as string) ?? undefined,
    email: String(row.email),
    phone: String(row.phone),
    phoneNormalized: String(row.phone_normalized),
    preferredChannel: (row.preferred_channel as PreferredChannel) ?? "whatsapp",
    notes: (row.notes as string) ?? undefined,
    status: (row.status as CustomerStatus) ?? "active",
    vehicleCount: num(row.vehicle_count) ?? 0,
    totalSpent: num(row.total_spent) ?? 0,
    lastInteractionDate: row.last_interaction
      ? iso(row.last_interaction).slice(0, 10)
      : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapB2b(row: CustomerRow): B2BAccountDetails {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    discountRate: num(row.discount_rate) ?? 0,
    paymentTermsDays: num(row.payment_terms_days) ?? 30,
    priorityLevel: (row.priority_level as "standard" | "high" | "vip") ?? "standard",
    commercialNotes: (row.commercial_notes as string) ?? undefined,
  };
}

const LIST_SQL = `
  SELECT c.*,
    (SELECT count(*)::int FROM vehicle_customer_links vcl
      WHERE vcl.customer_id = c.id AND vcl.is_current) AS vehicle_count,
    (SELECT SUM(i.total_amount) FROM invoices i
      WHERE i.customer_id = c.id AND i.payment_status <> 'cancelled') AS total_spent,
    (SELECT MAX(com.created_at) FROM customer_communications com
      WHERE com.customer_id = c.id) AS last_interaction
  FROM customers c
  WHERE c.organization_id = $1
  ORDER BY c.created_at DESC`;

export async function listCustomers(organizationId: string): Promise<Customer[]> {
  const db = getDb();
  const { rows } = await db.query<CustomerRow>(LIST_SQL, [organizationId]);

  const { rows: b2bRows } = await db.query<CustomerRow>(
    "SELECT * FROM b2b_accounts WHERE customer_id = ANY($1::uuid[])",
    [rows.map((r) => r.id)]
  );
  const b2bByCustomer = new Map(b2bRows.map((r) => [r.customer_id, mapB2b(r)]));

  return rows.map((row) => {
    const customer = mapCustomer(row);
    const b2b = b2bByCustomer.get(customer.id);
    if (b2b) customer.b2bDetails = b2b;
    return customer;
  });
}

export interface CustomerCreateInput {
  type: CustomerType;
  name: string;
  legalName?: string;
  nif?: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  preferredChannel?: PreferredChannel;
  notes?: string;
  status?: CustomerStatus;
  b2bDetails?: {
    discountRate: number;
    paymentTermsDays: number;
    priorityLevel: "standard" | "high" | "vip";
    commercialNotes?: string;
  };
}

export async function createCustomer(
  organizationId: string,
  input: CustomerCreateInput
): Promise<Customer> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<CustomerRow>(
      `INSERT INTO customers
        (organization_id, type, name, legal_name, nif, email, phone, phone_normalized,
         preferred_channel, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        organizationId,
        input.type,
        input.name,
        input.legalName ?? null,
        input.nif ?? null,
        input.email,
        input.phone,
        input.phoneNormalized,
        input.preferredChannel ?? "whatsapp",
        input.notes ?? null,
        input.status ?? "active",
      ]
    );
    const customer = mapCustomer(rows[0]);

    if (input.type === "business" && input.b2bDetails) {
      const { rows: b2bRows } = await client.query<CustomerRow>(
        `INSERT INTO b2b_accounts
          (customer_id, discount_rate, payment_terms_days, priority_level, commercial_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          customer.id,
          input.b2bDetails.discountRate,
          input.b2bDetails.paymentTermsDays,
          input.b2bDetails.priorityLevel,
          input.b2bDetails.commercialNotes ?? null,
        ]
      );
      customer.b2bDetails = mapB2b(b2bRows[0]);
    }

    await client.query("COMMIT");
    return customer;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
