import { getDb } from "@/lib/db";
import {
  addCivilDays,
  civilDateFromKey,
  civilDateKey,
  todayWorkshopDateKey,
  workshopIsoFromWallTime,
  workshopTime,
} from "@/domains/calendar/datetime";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const APPOINTMENT_STATUS_PT: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  in_progress: "Em curso",
  completed: "Concluída",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
};

function assertUuid(value: string, label: string): void {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

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
  organizationId: string,
  technicianId: string,
  technicianName: string
): Promise<MyDayData> {
  assertUuid(organizationId, "Organização");
  assertUuid(technicianId, "Técnico");
  const db = getDb();

  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.progress_percentage,
            w.estimated_hours, w.actual_hours_spent,
            v.make || ' ' || v.model AS vehicle_model, v.plate_display AS plate,
            bay.name AS bay_name, ch.token AS checkin_token,
            (SELECT count(*)::int FROM work_order_phases p2 WHERE p2.work_order_id = w.id) AS total_phases
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
     LEFT JOIN checkins ch ON ch.id = w.checkin_id AND ch.organization_id = w.organization_id
     LEFT JOIN LATERAL (
       SELECT b.name
       FROM appointments a
       JOIN bays b ON b.id = a.bay_id AND b.organization_id = a.organization_id
       WHERE a.organization_id = w.organization_id
         AND a.vehicle_id = w.vehicle_id
         AND a.technician_id = w.primary_technician_id
       ORDER BY a.start_time DESC
       LIMIT 1
     ) bay ON TRUE
     WHERE w.organization_id = $1
       AND w.status IN ('in_progress','waiting_parts')
       AND w.primary_technician_id = $2
     ORDER BY w.started_at NULLS LAST
     LIMIT 1`,
    [organizationId, technicianId]
  );

  let activeTask: MyDayTask | null = null;
  if (woRows.length > 0) {
    const woId = String(woRows[0].id);
    const { rows: phaseRows } = await db.query<Row>(
      `SELECT p.id, p.phase_key, p.name, p.status, p.order_index
       FROM work_order_phases p
       JOIN work_orders w ON w.id = p.work_order_id AND w.organization_id = $2
       WHERE p.work_order_id = $1
       ORDER BY p.order_index`,
      [woId, organizationId]
    );
    const current =
      phaseRows.find((p) => p.status === "in_progress") ??
      phaseRows.find((p) => p.status === "pending");

    const { rows: matRows } = await db.query<Row>(
      `SELECT mu.material_name, mu.batch_number
       FROM work_order_material_usages mu
       JOIN work_orders w ON w.id = mu.work_order_id AND w.organization_id = $2
       WHERE mu.work_order_id = $1
       ORDER BY mu.created_at
       LIMIT 1`,
      [woId, organizationId]
    );

    const progress = Number(woRows[0].progress_percentage);
    activeTask = {
      workOrderId: woId,
      workOrderNumber: String(woRows[0].work_order_number),
      vehicleModel: String(woRows[0].vehicle_model),
      plate: String(woRows[0].plate),
      serviceTitle: String(woRows[0].service_title),
      bayName: (woRows[0].bay_name as string) ?? null,
      progress: Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0,
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

  const todayKey = todayWorkshopDateKey();
  const startIso = workshopIsoFromWallTime(todayKey, "00:00");
  const tomorrowKey = civilDateKey(addCivilDays(civilDateFromKey(todayKey), 1));
  const endIso = workshopIsoFromWallTime(tomorrowKey, "00:00");

  const { rows: apptRows } = await db.query<Row>(
    `SELECT a.id, a.start_time, a.estimated_hours, a.status,
            v.make || ' ' || v.model AS vehicle_model, v.plate_display AS plate, b.name AS bay_name
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id AND v.organization_id = a.organization_id
     JOIN bays b ON b.id = a.bay_id AND b.organization_id = a.organization_id
     WHERE a.organization_id = $1
       AND a.technician_id = $2
       AND a.start_time >= $3
       AND a.start_time < $4
       AND a.status <> 'cancelled'
     ORDER BY a.start_time`,
    [organizationId, technicianId, startIso, endIso]
  );

  const upcoming: MyDayAppointment[] = apptRows.map((r) => ({
    id: String(r.id),
    time: workshopTime(new Date(r.start_time as string)),
    vehicleModel: String(r.vehicle_model),
    plate: String(r.plate),
    bayName: String(r.bay_name),
    estimatedHours: Number(r.estimated_hours),
    status: APPOINTMENT_STATUS_PT[String(r.status)] ?? String(r.status),
  }));

  return { technicianName, activeTask, upcoming };
}
