import { getDb } from "@/lib/db";

type Row = Record<string, unknown>;

export interface ShopFloorAppointment {
  id: string;
  time: string;
  endTime: string;
  plate: string;
  vehicle: string;
  customer: string;
  bay: string;
  technician: string;
  status: string;
}

export interface ShopFloorWorkOrder {
  id: string;
  number: string;
  plate: string;
  vehicle: string;
  service: string;
  status: string;
  progress: number;
  technician: string;
}

export interface ShopFloorData {
  appointments: ShopFloorAppointment[];
  workOrders: ShopFloorWorkOrder[];
  quotesAwaiting: number;
  completedToday: number;
  qcPending: number;
  appointmentsToday: number;
}

const STATUS_PT: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "Em curso",
  waiting_parts: "À espera de peças",
  quality_control: "Controlo de qualidade",
  completed: "Concluída",
  draft: "Por iniciar",
  cancelled: "Cancelada",
};

export function statusPt(status: string): string {
  return STATUS_PT[status] ?? status;
}

export async function getShopFloorData(
  organizationId: string
): Promise<ShopFloorData> {
  const db = getDb();

  const { rows: apptRows } = await db.query<Row>(
    `SELECT a.id, a.start_time, a.end_time, a.status,
            v.plate_display, v.make || ' ' || v.model AS vehicle,
            c.name AS customer, b.name AS bay, p.name AS technician
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN customers c ON c.id = a.customer_id
     JOIN bays b ON b.id = a.bay_id
     LEFT JOIN profiles p ON p.id = a.technician_id
     WHERE a.organization_id = $1
       AND a.start_time >= date_trunc('day', NOW())
       AND a.start_time < date_trunc('day', NOW()) + interval '1 day'
     ORDER BY a.start_time`,
    [organizationId]
  );

  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.status,
            w.progress_percentage,
            v.plate_display, v.make || ' ' || v.model AS vehicle,
            p.name AS technician
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     LEFT JOIN profiles p ON p.id = w.primary_technician_id
     WHERE w.organization_id = $1 AND w.status <> 'completed'
     ORDER BY w.started_at`,
    [organizationId]
  );

  const { rows: countRows } = await db.query<Row>(
    `SELECT
       (SELECT count(*)::int FROM quotes
         WHERE organization_id = $1 AND status IN ('sent','viewed')) AS quotes_awaiting,
       (SELECT count(*)::int FROM work_orders
         WHERE organization_id = $1 AND status = 'completed'
           AND completed_at >= date_trunc('day', NOW())) AS completed_today,
       (SELECT count(*)::int FROM work_orders
         WHERE organization_id = $1 AND status = 'quality_control') AS qc_pending,
       (SELECT count(*)::int FROM appointments
         WHERE organization_id = $1 AND status <> 'cancelled'
           AND start_time >= date_trunc('day', NOW())
           AND start_time < date_trunc('day', NOW()) + interval '1 day') AS appointments_today`,
    [organizationId]
  );
  const counts = countRows[0];

  return {
    appointments: apptRows.map((r) => ({
      id: String(r.id),
      time: new Date(r.start_time as Date).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: new Date(r.end_time as Date).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      plate: String(r.plate_display),
      vehicle: String(r.vehicle),
      customer: String(r.customer),
      bay: String(r.bay),
      technician: (r.technician as string) ?? "—",
      status: statusPt(String(r.status)),
    })),
    workOrders: woRows.map((r) => ({
      id: String(r.id),
      number: String(r.work_order_number),
      plate: String(r.plate_display),
      vehicle: String(r.vehicle),
      service: String(r.service_title),
      status: statusPt(String(r.status)),
      progress: Number(r.progress_percentage),
      technician: (r.technician as string) ?? "Sem técnico",
    })),
    quotesAwaiting: Number(counts.quotes_awaiting),
    completedToday: Number(counts.completed_today),
    qcPending: Number(counts.qc_pending),
    appointmentsToday: Number(counts.appointments_today),
  };
}
