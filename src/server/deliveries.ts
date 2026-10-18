import { getDb } from "@/lib/db";
import { isUuid } from "@/domains/quotes/validation";
import {
  Delivery,
  DeliveryCheckinBelonging,
  InvoicePaymentInput,
} from "@/domains/finance/types";

type Row = Record<string, unknown>;

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

function mapDelivery(row: Row): Delivery {
  return {
    id: String(row.id),
    workOrderId: String(row.work_order_id),
    vehiclePlate: String(row.plate_display ?? row.vehicle_plate ?? ""),
    vehicleModel: String(row.vehicle_model_full ?? ""),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name ?? ""),
    deliveredByName: String(row.delivered_by_name),
    receiverName: String(row.receiver_name),
    receiverIdDocument: (row.receiver_id_document as string) ?? undefined,
    signatureDataUrl: (row.signature_data_url as string) ?? undefined,
    belongingsReturnedConfirmed: Boolean(row.belongings_returned_confirmed),
    belongings: mapBelongings(row.belongings),
    notes: (row.notes as string) ?? undefined,
    deliveredAt: iso(row.delivered_at),
    token: String(row.token),
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
      plateDisplay: String(r.plate_display),
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

export async function listDeliveries(organizationId: string): Promise<Delivery[]> {
  if (!isUuid(organizationId)) return [];
  const { rows } = await getDb().query<Row>(
    `SELECT d.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name
     FROM deliveries d
     JOIN vehicles v ON v.id = d.vehicle_id AND v.organization_id = d.organization_id
     JOIN customers c ON c.id = d.customer_id AND c.organization_id = d.organization_id
     WHERE d.organization_id = $1
     ORDER BY d.delivered_at DESC`,
    [organizationId]
  );
  return rows.map(mapDelivery);
}

export async function getDeliveryById(
  organizationId: string,
  deliveryId: string
): Promise<Delivery | null> {
  if (!isUuid(organizationId) || !isUuid(deliveryId)) return null;
  const { rows } = await getDb().query<Row>(
    `SELECT d.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name
     FROM deliveries d
     JOIN vehicles v ON v.id = d.vehicle_id AND v.organization_id = d.organization_id
     JOIN customers c ON c.id = d.customer_id AND c.organization_id = d.organization_id
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
      `SELECT w.id, w.vehicle_id, w.customer_id
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
         belongings_returned_confirmed, belongings, notes, delivered_at, token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), $12)
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
