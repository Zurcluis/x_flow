import { getDb } from "@/lib/db";
import { WorkOrder } from "@/domains/checkins/types";
import {
  MaterialUsage,
  PhaseKey,
  WorkOrderChecklistItem,
  WorkOrderPhase,
  WorkOrderTimeEntry,
} from "@/domains/production/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

type PgExecutor = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Row[] }>;
  release?: () => void;
};

export async function listWorkOrders(organizationId: string): Promise<WorkOrder[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT w.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.name AS customer_name, p.name AS technician_name
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     LEFT JOIN profiles p ON p.id = w.primary_technician_id
     WHERE w.organization_id = $1
     ORDER BY
       CASE w.status WHEN 'in_progress' THEN 0 WHEN 'waiting_parts' THEN 1
            WHEN 'quality_control' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END,
       w.started_at DESC`,
    [organizationId]
  );
  return rows.map(mapWorkOrder);
}

function mapWorkOrder(r: Row): WorkOrder {
  return {
    id: String(r.id),
    organizationId: String(r.organization_id),
    workOrderNumber: String(r.work_order_number),
    vehicleId: String(r.vehicle_id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    checkinId: r.checkin_id ? String(r.checkin_id) : "",
    status: r.status as WorkOrder["status"],
    serviceTitle: String(r.service_title),
    primaryTechnicianName: (r.technician_name as string) ?? "Sem técnico",
    progressPercentage: num(r.progress_percentage),
    estimatedHours: num(r.estimated_hours),
    actualHoursSpent: num(r.actual_hours_spent),
    startedAt: iso(r.started_at),
    completedAt: r.completed_at ? iso(r.completed_at) : undefined,
  };
}

export async function getWorkOrderDetail(
  organizationId: string,
  workOrderId: string
): Promise<{
  workOrder: WorkOrder;
  phases: WorkOrderPhase[];
  timeEntries: WorkOrderTimeEntry[];
  materialUsage: MaterialUsage[];
} | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT w.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.name AS customer_name, p.name AS technician_name
     FROM work_orders w
     JOIN vehicles v ON v.id = w.vehicle_id
     JOIN customers c ON c.id = w.customer_id
     LEFT JOIN profiles p ON p.id = w.primary_technician_id
     WHERE w.organization_id = $1 AND w.id = $2`,
    [organizationId, workOrderId]
  );
  if (rows.length === 0) return null;
  const workOrder = mapWorkOrder(rows[0]);

  const { rows: phaseRows } = await db.query<Row>(
    `SELECT * FROM work_order_phases WHERE work_order_id = $1 ORDER BY order_index`,
    [workOrderId]
  );
  const { rows: checklistRows } = await db.query<Row>(
    `SELECT ci.* FROM work_order_checklist_items ci
     JOIN work_order_phases ph ON ph.id = ci.phase_id
     WHERE ph.work_order_id = $1 ORDER BY ci.id`,
    [workOrderId]
  );
  const { rows: entryRows } = await db.query<Row>(
    `SELECT * FROM work_order_time_entries WHERE work_order_id = $1 ORDER BY created_at DESC`,
    [workOrderId]
  );
  const { rows: usageRows } = await db.query<Row>(
    `SELECT mu.*, m.roll_width_meters, m.cost_per_meter
     FROM work_order_material_usages mu
     LEFT JOIN materials m ON m.id = mu.material_id
     WHERE mu.work_order_id = $1 ORDER BY mu.created_at DESC`,
    [workOrderId]
  );

  const phases: WorkOrderPhase[] = phaseRows.map((r) => {
    const phaseKey = r.phase_key as PhaseKey;
    const checklist: WorkOrderChecklistItem[] = checklistRows
      .filter((c) => String(c.phase_id) === String(r.id))
      .map((c) => ({
        id: String(c.id),
        phaseKey,
        label: String(c.label),
        isCompleted: Boolean(c.is_completed),
        completedByName: (c.completed_by_name as string) ?? undefined,
        completedAt: c.completed_at ? iso(c.completed_at) : undefined,
      }));
    return {
      id: String(r.id),
      workOrderId,
      phaseKey,
      name: String(r.name),
      status: r.status as WorkOrderPhase["status"],
      orderIndex: num(r.order_index),
      startedAt: r.started_at ? iso(r.started_at) : undefined,
      completedAt: r.completed_at ? iso(r.completed_at) : undefined,
      estimatedHours: num(r.estimated_hours),
      actualHours: num(r.actual_hours),
      checklist,
    };
  });

  const timeEntries: WorkOrderTimeEntry[] = entryRows.map((r) => ({
    id: String(r.id),
    workOrderId,
    phaseKey: r.phase_key as PhaseKey,
    technicianName: String(r.technician_name),
    hoursSpent: num(r.hours_spent),
    notes: (r.notes as string) ?? undefined,
    createdAt: iso(r.created_at),
  }));

  const materialUsage: MaterialUsage[] = usageRows.map((r) => ({
    id: String(r.id),
    workOrderId,
    materialId: r.material_id ? String(r.material_id) : "",
    materialName: String(r.material_name),
    batchNumber: String(r.batch_number),
    estimatedMeters: num(r.estimated_meters),
    actualMeters: num(r.actual_meters),
    scrapPercentage: num(r.scrap_percentage),
    rollWidthMeters: num(r.roll_width_meters ?? 1.52),
    costPerMeter: num(r.cost_per_meter),
  }));

  return { workOrder, phases, timeEntries, materialUsage };
}

async function recalcProgress(client: PgExecutor, workOrderId: string) {
  const { rows } = await client.query(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE status = 'completed')::text AS done,
            (SELECT SUM(hours_spent) FROM work_order_time_entries WHERE work_order_id = $1) AS hours
     FROM work_order_phases WHERE work_order_id = $1`,
    [workOrderId]
  );
  const total = Number(rows[0].total);
  const done = Number(rows[0].done);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  await client.query(
    `UPDATE work_orders SET progress_percentage = $2,
       actual_hours_spent = $3,
       status = CASE
         WHEN $4 THEN 'quality_control'
         WHEN status = 'draft' THEN 'in_progress'
         ELSE status END,
       updated_at = NOW()
     WHERE id = $1`,
    [workOrderId, progress, num(rows[0].hours), done === total && total > 0]
  );
  return { progress, allDone: done === total && total > 0 };
}

const VALID_STATUSES = ["draft", "in_progress", "waiting_parts", "quality_control", "completed"];

export async function updateWorkOrderStatus(
  organizationId: string,
  workOrderId: string,
  status: WorkOrder["status"]
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Estado inválido." };
  }
  const db = getDb();
  const client = (await db.connect()) as PgExecutor & { release: () => void };
  try {
    await client.query("BEGIN");
    if (status === "completed") {
      await client.query(
        `UPDATE work_orders
         SET status = 'completed', progress_percentage = 100, completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [workOrderId, organizationId]
      );
    } else {
      await client.query(
        `UPDATE work_orders
         SET status = $3, completed_at = NULL,
             progress_percentage = CASE WHEN progress_percentage = 100 THEN 90 ELSE progress_percentage END,
             updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [workOrderId, organizationId, status]
      );
    }
    await recalcProgress(client, workOrderId);
    // reafirmar o estado escolhido (recalcProgress pode alterar)
    await client.query(
      `UPDATE work_orders SET status = $3, updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [workOrderId, organizationId, status]
    );
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao mudar estado." };
  } finally {
    client.release();
  }
}

export async function completePhase(
  workOrderId: string,
  phaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const client = (await db.connect()) as PgExecutor & { release: () => void };
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE work_order_phases
       SET status = 'completed', completed_at = NOW(),
           started_at = COALESCE(started_at, NOW()),
           actual_hours = CASE WHEN actual_hours > 0 THEN actual_hours ELSE estimated_hours END
       WHERE id = $1 AND work_order_id = $2 RETURNING phase_key`,
      [phaseId, workOrderId]
    );
    if (rows.length === 0) throw new Error("Fase não encontrada.");

    const phaseKey = String(rows[0].phase_key);
    await client.query(
      `INSERT INTO work_order_time_entries (work_order_id, phase_key, technician_name, hours_spent, notes)
       SELECT $1, $2, COALESCE(p.name, 'Equipa'), ph.estimated_hours, 'Conclusão de fase'
       FROM work_order_phases ph
       LEFT JOIN work_orders w ON w.id = ph.work_order_id
       LEFT JOIN profiles p ON p.id = w.primary_technician_id
       WHERE ph.id = $3`,
      [workOrderId, phaseKey, phaseId]
    );

    await recalcProgress(client, workOrderId);
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao concluir fase." };
  } finally {
    client.release();
  }
}

export async function startPhase(
  workOrderId: string,
  phaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  try {
    await db.query(
      `UPDATE work_order_phases SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
       WHERE id = $1 AND work_order_id = $2`,
      [phaseId, workOrderId]
    );
    await db.query(
      `UPDATE work_orders SET status = 'in_progress', started_at = COALESCE(started_at, NOW()), updated_at = NOW()
       WHERE id = $1 AND status = 'draft'`,
      [workOrderId]
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao iniciar fase." };
  }
}

export async function toggleChecklistItem(
  itemId: string,
  completed: boolean,
  completedByName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDb().query(
      `UPDATE work_order_checklist_items
       SET is_completed = $2,
           completed_by_name = $3,
           completed_at = CASE WHEN $2 THEN NOW() ELSE NULL END
       WHERE id = $1`,
      [itemId, completed, completed ? completedByName : null]
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro no checklist." };
  }
}

export async function addTimeEntry(
  workOrderId: string,
  phaseKey: PhaseKey,
  technicianName: string,
  hoursSpent: number,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDb().query(
      `INSERT INTO work_order_time_entries (work_order_id, phase_key, technician_name, hours_spent, notes)
       VALUES ($1,$2,$3,$4,$5)`,
      [workOrderId, phaseKey, technicianName, hoursSpent, notes ?? null]
    );
    await recalcProgress(getDb(), workOrderId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao registar horas." };
  }
}
