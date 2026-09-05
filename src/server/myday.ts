import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";

export interface MyDayTask {
  workOrderId: string;
  workOrderNumber: string;
  vehicleModel: string;
  plate: string;
  serviceTitle: string;
  bayName: string | null;
  progress: number;
  currentPhaseName: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  materialName: string | null;
  batchNumber: string | null;
  estimatedHours: number;
  actualHours: number;
  checkinToken: string | null;
}

export interface MyDayAppointment {
  id: string;
  time: string;
  vehicleModel: string;
  plate: string;
  bayName: string;
  estimatedHours: number;
  status: string;
}

export interface MyDayData {
  technicianName: string;
  activeTask: MyDayTask | null;
  upcoming: MyDayAppointment[];
}

export async function getMyDayData(
  technicianName: string
): Promise<MyDayData> {
  const db = getDb();
  const organizationId = await getPrimaryOrganizationId();

  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.progress_percentage,
            w.estimated_hours, w.actual_hours_spent,
            v.make || ' ' || v.model AS vehicle_model, v.plate_display AS plate,
            b.name AS bay_name, ch.token AS checkin_token,
            (SELECT count(*)::int FROM work_order_phases p2 WHERE p2.work_order_id = w.id) AS total_phases,
            (SELECT count(*)::int FROM work_order_phases p3
              WHERE p3.work_order_id = w.id AND p3.status = 'completed') AS done_phases
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     LEFT JOIN bays b ON b.default_technician_id = w.primary_technician_id
     LEFT JOIN checkins ch ON ch.id = w.checkin_id
     WHERE w.organization_id = $1
       AND w.status IN ('in_progress','waiting_parts')
       AND w.primary_technician_id = (SELECT id FROM profiles WHERE name = $2 LIMIT 1)
     ORDER BY w.started_at
     LIMIT 1`,
    [organizationId, technicianName]
  );

  let activeTask: MyDayTask | null = null;
  if (woRows.length > 0) {
    const woId = String(woRows[0].id);
    const { rows: phaseRows } = await db.query<Row>(
      `SELECT id, phase_key, name, status, order_index FROM work_order_phases
       WHERE work_order_id = $1 ORDER BY order_index`,
      [woId]
    );
    const current =
      phaseRows.find((p) => p.status === "in_progress") ??
      phaseRows.find((p) => p.status === "pending");

    const { rows: matRows } = await db.query<Row>(
      `SELECT material_name, batch_number FROM work_order_material_usages
       WHERE work_order_id = $1 LIMIT 1`,
      [woId]
    );

    activeTask = {
      workOrderId: woId,
      workOrderNumber: String(woRows[0].work_order_number),
      vehicleModel: String(woRows[0].vehicle_model),
      plate: String(woRows[0].plate),
      serviceTitle: String(woRows[0].service_title),
      bayName: (woRows[0].bay_name as string) ?? null,
      progress: Number(woRows[0].progress_percentage),
      currentPhaseName: current ? String(current.name) : null,
      currentPhaseIndex: current ? Number(current.order_index) + 1 : 0,
      totalPhases: Number(woRows[0].total_phases),
      materialName: matRows[0] ? String(matRows[0].material_name) : null,
      batchNumber: matRows[0] ? String(matRows[0].batch_number) : null,
      estimatedHours: Number(woRows[0].estimated_hours),
      actualHours: Number(woRows[0].actual_hours_spent),
      checkinToken: (woRows[0].checkin_token as string) ?? null,
    };
  }

  const { rows: apptRows } = await db.query<Row>(
    `SELECT a.id, a.start_time, a.estimated_hours, a.status,
            v.make || ' ' || v.model AS vehicle_model, v.plate_display AS plate, b.name AS bay_name
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN bays b ON b.id = a.bay_id
     WHERE a.organization_id = $1
       AND a.technician_id = (SELECT id FROM profiles WHERE name = $2 LIMIT 1)
       AND a.start_time >= date_trunc('day', NOW())
       AND a.start_time < date_trunc('day', NOW()) + interval '1 day'
       AND a.status <> 'cancelled'
     ORDER BY a.start_time`,
    [organizationId, technicianName]
  );

  const upcoming: MyDayAppointment[] = apptRows.map((r) => ({
    id: String(r.id),
    time: new Date(r.start_time as string).toTimeString().slice(0, 5),
    vehicleModel: String(r.vehicle_model),
    plate: String(r.plate),
    bayName: String(r.bay_name),
    estimatedHours: Number(r.estimated_hours),
    status: String(r.status),
  }));

  return { technicianName, activeTask, upcoming };
}

type Row = Record<string, unknown>;
