import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import { Quote, QuoteEvent, QuoteOption, QuoteStatus, OptionTier } from "@/domains/quotes/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function mapOption(row: Row): QuoteOption {
  return {
    id: String(row.id),
    quoteId: String(row.quote_id),
    tier: row.tier as OptionTier,
    name: String(row.name),
    description: (row.description as string) ?? "",
    isRecommended: Boolean(row.is_recommended),
    warrantyYears: num(row.warranty_years),
    subtotal: num(row.subtotal),
    discountRate: num(row.discount_rate),
    discountAmount: num(row.discount_amount),
    taxableBase: num(row.taxable_base),
    vatRate: num(row.vat_rate),
    vatAmount: num(row.vat_amount),
    totalWithVat: num(row.total_with_vat),
    estimatedCost: num(row.estimated_cost),
    estimatedMarginAmount: num(row.estimated_margin_amount),
    estimatedMarginPercentage: num(row.estimated_margin_percentage),
    estimatedHours: num(row.estimated_hours),
    items: [],
  };
}

function mapQuote(row: Row): Quote {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    quoteNumber: String(row.quote_number),
    vehicleId: String(row.vehicle_id),
    vehiclePlate: String(row.vehicle_plate ?? ""),
    vehicleModel: String(row.vehicle_model ?? ""),
    vehicleYear: num(row.vehicle_year),
    vehicleColor: String(row.vehicle_color ?? ""),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name ?? ""),
    customerEmail: String(row.customer_email ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    customerType: (row.customer_type as "individual" | "business") ?? "individual",
    status: row.status as QuoteStatus,
    selectedOptionId: row.selected_option_id ? String(row.selected_option_id) : undefined,
    publicToken: String(row.public_token),
    expiresAt: iso(row.expires_at),
    notes: (row.notes as string) ?? undefined,
    createdBy: row.created_by ? String(row.created_by) : "",
    approvedAt: row.approved_at ? iso(row.approved_at) : undefined,
    approvedByName: (row.approved_by_name as string) ?? undefined,
    options: [],
    events: [],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

const QUOTE_JOINS = `
  FROM quotes q
  JOIN vehicles v ON v.id = q.vehicle_id
  JOIN customers c ON c.id = q.customer_id`;

export async function listQuotes(organizationId: string): Promise<Quote[]> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT q.*, v.plate_display AS vehicle_plate, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year AS vehicle_year, v.original_color_name AS vehicle_color,
            c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
            c.type AS customer_type
     ${QUOTE_JOINS}
     WHERE q.organization_id = $1
     ORDER BY q.created_at DESC`,
    [organizationId]
  );
  if (rows.length === 0) return [];

  const { rows: optionRows } = await db.query<Row>(
    `SELECT o.* FROM quote_options o
     JOIN quotes q ON q.id = o.quote_id
     WHERE q.organization_id = $1 ORDER BY o.created_at`,
    [organizationId]
  );
  const optionsByQuote = new Map<string, QuoteOption[]>();
  for (const r of optionRows) {
    const qid = String(r.quote_id);
    if (!optionsByQuote.has(qid)) optionsByQuote.set(qid, []);
    optionsByQuote.get(qid)!.push(mapOption(r));
  }

  return rows.map((r) => {
    const q = mapQuote(r);
    q.options = optionsByQuote.get(q.id) ?? [];
    return q;
  });
}

export async function getQuoteById(
  organizationId: string,
  quoteId: string
): Promise<Quote | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT q.*, v.plate_display AS vehicle_plate, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year AS vehicle_year, v.original_color_name AS vehicle_color,
            c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
            c.type AS customer_type
     ${QUOTE_JOINS}
     WHERE q.organization_id = $1 AND q.id = $2`,
    [organizationId, quoteId]
  );
  if (rows.length === 0) return null;
  const quote = mapQuote(rows[0]);

  const { rows: optionRows } = await db.query<Row>(
    `SELECT o.* FROM quote_options o WHERE o.quote_id = $1 ORDER BY o.created_at`,
    [quoteId]
  );
  quote.options = optionRows.map(mapOption);

  const { rows: itemRows } = await db.query<Row>(
    `SELECT i.* FROM quote_option_items i JOIN quote_options o ON o.id = i.quote_option_id WHERE o.quote_id = $1`,
    [quoteId]
  );
  for (const opt of quote.options) {
    opt.items = itemRows
      .filter((i) => String(i.quote_option_id) === opt.id)
      .map((i) => ({
        id: String(i.id),
        serviceName: String(i.service_name),
        bodyPartCode: String(i.body_part_code),
        bodyPartName: String(i.body_part_name),
        materialName: String(i.material_name),
        areaM2: num(i.area_m2),
        laborHours: num(i.labor_hours),
        unitPrice: num(i.unit_price),
        totalPrice: num(i.total_price),
      }));
  }

  const { rows: eventRows } = await db.query<Row>(
    `SELECT * FROM quote_events WHERE quote_id = $1 ORDER BY created_at DESC`,
    [quoteId]
  );
  quote.events = eventRows.map<QuoteEvent>((r) => ({
    id: String(r.id),
    quoteId: String(r.quote_id),
    eventType: r.event_type as QuoteEvent["eventType"],
    description: String(r.description),
    authorName: (r.author_name as string) ?? undefined,
    createdAt: iso(r.created_at),
  }));

  return quote;
}

export interface CreateQuoteInput {
  vehicleId: string;
  customerId: string;
  notes?: string;
  options: QuoteOption[];
}

export async function createQuote(
  organizationId: string,
  input: CreateQuoteInput
): Promise<Quote> {
  const db = getDb();
  const client = await db.connect();
  let quoteId: string;
  try {
    await client.query("BEGIN");

    const quoteNumber = `ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const publicToken = `qt_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const { rows: quoteRows } = await client.query<Row>(
      `INSERT INTO quotes
        (organization_id, quote_number, vehicle_id, customer_id, status, public_token, expires_at, notes)
       VALUES ($1,$2,$3,$4,'sent',$5, NOW() + INTERVAL '30 days', $6)
       RETURNING id`,
      [
        organizationId,
        quoteNumber,
        input.vehicleId,
        input.customerId,
        publicToken,
        input.notes ?? null,
      ]
    );
    quoteId = String(quoteRows[0].id);

    for (const opt of input.options) {
      const { rows: optRows } = await client.query<Row>(
        `INSERT INTO quote_options
          (quote_id, tier, name, description, is_recommended, warranty_years,
           subtotal, discount_rate, discount_amount, taxable_base, vat_rate,
           vat_amount, total_with_vat, estimated_cost, estimated_margin_amount,
           estimated_margin_percentage, estimated_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [
          quoteId,
          opt.tier,
          opt.name,
          opt.description,
          opt.isRecommended,
          opt.warrantyYears,
          opt.subtotal,
          opt.discountRate,
          opt.discountAmount,
          opt.taxableBase,
          opt.vatRate,
          opt.vatAmount,
          opt.totalWithVat,
          opt.estimatedCost,
          opt.estimatedMarginAmount,
          opt.estimatedMarginPercentage,
          opt.estimatedHours,
        ]
      );
      const optionId = String(optRows[0].id);

      for (const item of opt.items) {
        await client.query(
          `INSERT INTO quote_option_items
            (quote_option_id, service_name, body_part_code, body_part_name,
             material_name, area_m2, labor_hours, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            optionId,
            item.serviceName,
            item.bodyPartCode,
            item.bodyPartName,
            item.materialName,
            item.areaM2,
            item.laborHours,
            item.unitPrice,
            item.totalPrice,
          ]
        );
      }
    }

    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'created','Orçamento emitido e enviado para o painel do cliente.','X-Flow')`,
      [quoteId]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const quote = await getQuoteById(organizationId, quoteId);
  if (!quote) throw new Error("Orçamento não encontrado após criação.");
  return quote;
}

export async function rejectQuote(organizationId: string, quoteId: string): Promise<void> {
  await getDb().query(
    `UPDATE quotes SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
    [quoteId, organizationId]
  );
  await getDb().query(
    `INSERT INTO quote_events (quote_id, event_type, description, author_name)
     VALUES ($1,'rejected','Proposta recusada pelo cliente.','Cliente')`,
    [quoteId]
  );
}

export async function deleteQuote(
  organizationId: string,
  quoteId: string
): Promise<{ ok: boolean; error?: string }> {
  const { rows } = await getDb().query<Row>(
    `SELECT count(*)::int AS n FROM work_orders WHERE quote_id = $1`,
    [quoteId]
  );
  if (Number(rows[0].n) > 0) {
    return {
      ok: false,
      error: "A proposta já gerou uma ordem de trabalho e não pode ser eliminada.",
    };
  }
  await getDb().query(
    `DELETE FROM quotes WHERE id = $1 AND organization_id = $2`,
    [quoteId, organizationId]
  );
  return { ok: true };
}

export async function approveQuote(
  organizationId: string,
  quoteId: string
): Promise<{ ok: true; workOrderId: string } | { ok: false; error: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: quoteRows } = await client.query<Row>(
      `SELECT q.*, o.id AS option_id, o.name AS option_name, o.total_with_vat,
              v.make, v.model, v.plate_display
       FROM quotes q
       LEFT JOIN quote_options o ON o.quote_id = q.id AND (o.is_recommended OR q.selected_option_id = o.id)
       LEFT JOIN vehicles v ON v.id = q.vehicle_id
       WHERE q.id = $1 AND q.organization_id = $2
       FOR UPDATE OF q`,
      [quoteId, organizationId]
    );
    if (quoteRows.length === 0) {
      throw new Error("Orçamento não encontrado.");
    }
    const quote = quoteRows[0];

    const { rows: existing } = await client.query<Row>(
      `SELECT id FROM work_orders WHERE quote_id = $1 LIMIT 1`,
      [quoteId]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return { ok: true, workOrderId: String(existing[0].id) };
    }

    await client.query(
      `UPDATE quotes SET status = 'approved', approved_at = NOW(), approved_by_name = COALESCE(approved_by_name, 'Cliente'), updated_at = NOW() WHERE id = $1`,
      [quoteId]
    );

    const serviceTitle = quote.option_name ? `${quote.option_name}` : "Serviço aprovado";
    const { rows: woRows } = await client.query<Row>(
      `INSERT INTO work_orders
        (organization_id, work_order_number, vehicle_id, customer_id, quote_id, status,
         service_title, progress_percentage, estimated_hours, actual_hours_spent)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,0,$7,0) RETURNING id`,
      [
        organizationId,
        `WO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        quote.vehicle_id,
        quote.customer_id,
        quoteId,
        serviceTitle,
        num(quote.estimated_hours) || 8,
      ]
    );
    const workOrderId = String(woRows[0].id);

    const STANDARD_PHASES: Array<[string, string, number]> = [
      ["prep_decontamination", "Preparação e Descontaminação", 2],
      ["disassembly", "Desmontagem", 2.5],
      ["film_cutting", "Corte de Filme", 4],
      ["application", "Aplicação", 18],
      ["assembly", "Montagem", 2.5],
      ["thermal_cure", "Cura Térmica", 1.5],
      ["detailing_finish", "Detalhes e Acabamento", 1.5],
      ["quality_control", "Controlo de Qualidade", 1],
    ];
    for (let i = 0; i < STANDARD_PHASES.length; i++) {
      const [key, name, estHours] = STANDARD_PHASES[i];
      await client.query(
        `INSERT INTO work_order_phases (work_order_id, phase_key, name, status, order_index, estimated_hours)
         VALUES ($1,$2,$3,'pending',$4,$5)`,
        [workOrderId, key, name, i, estHours]
      );
    }

    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'approved',$2,'Sistema')`,
      [quoteId, `Orçamento aprovado. Ordem de trabalho criada (${String(woRows[0].id).slice(0, 8)}).`]
    );

    await client.query("COMMIT");
    return { ok: true, workOrderId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao aprovar orçamento." };
  } finally {
    client.release();
  }
}

export async function getQuoteByToken(token: string): Promise<Quote | null> {
  const db = getDb();
  const { rows } = await db.query<{ id: string; organization_id: string }>(
    `SELECT id, organization_id FROM quotes WHERE public_token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return getQuoteById(rows[0].organization_id, rows[0].id);
}

export { getPrimaryOrganizationId };
