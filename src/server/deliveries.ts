import { getDb } from "@/lib/db";
import { DeliveryCheckinBelonging } from "@/domains/finance/types";

type Row = Record<string, unknown>;

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
  belongings: { id: string; itemName: string }[];
}

/** Ordens concluídas com QC aprovado e ainda sem entrega registada. */
export async function listDeliveryCandidates(
  organizationId: string
): Promise<DeliveryCandidate[]> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT w.id AS work_order_id, w.work_order_number, w.service_title,
            v.id AS vehicle_id, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.id AS customer_id, c.name AS customer_name,
            qc.certificate_number AS qc_certificate_number,
            (SELECT ck.belongings FROM checkins ck
             WHERE ck.vehicle_id = v.id AND ck.belongings IS NOT NULL
             ORDER BY ck.created_at DESC LIMIT 1) AS belongings
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     LEFT JOIN qc_inspections qc ON qc.work_order_id = w.id AND qc.status = 'passed'
     WHERE w.organization_id = $1
       AND w.status = 'completed'
       AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.work_order_id = w.id)
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
        .map((b, idx) => ({ id: `bel-${idx}`, itemName: String(b.itemName) })),
    };
  });
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

export async function createDelivery(
  organizationId: string,
  input: DeliveryCreateInput
): Promise<{ id: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: woRows } = await client.query<Row>(
      `SELECT id, vehicle_id, customer_id FROM work_orders
       WHERE id = $1 AND organization_id = $2 AND status = 'completed'`,
      [input.workOrderId, organizationId]
    );
    if (woRows.length === 0) {
      throw new Error(
        "Ordem de trabalho não encontrada ou ainda não concluída — a entrega exige a OT concluída."
      );
    }
    const wo = woRows[0];

    const { rows: existing } = await client.query<Row>(
      `SELECT id FROM deliveries WHERE work_order_id = $1 LIMIT 1`,
      [input.workOrderId]
    );
    if (existing.length > 0) {
      await client.query("COMMIT");
      return { id: String(existing[0].id) };
    }

    const belongingsJson = input.belongings.map<DeliveryCheckinBelonging>((b) => ({
      id: `bel-${Math.random().toString(36).slice(2, 8)}`,
      name: b.name,
      isReturned: b.isReturned,
    }));

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
        input.deliveredByName,
        input.receiverName,
        input.receiverIdDocument ?? null,
        input.signatureDataUrl || null,
        belongingsJson.every((b) => b.isReturned),
        JSON.stringify(belongingsJson),
        input.notes ?? null,
        crypto.randomUUID(),
      ]
    );
    await client.query("COMMIT");
    return { id: String(rows[0].id) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function markInvoicePaid(
  organizationId: string,
  invoiceId: string
): Promise<void> {
  const { rowCount } = await getDb().query(
    `UPDATE invoices SET payment_status = 'paid', paid_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND payment_status <> 'paid'`,
    [invoiceId, organizationId]
  );
  if (rowCount === 0) {
    throw new Error("Fatura não encontrada ou já paga.");
  }
}
