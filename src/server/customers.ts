import { getDb } from "@/lib/db";
import { workshopDateKey } from "@/domains/calendar/datetime";
import {
  CustomerValidationError,
  isValidCustomerEmail,
  normalizePhoneDigits,
  parseCustomerPriority,
  parseDiscountRate,
  parseOptionalText,
  parsePaymentTermsDays,
  parseRequiredText,
} from "@/domains/crm/validation";
import {
  B2BAccountDetails,
  Customer,
  CustomerStatus,
  CustomerType,
  PreferredChannel,
} from "@/domains/crm/types";

export { CustomerValidationError };

type CustomerRow = Record<string, unknown>;
type Row = Record<string, unknown>;

type CommunicationType = Customer["communications"] extends Array<{ type: infer T }>
  ? T
  : never;
type CommunicationDirection = Customer["communications"] extends Array<{
  direction: infer D;
}>
  ? D
  : never;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUSTOMER_TYPES = new Set<CustomerType>(["individual", "business"]);
const CUSTOMER_STATUSES = new Set<CustomerStatus>(["active", "lead", "archived"]);
const PREFERRED_CHANNELS = new Set<PreferredChannel>(["whatsapp", "phone", "email"]);

function assertUuid(value: string, label: string): void {
  if (!UUID_RE.test(value)) {
    throw new CustomerValidationError(`${label} inválido.`);
  }
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function dateKey(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : workshopDateKey(date);
}

function mapCustomer(row: CustomerRow, includeFinancials: boolean): Customer {
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
    totalSpent: includeFinancials ? (num(row.total_spent) ?? 0) : undefined,
    lastInteractionDate: dateKey(row.last_interaction),
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

const CUSTOMER_METRICS = `
  (SELECT count(*)::int FROM vehicle_customer_links vcl
    JOIN vehicles v ON v.id = vcl.vehicle_id AND v.organization_id = c.organization_id
    WHERE vcl.customer_id = c.id AND vcl.organization_id = c.organization_id AND vcl.is_current)
    AS vehicle_count,
  CASE WHEN $2::boolean THEN
    (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i
      WHERE i.customer_id = c.id AND i.organization_id = c.organization_id
        AND i.payment_status <> 'cancelled')
  ELSE NULL END AS total_spent,
  (SELECT MAX(com.created_at) FROM customer_communications com
    WHERE com.customer_id = c.id) AS last_interaction`;

export interface CustomerListOptions {
  includeFinancials?: boolean;
}

export async function listCustomers(
  organizationId: string,
  options: CustomerListOptions = {}
): Promise<Customer[]> {
  assertUuid(organizationId, "Organização");
  const includeFinancials = options.includeFinancials === true;
  const { rows } = await getDb().query<CustomerRow>(
    `SELECT c.*, ${CUSTOMER_METRICS}
     FROM customers c
     WHERE c.organization_id = $1
     ORDER BY c.created_at DESC`,
    [organizationId, includeFinancials]
  );
  if (rows.length === 0) return [];

  const { rows: b2bRows } = await getDb().query<CustomerRow>(
    "SELECT * FROM b2b_accounts WHERE customer_id = ANY($1::uuid[])",
    [rows.map((r) => r.id)]
  );
  const b2bByCustomer = new Map(b2bRows.map((r) => [r.customer_id, mapB2b(r)]));

  return rows.map((row) => {
    const customer = mapCustomer(row, includeFinancials);
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

export async function getCustomerById(
  organizationId: string,
  customerId: string,
  options: CustomerListOptions = {}
): Promise<Customer | null> {
  assertUuid(organizationId, "Organização");
  if (!UUID_RE.test(customerId)) return null;
  const includeFinancials = options.includeFinancials === true;
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT c.*, ${CUSTOMER_METRICS}
     FROM customers c
     WHERE c.organization_id = $1 AND c.id = $3`,
    [organizationId, includeFinancials, customerId]
  );
  if (rows.length === 0) return null;
  const customer = mapCustomer(rows[0], includeFinancials);

  const { rows: b2bRows } = await db.query<Row>(
    `SELECT * FROM b2b_accounts WHERE customer_id = $1`,
    [customerId]
  );
  if (b2bRows.length > 0) customer.b2bDetails = mapB2b(b2bRows[0]);

  const { rows: contactRows } = await db.query<Row>(
    `SELECT * FROM customer_contacts WHERE customer_id = $1 ORDER BY is_primary DESC`,
    [customerId]
  );
  customer.contacts = contactRows.map((r) => ({
    id: String(r.id),
    customerId,
    name: String(r.name),
    role: (r.role as string) ?? "",
    email: String(r.email),
    phone: String(r.phone),
    isPrimary: Boolean(r.is_primary),
    canApproveQuotes: Boolean(r.can_approve_quotes),
  }));

  const { rows: comRows } = await db.query<Row>(
    `SELECT com.*, p.name AS author_name FROM customer_communications com
     LEFT JOIN profiles p ON p.id = com.author_id
     WHERE com.customer_id = $1 ORDER BY com.created_at DESC`,
    [customerId]
  );
  customer.communications = comRows.map((r) => ({
    id: String(r.id),
    customerId,
    type: r.type as CommunicationType,
    direction: r.direction as CommunicationDirection,
    summary: String(r.summary),
    authorName: (r.author_name as string) ?? "Sistema",
    createdAt: iso(r.created_at),
  }));

  return customer;
}

export async function createCustomer(
  organizationId: string,
  input: CustomerCreateInput
): Promise<Customer> {
  assertUuid(organizationId, "Organização");
  if (!CUSTOMER_TYPES.has(input.type)) {
    throw new CustomerValidationError("Tipo de cliente inválido.");
  }

  const name = parseRequiredText(input.name, "O nome do cliente", 255);
  const legalName = parseOptionalText(input.legalName, "A razão social", 255);
  const nif = parseOptionalText(input.nif, "O NIF", 50);
  const email = parseOptionalText(input.email, "O email", 255) ?? "";
  const phone = parseOptionalText(input.phone, "O telefone", 50) ?? "";
  if (!email && !phone) {
    throw new CustomerValidationError("Introduz pelo menos um contacto (telefone ou email).");
  }
  if (email && !isValidCustomerEmail(email)) {
    throw new CustomerValidationError("O email indicado não é válido.");
  }
  const phoneNormalized = normalizePhoneDigits(input.phoneNormalized || phone);
  const preferredChannel = input.preferredChannel ?? "whatsapp";
  if (!PREFERRED_CHANNELS.has(preferredChannel)) {
    throw new CustomerValidationError("Canal de contacto inválido.");
  }
  const status = input.status ?? "active";
  if (!CUSTOMER_STATUSES.has(status)) {
    throw new CustomerValidationError("Estado do cliente inválido.");
  }
  const notes = parseOptionalText(input.notes, "As notas", 5000);

  let b2bDetails: {
    discountRate: number;
    paymentTermsDays: number;
    priorityLevel: "standard" | "high" | "vip";
    commercialNotes?: string;
  } | null = null;
  if (input.type === "business" && input.b2bDetails) {
    b2bDetails = {
      discountRate: parseDiscountRate(input.b2bDetails.discountRate),
      paymentTermsDays: parsePaymentTermsDays(input.b2bDetails.paymentTermsDays),
      priorityLevel: parseCustomerPriority(input.b2bDetails.priorityLevel),
      commercialNotes: parseOptionalText(
        input.b2bDetails.commercialNotes,
        "As notas comerciais",
        5000
      ),
    };
  }

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
        name,
        legalName ?? null,
        nif ?? null,
        email,
        phone,
        phoneNormalized,
        preferredChannel,
        notes ?? null,
        status,
      ]
    );
    const customer = mapCustomer(rows[0], true);

    if (b2bDetails) {
      const { rows: b2bRows } = await client.query<CustomerRow>(
        `INSERT INTO b2b_accounts
          (customer_id, discount_rate, payment_terms_days, priority_level, commercial_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          customer.id,
          b2bDetails.discountRate,
          b2bDetails.paymentTermsDays,
          b2bDetails.priorityLevel,
          b2bDetails.commercialNotes ?? null,
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
