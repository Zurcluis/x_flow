import { getDb, restoreBootstrapOrg } from "@/lib/db";
import { isUuid } from "@/domains/quotes/validation";
import {
  Delivery,
  DeliveryCheckinBelonging,
  InvoicePaymentInput,
} from "@/domains/finance/types";

type Row = Record<string, unknown>;

export interface DeliveryWithAftersales extends Delivery {
  customerPhone?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  satisfactionSubmittedAt?: string;
  googleReviewClicked?: boolean;
  followupD7SentAt?: string;
  reviewD30ScheduledAt?: string;
  reviewD30CompletedAt?: string;
  reviewD30Notes?: string;
  depositStatus?: string;
  depositPaidAmount?: number;
  serviceTotalAmount?: number;
  remainingBalanceAmount?: number;
  invoicePaymentStatus?: string;
}

export type DeliveryRecord = DeliveryWithAftersales;
export type DeliveryDetail = DeliveryWithAftersales;

export interface PublicDeliveryFeedbackData {
  deliveryId: string;
  token: string;
  customerName: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceTitle: string;
  deliveredAt: string;
  satisfactionRating: number | null;
  satisfactionComment: string | null;
  satisfactionSubmittedAt: string | null;
  googleReviewClicked: boolean;
  googleReviewUrl: string;
}

const DEFAULT_GOOGLE_REVIEW_URL = "https://maps.app.goo.gl/W3RiGThiUjNGyNwX6";

export class DeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryError";
  }
}

export function deliveryErrorMessage(error: unknown, fallback: string): string {
  return error instanceof DeliveryError ? error.message : fallback;
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function mapBelongings(value: unknown): DeliveryCheckinBelonging[] {
  const raw = Array.isArray(value) ? (value as Row[]) : [];
  return raw
    .filter((item) => typeof item?.name === "string")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `bel-${index}`,
      name: String(item.name),
      isReturned: Boolean(item.isReturned),
    }));
}

function mapDelivery(row: Row): DeliveryWithAftersales {
  const depositStatus = row.deposit_status ? String(row.deposit_status) : undefined;
  const rawDepositAmount = row.deposit_amount != null ? Number(row.deposit_amount) : 0;
  const depositPaidAmount =
    depositStatus === "paid" && rawDepositAmount > 0
      ? round2(rawDepositAmount)
      : undefined;

  const quoteTotal =
    row.quote_total_with_vat != null && Number(row.quote_total_with_vat) > 0
      ? round2(Number(row.quote_total_with_vat))
      : undefined;
  const invoiceTotal =
    row.invoice_total_amount != null
      ? round2(Number(row.invoice_total_amount))
      : undefined;

  const serviceTotalAmount =
    quoteTotal ??
    (invoiceTotal != null
      ? round2(invoiceTotal + (depositPaidAmount ?? 0))
      : undefined);

  const remainingBalanceAmount =
    serviceTotalAmount != null
      ? Math.max(0, round2(serviceTotalAmount - (depositPaidAmount ?? 0)))
      : invoiceTotal;

  const invoicePaymentStatus = row.invoice_payment_status
    ? String(row.invoice_payment_status)
    : undefined;

  return {
    id: String(row.id),
    workOrderId: String(row.work_order_id),
    vehiclePlate: String(row.plate_display ?? row.vehicle_plate ?? ""),
    vehicleModel: String(row.vehicle_model_full ?? ""),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name ?? ""),
    customerPhone: (row.customer_phone as string) ?? undefined,
    deliveredByName: String(row.delivered_by_name),
    receiverName: String(row.receiver_name),
    receiverIdDocument: (row.receiver_id_document as string) ?? undefined,
    signatureDataUrl: (row.signature_data_url as string) ?? undefined,
    belongingsReturnedConfirmed: Boolean(row.belongings_returned_confirmed),
    belongings: mapBelongings(row.belongings),
    notes: (row.notes as string) ?? undefined,
    deliveredAt: iso(row.delivered_at),
    token: String(row.token),
    satisfactionRating:
      row.satisfaction_rating != null ? Number(row.satisfaction_rating) : undefined,
    satisfactionComment: (row.satisfaction_comment as string) ?? undefined,
    satisfactionSubmittedAt: row.satisfaction_submitted_at
      ? iso(row.satisfaction_submitted_at)
      : undefined,
    googleReviewClicked: Boolean(row.google_review_clicked),
    followupD7SentAt: row.followup_d7_sent_at ? iso(row.followup_d7_sent_at) : undefined,
    reviewD30ScheduledAt: row.review_d30_scheduled_at
      ? iso(row.review_d30_scheduled_at)
      : undefined,
    reviewD30CompletedAt: row.review_d30_completed_at
      ? iso(row.review_d30_completed_at)
      : undefined,
    reviewD30Notes: (row.review_d30_notes as string) ?? undefined,
    depositStatus,
    depositPaidAmount,
    serviceTotalAmount,
    remainingBalanceAmount,
    invoicePaymentStatus,
  };
}

export interface DeliveryCandidate {
  workOrderId: string;
  workOrderNumber: string;
  serviceTitle: string;
  vehicleId: string;
  plateDisplay: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  qcCertificateNumber: string | null;
  belongings: { id: string; itemName: string; isPresent: boolean }[];
}

/** Ordens concluídas ainda sem entrega registada. */
export async function listDeliveryCandidates(
  organizationId: string
): Promise<DeliveryCandidate[]> {
  if (!isUuid(organizationId)) return [];
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT w.id AS work_order_id, w.work_order_number, w.service_title,
            v.id AS vehicle_id, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.id AS customer_id, c.name AS customer_name,
            qc.certificate_number AS qc_certificate_number,
            (SELECT ck.belongings FROM checkins ck
             WHERE ck.vehicle_id = v.id AND ck.organization_id = w.organization_id
               AND ck.belongings IS NOT NULL
             ORDER BY ck.created_at DESC LIMIT 1) AS belongings
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
     JOIN customers c ON c.id = w.customer_id AND c.organization_id = w.organization_id
     LEFT JOIN LATERAL (
       SELECT q.certificate_number FROM qc_inspections q
       WHERE q.work_order_id = w.id AND q.status = 'passed'
       ORDER BY q.created_at DESC
       LIMIT 1
     ) qc ON TRUE
     WHERE w.organization_id = $1
       AND w.status = 'completed'
       AND NOT EXISTS (
         SELECT 1 FROM deliveries d
         WHERE d.work_order_id = w.id AND d.organization_id = w.organization_id
       )
     ORDER BY w.completed_at DESC NULLS LAST`,
    [organizationId]
  );
  return rows.map((r) => {
    const raw = Array.isArray(r.belongings) ? (r.belongings as Row[]) : [];
    return {
      workOrderId: String(r.work_order_id),
      workOrderNumber: String(r.work_order_number),
      serviceTitle: String(r.service_title),
      vehicleId: String(r.vehicle_id),
      plateDisplay: String(r.plate_display ?? ""),
      vehicleModel: String(r.vehicle_model),
      customerId: String(r.customer_id),
      customerName: String(r.customer_name),
      qcCertificateNumber: (r.qc_certificate_number as string) ?? null,
      belongings: raw
        .filter((b) => typeof b?.itemName === "string")
        .map((b, idx) => ({
          id: `bel-${idx}`,
          itemName: String(b.itemName),
          isPresent: b.isPresent !== false,
        })),
    };
  });
}

export async function listDeliveries(
  organizationId: string
): Promise<DeliveryWithAftersales[]> {
  if (!isUuid(organizationId)) return [];
  const { rows } = await getDb().query<Row>(
    `SELECT d.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name, c.phone AS customer_phone,
            qt.deposit_status, qt.deposit_amount, qt.quote_total_with_vat,
            inv.invoice_total_amount, inv.invoice_payment_status
     FROM deliveries d
     JOIN vehicles v ON v.id = d.vehicle_id AND v.organization_id = d.organization_id
     JOIN customers c ON c.id = d.customer_id AND c.organization_id = d.organization_id
     LEFT JOIN work_orders w ON w.id = d.work_order_id AND w.organization_id = d.organization_id
     LEFT JOIN LATERAL (
       SELECT i.quote_id AS invoice_quote_id,
              i.total_amount AS invoice_total_amount,
              i.payment_status AS invoice_payment_status
       FROM invoices i
       WHERE i.work_order_id = d.work_order_id
         AND i.organization_id = d.organization_id
       ORDER BY i.issued_at DESC
       LIMIT 1
     ) inv ON TRUE
     LEFT JOIN LATERAL (
       SELECT q.deposit_status,
              q.deposit_amount,
              qo.total_with_vat AS quote_total_with_vat
       FROM quotes q
       LEFT JOIN quote_options qo ON qo.quote_id = q.id
       WHERE q.organization_id = d.organization_id
         AND (
           q.id = COALESCE(w.quote_id, inv.invoice_quote_id)
           OR (COALESCE(w.quote_id, inv.invoice_quote_id) IS NULL AND q.vehicle_id = d.vehicle_id)
         )
       ORDER BY
         CASE WHEN q.id = COALESCE(w.quote_id, inv.invoice_quote_id) THEN 0 ELSE 1 END,
         CASE WHEN qo.id = q.selected_option_id THEN 0 WHEN qo.is_recommended THEN 1 ELSE 2 END,
         q.created_at DESC
       LIMIT 1
     ) qt ON TRUE
     WHERE d.organization_id = $1
     ORDER BY d.delivered_at DESC`,
    [organizationId]
  );
  return rows.map(mapDelivery);
}

export async function getDeliveryById(
  organizationId: string,
  deliveryId: string
): Promise<DeliveryWithAftersales | null> {
  if (!isUuid(organizationId) || !isUuid(deliveryId)) return null;
  const { rows } = await getDb().query<Row>(
    `SELECT d.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name, c.phone AS customer_phone,
            qt.deposit_status, qt.deposit_amount, qt.quote_total_with_vat,
            inv.invoice_total_amount, inv.invoice_payment_status
     FROM deliveries d
     JOIN vehicles v ON v.id = d.vehicle_id AND v.organization_id = d.organization_id
     JOIN customers c ON c.id = d.customer_id AND c.organization_id = d.organization_id
     LEFT JOIN work_orders w ON w.id = d.work_order_id AND w.organization_id = d.organization_id
     LEFT JOIN LATERAL (
       SELECT i.quote_id AS invoice_quote_id,
              i.total_amount AS invoice_total_amount,
              i.payment_status AS invoice_payment_status
       FROM invoices i
       WHERE i.work_order_id = d.work_order_id
         AND i.organization_id = d.organization_id
       ORDER BY i.issued_at DESC
       LIMIT 1
     ) inv ON TRUE
     LEFT JOIN LATERAL (
       SELECT q.deposit_status,
              q.deposit_amount,
              qo.total_with_vat AS quote_total_with_vat
       FROM quotes q
       LEFT JOIN quote_options qo ON qo.quote_id = q.id
       WHERE q.organization_id = d.organization_id
         AND (
           q.id = COALESCE(w.quote_id, inv.invoice_quote_id)
           OR (COALESCE(w.quote_id, inv.invoice_quote_id) IS NULL AND q.vehicle_id = d.vehicle_id)
         )
       ORDER BY
         CASE WHEN q.id = COALESCE(w.quote_id, inv.invoice_quote_id) THEN 0 ELSE 1 END,
         CASE WHEN qo.id = q.selected_option_id THEN 0 WHEN qo.is_recommended THEN 1 ELSE 2 END,
         q.created_at DESC
       LIMIT 1
     ) qt ON TRUE
     WHERE d.organization_id = $1 AND d.id = $2
     LIMIT 1`,
    [organizationId, deliveryId]
  );
  if (rows.length === 0) return null;
  return mapDelivery(rows[0]);
}

export interface DeliveryCreateInput {
  workOrderId: string;
  deliveredByName: string;
  receiverName: string;
  receiverIdDocument?: string;
  signatureDataUrl?: string;
  belongings: { name: string; isReturned: boolean }[];
  notes?: string;
}

const SIGNATURE_PATTERN = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const MAX_SIGNATURE_LENGTH = 500_000;
const MAX_BELONGINGS = 50;

export async function createDelivery(
  organizationId: string,
  input: DeliveryCreateInput
): Promise<{ id: string }> {
  if (!isUuid(organizationId) || !isUuid(input.workOrderId)) {
    throw new DeliveryError("Ordem de trabalho inválida.");
  }

  const deliveredByName = input.deliveredByName.trim().slice(0, 100);
  const receiverName = input.receiverName.trim().slice(0, 150);
  const receiverIdDocument = input.receiverIdDocument?.trim().slice(0, 50) || null;
  const notes = input.notes?.trim().slice(0, 2000) || null;

  if (!deliveredByName) {
    throw new DeliveryError("Quem entrega a viatura é obrigatório.");
  }
  if (!receiverName) {
    throw new DeliveryError("O nome de quem levanta a viatura é obrigatório.");
  }
  if (!input.signatureDataUrl?.trim()) {
    throw new DeliveryError("Recolhe a assinatura de quem levanta a viatura.");
  }
  if (
    input.signatureDataUrl.length > MAX_SIGNATURE_LENGTH ||
    !SIGNATURE_PATTERN.test(input.signatureDataUrl)
  ) {
    throw new DeliveryError("A assinatura recolhida é inválida.");
  }
  if (!Array.isArray(input.belongings) || input.belongings.length > MAX_BELONGINGS) {
    throw new DeliveryError(
      `A checklist de pertences não pode ter mais de ${MAX_BELONGINGS} itens.`
    );
  }

  const belongings = input.belongings.map<DeliveryCheckinBelonging>((item) => {
    const name = typeof item?.name === "string" ? item.name.trim().slice(0, 150) : "";
    if (!name) {
      throw new DeliveryError("Cada pertence na checklist precisa de um nome.");
    }
    return {
      id: crypto.randomUUID(),
      name,
      isReturned: Boolean(item.isReturned),
    };
  });

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: woRows } = await client.query<Row>(
      `SELECT w.id, w.vehicle_id, w.customer_id, w.quote_id, w.service_title, w.estimated_hours,
              v.plate_display, v.make || ' ' || v.model AS vehicle_model,
              c.name AS customer_name, c.nif AS customer_nif
       FROM work_orders w
       JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
       JOIN customers c ON c.id = w.customer_id AND c.organization_id = w.organization_id
       WHERE w.id = $1 AND w.organization_id = $2 AND w.status = 'completed'
       FOR UPDATE OF w`,
      [input.workOrderId, organizationId]
    );
    if (woRows.length === 0) {
      throw new DeliveryError(
        "Ordem de trabalho não encontrada ou ainda não concluída — a entrega exige a OT concluída."
      );
    }
    const wo = woRows[0];

    const { rows: existing } = await client.query<Row>(
      `SELECT id FROM deliveries
       WHERE work_order_id = $1 AND organization_id = $2
       LIMIT 1`,
      [input.workOrderId, organizationId]
    );
    if (existing.length > 0) {
      await client.query("COMMIT");
      return { id: String(existing[0].id) };
    }

    const { rows } = await client.query<Row>(
      `INSERT INTO deliveries
        (organization_id, work_order_id, vehicle_id, customer_id, delivered_by_name,
         receiver_name, receiver_id_document, signature_data_url,
         belongings_returned_confirmed, belongings, notes, delivered_at, token,
         review_d30_scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), $12, NOW() + INTERVAL '30 days')
       RETURNING id`,
      [
        organizationId,
        input.workOrderId,
        String(wo.vehicle_id),
        String(wo.customer_id),
        deliveredByName,
        receiverName,
        receiverIdDocument,
        input.signatureDataUrl,
        belongings.length > 0 && belongings.every((item) => item.isReturned),
        JSON.stringify(belongings),
        notes,
        crypto.randomUUID(),
      ]
    );

    const year = new Date().getFullYear();

    // 2. Garantia digital automática se ainda não existir para esta OT
    const { rows: wtyExisting } = await client.query<Row>(
      `SELECT id FROM warranties
       WHERE work_order_id = $1 AND organization_id = $2
       LIMIT 1`,
      [input.workOrderId, organizationId]
    );
    if (wtyExisting.length === 0) {
      const { rows: matRows } = await client.query<Row>(
        `SELECT material_name, batch_number
         FROM work_order_material_usages
         WHERE work_order_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [input.workOrderId]
      );
      const { rows: qcRows } = await client.query<Row>(
        `SELECT certificate_number
         FROM qc_inspections
         WHERE work_order_id = $1
         ORDER BY approved_at DESC NULLS LAST, created_at DESC
         LIMIT 1`,
        [input.workOrderId]
      );

      const randomHex = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
      const materialName =
        (matRows[0]?.material_name as string) ||
        String(wo.service_title || "Película de Proteção Certificada X-Motion").slice(
          0,
          150
        );
      const batchNumber =
        (matRows[0]?.batch_number as string) || `LOTE-XM-${year}-${randomHex.slice(0, 4)}`;
      const qcCertificateNumber =
        (qcRows[0]?.certificate_number as string) ||
        `QC-${year}-${input.workOrderId.slice(0, 6).toUpperCase()}-PASS`;
      const certificateNumber = `WTY-${year}-${randomHex}`;
      const warrantyToken = `wty_${randomHex.toLowerCase()}`;
      const termsText =
        "Garantia oficial X-Motion contra amarelecimento, fissuração, bolhas e delaminação da película instalada, mediante cumprimento das recomendações de lavagem pH neutro e revisão pós-entrega.";

      await client.query(
        `INSERT INTO warranties
          (organization_id, vehicle_id, customer_id, work_order_id,
           material_name, batch_number, warranty_years,
           certificate_number, qc_certificate_number, terms_text,
           starts_at, expires_at, status, token)
         VALUES ($1, $2, $3, $4, $5, $6, 5, $7, $8, $9, CURRENT_DATE, (CURRENT_DATE + INTERVAL '5 years')::date, 'active', $10)`,
        [
          organizationId,
          String(wo.vehicle_id),
          String(wo.customer_id),
          input.workOrderId,
          materialName,
          batchNumber,
          certificateNumber,
          qcCertificateNumber,
          termsText,
          warrantyToken,
        ]
      );
    }

    // 3. Fatura espelho automática se ainda não existir para esta OT
    const { rows: invExisting } = await client.query<Row>(
      `SELECT id FROM invoices
       WHERE work_order_id = $1 AND organization_id = $2
       LIMIT 1`,
      [input.workOrderId, organizationId]
    );
    if (invExisting.length === 0) {
      const woQuoteId = wo.quote_id ? String(wo.quote_id) : null;
      const { rows: quoteRows } = await client.query<Row>(
        `SELECT q.id AS quote_id,
                q.deposit_status,
                q.deposit_amount,
                q.deposit_paid_at,
                q.deposit_payment_method,
                qo.name AS option_name,
                qo.taxable_base,
                qo.subtotal,
                qo.vat_rate,
                qo.vat_amount,
                qo.total_with_vat
         FROM quotes q
         JOIN quote_options qo ON qo.quote_id = q.id
         WHERE q.organization_id = $1
           AND (q.id = $2::uuid OR ($2::uuid IS NULL AND q.vehicle_id = $3::uuid))
         ORDER BY
           CASE WHEN q.id = $2::uuid THEN 0 ELSE 1 END,
           CASE WHEN qo.id = q.selected_option_id THEN 0 WHEN qo.is_recommended THEN 1 ELSE 2 END,
           q.created_at DESC
         LIMIT 1`,
        [organizationId, woQuoteId, String(wo.vehicle_id)]
      );

      let quoteId: string | null = woQuoteId;
      let vatRate = 23;
      let subtotal = 0;
      let vatAmount = 0;
      let totalAmount = 0;
      let depositStatus = "not_required";
      let depositPaidAmount = 0;
      let lineDescription = String(wo.service_title || "Serviço Técnico X-Motion").slice(
        0,
        255
      );

      if (quoteRows.length > 0) {
        const qRow = quoteRows[0];
        quoteId = String(qRow.quote_id);
        vatRate = Number(qRow.vat_rate || 23);
        subtotal = round2(Number(qRow.taxable_base || qRow.subtotal || 0));
        vatAmount = round2(Number(qRow.vat_amount || subtotal * (vatRate / 100)));
        totalAmount = round2(Number(qRow.total_with_vat || subtotal + vatAmount));
        depositStatus = String(qRow.deposit_status || "not_required");
        if (depositStatus === "paid" && Number(qRow.deposit_amount) > 0) {
          depositPaidAmount = round2(Number(qRow.deposit_amount));
        }
        if (qRow.option_name) {
          lineDescription = `${String(wo.service_title)} — ${String(qRow.option_name)}`.slice(
            0,
            255
          );
        }
      }

      if (subtotal <= 0) {
        subtotal = round2(Math.max(150, Number(wo.estimated_hours || 4) * 65));
        vatAmount = round2(subtotal * (vatRate / 100));
        totalAmount = round2(subtotal + vatAmount);
      }

      const grossTotal = totalAmount;
      const vatRateFraction = vatRate / 100;
      const hasPaidDeposit = depositStatus === "paid" && depositPaidAmount > 0;
      let invoicePaymentStatus: "paid" | "pending" = "pending";

      if (hasPaidDeposit) {
        const remainingTotal = Math.max(0, round2(grossTotal - depositPaidAmount));
        subtotal = round2(remainingTotal / (1 + vatRateFraction));
        vatAmount = round2(remainingTotal - subtotal);
        totalAmount = remainingTotal;
        invoicePaymentStatus = remainingTotal === 0 ? "paid" : "pending";
      }

      const randomShort = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
      const invoiceNumber = `FT${year}/AUTO-${randomShort}`;
      const customerName = String(wo.customer_name || receiverName).slice(0, 150);
      const customerNif = String(wo.customer_nif || "999999990").slice(0, 20);
      const vehiclePlate = String(wo.plate_display || "SEM-MAT").slice(0, 20);
      const vehicleModel = String(wo.vehicle_model || "Viatura").slice(0, 100);

      const { rows: invCreated } = await client.query<Row>(
        `INSERT INTO invoices
          (organization_id, invoice_number, work_order_id, quote_id,
           customer_id, customer_name, customer_nif,
           vehicle_plate, vehicle_model,
           subtotal, vat_rate, vat_amount, total_amount,
           payment_method, payment_status, issued_at, due_at, paid_at)
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13,
           'bank_transfer', $14, NOW(), NOW() + INTERVAL '15 days',
           CASE WHEN $14::text = 'paid' THEN NOW() ELSE NULL END
         )
         RETURNING id`,
        [
          organizationId,
          invoiceNumber,
          input.workOrderId,
          quoteId,
          String(wo.customer_id),
          customerName,
          customerNif,
          vehiclePlate,
          vehicleModel,
          subtotal.toFixed(2),
          vatRate.toFixed(2),
          vatAmount.toFixed(2),
          totalAmount.toFixed(2),
          invoicePaymentStatus,
        ]
      );

      const createdInvoiceId = String(invCreated[0].id);

      if (hasPaidDeposit) {
        await client.query(
          `INSERT INTO invoice_lines
            (invoice_id, description, quantity, unit_price, vat_rate, line_total)
           VALUES
            ($1, $2, 1.00, $3, $4, $3),
            ($1, 'Dedução de Sinal de Adjudicação liquidado', 1.00, $5, $4, $5)`,
          [
            createdInvoiceId,
            lineDescription,
            grossTotal.toFixed(2),
            vatRate.toFixed(2),
            (-depositPaidAmount).toFixed(2),
          ]
        );
      } else {
        await client.query(
          `INSERT INTO invoice_lines
            (invoice_id, description, quantity, unit_price, vat_rate, line_total)
           VALUES ($1, $2, 1.00, $3, $4, $3)`,
          [
            createdInvoiceId,
            lineDescription,
            subtotal.toFixed(2),
            vatRate.toFixed(2),
          ]
        );
      }
    }

    await client.query("COMMIT");
    return { id: String(rows[0].id) };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    if (e instanceof DeliveryError) throw e;
    throw new DeliveryError("Não foi possível registar a entrega.");
  } finally {
    client.release();
  }
}

export async function getDeliveryFeedbackByToken(
  token: string
): Promise<PublicDeliveryFeedbackData | null> {
  const cleanToken = token?.trim();
  if (!cleanToken || cleanToken.length > 100) return null;

  const client = await getDb().connect();
  try {
    await client.query("SELECT set_config('app.public_token', $1, false)", [cleanToken]);
    const { rows: orgRows } = await client.query<{ organization_id: string }>(
      `SELECT organization_id FROM deliveries WHERE token = $1 LIMIT 1`,
      [cleanToken]
    );
    if (orgRows.length === 0) return null;
    const organizationId = orgRows[0].organization_id;

    await client.query("SELECT set_config('app.current_organization_id', $1, false)", [
      organizationId,
    ]);

    const { rows } = await client.query<Row>(
      `SELECT d.id, d.token, d.delivered_at,
              d.satisfaction_rating, d.satisfaction_comment, d.satisfaction_submitted_at,
              d.google_review_clicked,
              c.name AS customer_name,
              v.plate_display, v.make || ' ' || v.model AS vehicle_model,
              w.service_title,
              os.google_review_url
       FROM deliveries d
       JOIN customers c ON c.id = d.customer_id
       JOIN vehicles v ON v.id = d.vehicle_id
       JOIN work_orders w ON w.id = d.work_order_id
       LEFT JOIN organization_settings os ON os.organization_id = d.organization_id
       WHERE d.token = $1 AND d.organization_id = $2
       LIMIT 1`,
      [cleanToken, organizationId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      deliveryId: String(r.id),
      token: String(r.token),
      customerName: String(r.customer_name ?? ""),
      vehiclePlate: String(r.plate_display ?? ""),
      vehicleModel: String(r.vehicle_model ?? ""),
      serviceTitle: String(r.service_title ?? "Serviço X-Motion"),
      deliveredAt: iso(r.delivered_at),
      satisfactionRating:
        r.satisfaction_rating != null ? Number(r.satisfaction_rating) : null,
      satisfactionComment: (r.satisfaction_comment as string) ?? null,
      satisfactionSubmittedAt: r.satisfaction_submitted_at
        ? iso(r.satisfaction_submitted_at)
        : null,
      googleReviewClicked: Boolean(r.google_review_clicked),
      googleReviewUrl:
        (r.google_review_url as string)?.trim() || DEFAULT_GOOGLE_REVIEW_URL,
    };
  } finally {
    await client.query("RESET app.public_token").catch(() => {});
    await restoreBootstrapOrg(client).catch(() => {});
    client.release();
  }
}

export async function submitDeliveryFeedback(
  token: string,
  input: {
    rating: number;
    comment?: string;
    googleReviewClicked?: boolean;
  }
): Promise<PublicDeliveryFeedbackData> {
  const cleanToken = token?.trim();
  if (!cleanToken || cleanToken.length > 100) {
    throw new DeliveryError("Token de entrega inválido.");
  }
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new DeliveryError("Escolhe uma classificação de 1 a 5 estrelas.");
  }
  const comment = input.comment?.trim().slice(0, 2000) || null;

  const client = await getDb().connect();
  try {
    await client.query("SELECT set_config('app.public_token', $1, false)", [cleanToken]);
    const { rows: orgRows } = await client.query<{ organization_id: string }>(
      `SELECT organization_id FROM deliveries WHERE token = $1 LIMIT 1`,
      [cleanToken]
    );
    if (orgRows.length === 0) {
      throw new DeliveryError("Entrega não encontrada.");
    }
    const organizationId = orgRows[0].organization_id;
    await client.query("SELECT set_config('app.current_organization_id', $1, false)", [
      organizationId,
    ]);

    await client.query(
      `UPDATE deliveries
       SET satisfaction_rating = $2,
           satisfaction_comment = $3,
           satisfaction_submitted_at = COALESCE(satisfaction_submitted_at, NOW()),
           google_review_clicked = CASE
             WHEN $4::boolean IS TRUE THEN TRUE
             ELSE COALESCE(google_review_clicked, FALSE)
           END
       WHERE token = $1 AND organization_id = $5`,
      [cleanToken, rating, comment, Boolean(input.googleReviewClicked), organizationId]
    );
  } finally {
    await client.query("RESET app.public_token").catch(() => {});
    await restoreBootstrapOrg(client).catch(() => {});
    client.release();
  }

  const updated = await getDeliveryFeedbackByToken(cleanToken);
  if (!updated) {
    throw new DeliveryError("Não foi possível carregar o feedback submetido.");
  }
  return updated;
}

export async function markAftersalesStep(
  organizationId: string,
  deliveryId: string,
  step: "d7_sent" | "d30_completed",
  notes?: string
): Promise<void> {
  if (!isUuid(organizationId) || !isUuid(deliveryId)) {
    throw new DeliveryError("Entrega inválida.");
  }
  const db = getDb();
  if (step === "d7_sent") {
    const { rows } = await db.query(
      `UPDATE deliveries
       SET followup_d7_sent_at = COALESCE(followup_d7_sent_at, NOW())
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [deliveryId, organizationId]
    );
    if (rows.length === 0) throw new DeliveryError("Entrega não encontrada.");
  } else if (step === "d30_completed") {
    const cleanNotes = notes?.trim().slice(0, 1000) || null;
    const { rows } = await db.query(
      `UPDATE deliveries
       SET review_d30_completed_at = COALESCE(review_d30_completed_at, NOW()),
           review_d30_notes = COALESCE($3, review_d30_notes)
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [deliveryId, organizationId, cleanNotes]
    );
    if (rows.length === 0) throw new DeliveryError("Entrega não encontrada.");
  } else {
    throw new DeliveryError("Passo de pós-venda inválido.");
  }
}

export async function markInvoicePaid(
  organizationId: string,
  invoiceId: string,
  payment?: InvoicePaymentInput,
  profileId?: string
): Promise<void> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<Row>(
      `UPDATE invoices
       SET payment_status = 'paid',
           paid_at = COALESCE($3::timestamptz, NOW()),
           payment_method = COALESCE($4, payment_method)
       WHERE id = $1 AND organization_id = $2 AND payment_status <> 'paid'
       RETURNING id, invoice_number, total_amount, vat_amount, customer_name`,
      [invoiceId, organizationId, payment?.occurredAt ?? null, payment?.method ?? null]
    );
    if (rows.length === 0) {
      throw new Error("Fatura não encontrada ou já paga.");
    }
    const inv = rows[0];
    await client.query(
      `INSERT INTO transactions
        (organization_id, type, occurred_at, amount, bank_account_id, description,
         payment_method, reference, vat_amount, source_type, source_id, created_by)
       VALUES
         ($1,'income',COALESCE($2::timestamptz, NOW()),$3,NULL,$4,$5,$6,$7,'invoice_payment',$8,$9)`,
      [
        organizationId,
        payment?.occurredAt ?? null,
        Number(inv.total_amount).toFixed(2),
        `Cobrança ${inv.invoice_number} — ${inv.customer_name}`,
        payment?.method ?? "bank_transfer",
        payment?.reference?.trim() || null,
        Number(inv.vat_amount ?? 0).toFixed(2),
        invoiceId,
        profileId ?? null,
      ]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
