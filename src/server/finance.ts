import { getDb } from "@/lib/db";
import {
  Delivery,
  Invoice,
  PassportEvent,
  PassportFullRecord,
  WarrantyCertificate,
  WarrantyMaintenanceRule,
} from "@/domains/finance/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function listInvoices(organizationId: string): Promise<Invoice[]> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT i.*, v.make || ' ' || v.model AS vehicle_model_full
     FROM invoices i JOIN vehicles v ON v.plate_display = i.vehicle_plate
     WHERE i.organization_id = $1
     ORDER BY i.issued_at DESC`,
    [organizationId]
  );
  if (rows.length === 0) return [];

  const { rows: lineRows } = await db.query<Row>(
    `SELECT il.* FROM invoice_lines il
     JOIN invoices i ON i.id = il.invoice_id WHERE i.organization_id = $1`,
    [organizationId]
  );

  return rows.map((r) => {
    const id = String(r.id);
    return {
      id,
      invoiceNumber: String(r.invoice_number),
      workOrderId: String(r.work_order_id ?? ""),
      quoteId: undefined,
      customerId: String(r.customer_id),
      customerName: String(r.customer_name),
      customerNif: String(r.customer_nif),
      customerAddress: undefined,
      vehiclePlate: String(r.vehicle_plate),
      vehicleModel: String(r.vehicle_model),
      subtotal: num(r.subtotal),
      vatRate: num(r.vat_rate),
      vatAmount: num(r.vat_amount),
      totalAmount: num(r.total_amount),
      paymentMethod: (r.payment_method as Invoice["paymentMethod"]) ?? "bank_transfer",
      paymentStatus: (r.payment_status as Invoice["paymentStatus"]) ?? "pending",
      issuedAt: iso(r.issued_at),
      dueAt: iso(r.due_at).slice(0, 10),
      paidAt: r.paid_at ? iso(r.paid_at) : undefined,
      lines: lineRows
        .filter((l) => String(l.invoice_id) === id)
        .map((l) => ({
          id: String(l.id),
          description: String(l.description),
          quantity: num(l.quantity),
          unitPrice: num(l.unit_price),
          vatRate: num(l.vat_rate),
          lineTotal: num(l.line_total),
        })),
    };
  });
}

export async function getInvoiceById(
  organizationId: string,
  invoiceId: string
): Promise<Invoice | null> {
  const invoices = await listInvoices(organizationId);
  return invoices.find((i) => i.id === invoiceId) ?? null;
}

export async function listDeliveries(organizationId: string): Promise<Delivery[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT d.*, v.make || ' ' || v.model AS vehicle_model_full
     FROM deliveries d JOIN vehicles v ON v.id = d.vehicle_id
     WHERE d.organization_id = $1 ORDER BY d.delivered_at DESC`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    workOrderId: String(r.work_order_id),
    vehiclePlate: String(r.vehicle_plate ?? ""),
    vehicleModel: String(r.vehicle_model_full ?? ""),
    customerId: String(r.customer_id),
    customerName: "", // opcional na listagem
    deliveredByName: String(r.delivered_by_name),
    receiverName: String(r.receiver_name),
    receiverIdDocument: (r.receiver_id_document as string) ?? undefined,
    signatureDataUrl: (r.signature_data_url as string) ?? undefined,
    belongingsReturnedConfirmed: Boolean(r.belongings_returned_confirmed),
    belongings: [],
    notes: (r.notes as string) ?? undefined,
    deliveredAt: iso(r.delivered_at),
    token: String(r.token),
  }));
}

export async function getDeliveryById(
  organizationId: string,
  deliveryId: string
): Promise<Delivery | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT d.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name
     FROM deliveries d
     JOIN vehicles v ON v.id = d.vehicle_id
     JOIN customers c ON c.id = d.customer_id
     WHERE d.organization_id = $1 AND d.id = $2`,
    [organizationId, deliveryId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: String(r.id),
    workOrderId: String(r.work_order_id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model_full ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    deliveredByName: String(r.delivered_by_name),
    receiverName: String(r.receiver_name),
    receiverIdDocument: (r.receiver_id_document as string) ?? undefined,
    signatureDataUrl: (r.signature_data_url as string) ?? undefined,
    belongingsReturnedConfirmed: Boolean(r.belongings_returned_confirmed),
    belongings: [],
    notes: (r.notes as string) ?? undefined,
    deliveredAt: iso(r.delivered_at),
    token: String(r.token),
  };
}

const WARRANTY_RULES: WarrantyMaintenanceRule[] = [
  { id: "m1", title: "Primeira lavagem", description: "Apenas 48h após a aplicação, com shampoo neutro pH balanceado.", isCritical: true },
  { id: "m2", title: "Lavagem regular", description: "Método dos dois baldes e microfibras limpas. Nunca usar escovas automáticas.", isCritical: false },
  { id: "m3", title: "Remoção de contaminantes", description: "Remover excrementos de aves, seiva e resina no máximo em 48h.", isCritical: true },
  { id: "m4", title: "Revisão anual", description: "Inspeção anual gratuita nas instalações X-Motion.", isCritical: false },
];

export async function listWarranties(organizationId: string): Promise<WarrantyCertificate[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT w.*, v.make || ' ' || v.model AS vehicle_model_full, v.plate_display,
            c.name AS customer_name
     FROM warranties w
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     WHERE w.organization_id = $1 ORDER BY w.starts_at DESC`,
    [organizationId]
  );
  return rows.map(mapWarranty);
}

function mapWarranty(r: Row): WarrantyCertificate {
  return {
    id: String(r.id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model_full ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    workOrderId: String(r.work_order_id),
    materialName: String(r.material_name),
    batchNumber: String(r.batch_number),
    warrantyYears: num(r.warranty_years),
    certificateNumber: String(r.certificate_number),
    qcCertificateNumber: String(r.qc_certificate_number),
    termsText: (r.terms_text as string) ?? "",
    maintenanceRules: WARRANTY_RULES,
    startsAt: String(r.starts_at).slice(0, 10),
    expiresAt: String(r.expires_at).slice(0, 10),
    status: (r.status as WarrantyCertificate["status"]) ?? "active",
    token: String(r.token),
  };
}

export async function getWarrantyById(
  organizationId: string,
  warrantyId: string
): Promise<WarrantyCertificate | null> {
  const { rows } = await getDb().query<Row>(
    `SELECT w.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model_full,
            c.name AS customer_name
     FROM warranties w
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     WHERE w.organization_id = $1 AND w.id = $2`,
    [organizationId, warrantyId]
  );
  return rows.length > 0 ? mapWarranty(rows[0]) : null;
}

export async function getWarrantyByToken(token: string): Promise<WarrantyCertificate | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT organization_id FROM warranties WHERE token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return getWarrantyById(String(rows[0].organization_id), token);
}

export async function getPassportByPlate(
  organizationId: string,
  plate: string
): Promise<PassportFullRecord | null> {
  const db = getDb();
  const { rows: vehicleRows } = await db.query<Row>(
    `SELECT v.*, c.name AS owner_name, c.type AS owner_type
     FROM vehicles v
     LEFT JOIN vehicle_customer_links l ON l.vehicle_id = v.id AND l.is_current
     LEFT JOIN customers c ON c.id = l.customer_id
     WHERE v.organization_id = $1 AND v.plate_normalized = $2
     LIMIT 1`,
    [organizationId, plate.replace(/[\s-]/g, "").toUpperCase()]
  );
  if (vehicleRows.length === 0) return null;
  const v = vehicleRows[0];
  const vehicleId = String(v.id);

  const events: PassportEvent[] = [];
  const { rows: qRows } = await db.query<Row>(
    `SELECT id, quote_number, status, created_at FROM quotes WHERE vehicle_id = $1`,
    [vehicleId]
  );
  for (const r of qRows) {
    events.push({ id: `q-${r.id}`, date: iso(r.created_at), type: "quote", title: `Orçamento ${r.quote_number}`, subtitle: `Estado: ${r.status}`, description: "Proposta comercial emitida.", badgeText: String(r.status), badgeVariant: "default", linkHref: `/quotes/${r.id}` });
  }
  const { rows: ckRows } = await db.query<Row>(
    `SELECT id, type, mileage, created_at FROM checkins WHERE vehicle_id = $1`,
    [vehicleId]
  );
  for (const r of ckRows) {
    events.push({ id: `ck-${r.id}`, date: iso(r.created_at), type: "checkin", title: r.type === "entry" ? "Check-in de entrada" : "Check-in de saída", subtitle: `${Number(r.mileage)} km`, description: "Inspeção fotográfica registada.", badgeText: r.type === "entry" ? "Entrada" : "Saída", linkHref: `/checkins/${r.id}` });
  }
  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.status, w.completed_at, w.created_at,
            qc.status AS qc_status, qc.certificate_number, qc.approved_at
     FROM work_orders w
     LEFT JOIN qc_inspections qc ON qc.work_order_id = w.id
     WHERE w.vehicle_id = $1`,
    [vehicleId]
  );
  for (const r of woRows) {
    events.push({ id: `wo-${r.id}`, date: iso(r.created_at), type: "work_order", title: `Ordem ${r.work_order_number}`, subtitle: String(r.service_title), description: `Estado: ${r.status}`, badgeText: String(r.status), badgeVariant: r.status === "completed" ? "success" : "gold", linkHref: `/production/${r.id}` });
    if (r.qc_status === "passed") {
      events.push({ id: `qc-${r.id}`, date: iso(r.approved_at ?? r.completed_at ?? r.created_at), type: "qc_pass", title: "QC Aprovado", subtitle: `Certificado ${r.certificate_number ?? ""}`, description: "Controlo de qualidade aprovado.", badgeText: "QC", badgeVariant: "success" });
    }
  }
  const { rows: invRows } = await db.query<Row>(
    `SELECT id, invoice_number, total_amount, payment_status, issued_at FROM invoices
     WHERE vehicle_plate = (SELECT plate_display FROM vehicles WHERE id = $1)`,
    [vehicleId]
  );
  for (const r of invRows) {
    events.push({ id: `inv-${r.id}`, date: iso(r.issued_at), type: "invoice", title: `Fatura ${r.invoice_number}`, subtitle: `${Number(r.total_amount).toFixed(2)} €`, description: `Pagamento: ${r.payment_status}`, badgeText: String(r.payment_status), badgeVariant: r.payment_status === "paid" ? "success" : "gold" });
  }
  const { rows: wtyRows } = await db.query<Row>(
    `SELECT id, certificate_number, material_name, warranty_years, starts_at, expires_at, batch_number FROM warranties WHERE vehicle_id = $1`,
    [vehicleId]
  );
  for (const r of wtyRows) {
    events.push({ id: `wty-${r.id}`, date: String(r.starts_at), type: "warranty", title: `Garantia ${r.warranty_years} anos`, subtitle: `Certificado ${r.certificate_number}`, description: `Material ${r.material_name}, lote ${r.batch_number}.`, badgeText: "Garantia", badgeVariant: "success", linkHref: `/warranties/certificate/wty-2026-001` });
  }

  events.sort((a, b) => b.date.localeCompare(a.date));

  const activeWarranty = wtyRows.at(0);

  return {
    vehicleId,
    plate: String(v.plate_display),
    make: String(v.make),
    model: String(v.model),
    generationYear: num(v.generation_year),
    bodyType: String(v.body_type),
    colorName: String(v.original_color_name),
    vin: (v.vin as string) ?? "",
    currentMileage: num(v.current_mileage),
    ownerName: (v.owner_name as string) ?? "Sem proprietário registado",
    ownerType: (v.owner_type as "individual" | "business") ?? "individual",
    events,
    activeWarranty: activeWarranty
      ? {
          materialName: String(activeWarranty.material_name),
          batchNumber: String(activeWarranty.batch_number),
          warrantyYears: num(activeWarranty.warranty_years),
          expiresAt: String(activeWarranty.expires_at).slice(0, 10),
          certificateNumber: String(activeWarranty.certificate_number),
        }
      : undefined,
  };
}
