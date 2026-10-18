import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requirePublicToken } from "@/server/auth";
import {
  QcCertificateView,
  type QcCertificateItem,
  type QcCertificatePublicData,
} from "./QcCertificateView";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function formatLisbonDateTime(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateOnly(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatLisbonDateTime(value);
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function mapItemStatus(value: unknown): QcCertificateItem["status"] {
  return value === "pass" || value === "fail" ? value : "na";
}

export default async function QcCertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = await params;
  if (!certificateNumber || certificateNumber.length > 100) {
    notFound();
  }

  const { organizationId } = await requirePublicToken(
    "qc_certificate",
    certificateNumber
  );

  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT q.id, q.inspector_name, q.status, q.overall_notes,
            q.approved_at, q.created_at,
            w.id AS work_order_id, w.work_order_number, w.service_title,
            v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.name AS customer_name
     FROM qc_inspections q
     JOIN work_orders w ON w.id = q.work_order_id
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     WHERE q.certificate_number = $1 AND w.organization_id = $2
     LIMIT 1`,
    [certificateNumber, organizationId]
  );
  const row = rows[0];
  if (!row) {
    notFound();
  }

  const inspectionId = String(row.id);
  const workOrderId = String(row.work_order_id);

  const [itemsRes, materialRes, warrantyRes] = await Promise.all([
    db.query<Row>(
      `SELECT id, criterion_name, category, status
       FROM qc_items
       WHERE inspection_id = $1
       ORDER BY category, criterion_name`,
      [inspectionId]
    ),
    db.query<Row>(
      `SELECT material_name, batch_number
       FROM work_order_material_usages
       WHERE work_order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [workOrderId]
    ),
    db.query<Row>(
      `SELECT warranty_years, starts_at, expires_at
       FROM warranties
       WHERE organization_id = $1 AND work_order_id = $2
       ORDER BY starts_at DESC
       LIMIT 1`,
      [organizationId, workOrderId]
    ),
  ]);

  const rawStatus = String(row.status);
  const status: QcCertificatePublicData["status"] =
    rawStatus === "passed" || rawStatus === "failed" || rawStatus === "in_rework"
      ? rawStatus
      : "in_rework";

  const material = materialRes.rows[0];
  const warranty = warrantyRes.rows[0];

  const certificate: QcCertificatePublicData = {
    certificateNumber,
    status,
    inspectorName: String(row.inspector_name),
    createdAt: formatLisbonDateTime(row.created_at) ?? "",
    approvedAt: formatLisbonDateTime(row.approved_at),
    overallNotes: (row.overall_notes as string) ?? null,
    workOrderNumber: String(row.work_order_number),
    serviceTitle: String(row.service_title),
    vehiclePlate: String(row.plate_display),
    vehicleModel: String(row.vehicle_model),
    customerName: String(row.customer_name),
    items: itemsRes.rows.map((item) => ({
      id: String(item.id),
      criterionName: String(item.criterion_name),
      category: String(item.category),
      status: mapItemStatus(item.status),
    })),
    materialName: material ? String(material.material_name) : null,
    batchNumber: material ? String(material.batch_number) : null,
    warrantyYears: warranty ? Number(warranty.warranty_years) : null,
    warrantyStartsAt: warranty ? formatDateOnly(warranty.starts_at) : null,
    warrantyExpiresAt: warranty ? formatDateOnly(warranty.expires_at) : null,
  };

  return <QcCertificateView certificate={certificate} />;
}
