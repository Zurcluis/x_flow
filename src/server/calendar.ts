import { getDb } from "@/lib/db";
import { Appointment, AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function listBays(organizationId: string): Promise<WorkshopBay[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT b.*, p.name AS technician_name
     FROM bays b LEFT JOIN profiles p ON p.id = b.default_technician_id
     WHERE b.organization_id = $1 ORDER BY b.code`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    organizationId: String(r.organization_id),
    name: String(r.name),
    code: String(r.code),
    serviceType: r.service_type as WorkshopBay["serviceType"],
    defaultTechnicianName: (r.technician_name as string) ?? "Sem técnico",
    status: (r.status as WorkshopBay["status"]) ?? "available",
  }));
}

export interface TechnicianOption {
  id: string;
  name: string;
}

export async function listTechnicians(organizationId: string): Promise<TechnicianOption[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT p.id, p.name FROM profiles p
     JOIN organization_memberships m ON m.profile_id = p.id
     WHERE m.organization_id = $1 AND m.status = 'active'
     ORDER BY p.name`,
    [organizationId]
  );
  return rows.map((r) => ({ id: String(r.id), name: String(r.name) }));
}

function mapAppointment(r: Row): Appointment {
  const start = new Date(r.start_time as string);
  const end = new Date(r.end_time as string);
  return {
    id: String(r.id),
    organizationId: String(r.organization_id),
    quoteId: r.quote_id ? String(r.quote_id) : undefined,
    quoteNumber: (r.quote_number as string) ?? undefined,
    vehicleId: String(r.vehicle_id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    bayId: String(r.bay_id),
    bayName: String(r.bay_name ?? ""),
    technicianName: (r.technician_name as string) ?? "Sem técnico",
    serviceTitle: (r.notes as string) || "Serviço agendado",
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    date: start.toISOString().slice(0, 10),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    estimatedHours: Number(r.estimated_hours ?? 0),
    status: r.status as AppointmentStatus,
    notes: (r.notes as string) ?? undefined,
  };
}

const APPOINTMENT_SELECT = `
  SELECT a.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
         c.name AS customer_name, b.name AS bay_name, p.name AS technician_name,
         q.quote_number
  FROM appointments a
  JOIN vehicles v ON v.id = a.vehicle_id
  JOIN customers c ON c.id = a.customer_id
  JOIN bays b ON b.id = a.bay_id
  LEFT JOIN profiles p ON p.id = a.technician_id
  LEFT JOIN quotes q ON q.id = a.quote_id`;

export async function listAppointmentsBetween(
  organizationId: string,
  start: Date,
  end: Date
): Promise<Appointment[]> {
  const { rows } = await getDb().query<Row>(
    `${APPOINTMENT_SELECT}
     WHERE a.organization_id = $1 AND a.start_time >= $2 AND a.start_time < $3
     ORDER BY a.start_time`,
    [organizationId, iso(start), iso(end)]
  );
  return rows.map(mapAppointment);
}

export async function listAppointmentsForWeek(
  organizationId: string,
  reference = new Date()
): Promise<Appointment[]> {
  const ref = new Date(reference);
  const day = ref.getUTCDay();
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return listAppointmentsBetween(organizationId, monday, new Date(monday.getTime() + 7 * 86400000));
}

export interface AppointmentInput {
  vehicleId: string;
  customerId: string;
  bayId: string;
  technicianId?: string;
  quoteId?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  estimatedHours: number;
  status?: AppointmentStatus;
  notes?: string;
}

export interface ConflictInfo {
  appointmentId: string;
  label: string;
  resource: string;
}

export async function getAppointmentConflicts(
  organizationId: string,
  input: AppointmentInput,
  excludeAppointmentId?: string
): Promise<ConflictInfo[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT a.id, a.start_time, a.end_time, b.name AS bay_name,
            v.plate_display, c.name AS customer_name, p.name AS technician_name
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN customers c ON c.id = a.customer_id
     JOIN bays b ON b.id = a.bay_id
     LEFT JOIN profiles p ON p.id = a.technician_id
     WHERE a.organization_id = $1 AND a.status <> 'cancelled'
       AND a.start_time < $3 AND a.end_time > $2
       AND (a.bay_id = $4 OR a.technician_id = $5 OR a.vehicle_id = $6)
       AND ($7::uuid IS NULL OR a.id <> $7::uuid)`,
    [
      organizationId,
      input.startTime,
      input.endTime,
      input.bayId,
      input.technicianId ?? null,
      input.vehicleId,
      excludeAppointmentId ?? null,
    ]
  );

  return rows.map((r) => {
    const sameBay = r.bay_name === null ? "" : "";
    void sameBay;
    return {
      appointmentId: String(r.id),
      label: `${r.plate_display ?? ""} — ${r.customer_name ?? ""}`.trim(),
      resource: `Baia ${r.bay_name ?? ""}${r.technician_name ? ` · ${r.technician_name}` : ""}`,
    };
  });
}

export async function createAppointment(
  organizationId: string,
  input: AppointmentInput
): Promise<Appointment> {
  const { rows } = await getDb().query<Row>(
    `INSERT INTO appointments
      (organization_id, quote_id, vehicle_id, customer_id, bay_id, technician_id,
       start_time, end_time, estimated_hours, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [
      organizationId,
      input.quoteId ?? null,
      input.vehicleId,
      input.customerId,
      input.bayId,
      input.technicianId ?? null,
      input.startTime,
      input.endTime,
      input.estimatedHours,
      input.status ?? "scheduled",
      input.notes ?? null,
    ]
  );
  const id = String(rows[0].id);
  const { rows: sel } = await getDb().query<Row>(`${APPOINTMENT_SELECT} WHERE a.id = $1`, [id]);
  return mapAppointment(sel[0]);
}

export async function updateAppointment(
  organizationId: string,
  appointmentId: string,
  input: AppointmentInput
): Promise<Appointment> {
  const { rows } = await getDb().query<Row>(
    `UPDATE appointments SET
       vehicle_id = $3, customer_id = $4, bay_id = $5, technician_id = $6,
       quote_id = $7, start_time = $8, end_time = $9, estimated_hours = $10,
       status = $11, notes = $12, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [
      appointmentId,
      organizationId,
      input.vehicleId,
      input.customerId,
      input.bayId,
      input.technicianId ?? null,
      input.quoteId ?? null,
      input.startTime,
      input.endTime,
      input.estimatedHours,
      input.status ?? "scheduled",
      input.notes ?? null,
    ]
  );
  if (rows.length === 0) throw new Error("Marcação não encontrada.");
  const { rows: sel } = await getDb().query<Row>(
    `${APPOINTMENT_SELECT} WHERE a.id = $1`,
    [appointmentId]
  );
  return mapAppointment(sel[0]);
}

export async function moveAppointment(
  organizationId: string,
  appointmentId: string,
  newStart: Date,
  newEnd: Date,
  bayId?: string
): Promise<Appointment> {
  const { rows } = await getDb().query<Row>(
    `UPDATE appointments SET
       start_time = $3, end_time = $4,
       bay_id = COALESCE($5, bay_id), updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [appointmentId, organizationId, iso(newStart), iso(newEnd), bayId ?? null]
  );
  if (rows.length === 0) throw new Error("Marcação não encontrada.");
  const { rows: sel } = await getDb().query<Row>(
    `${APPOINTMENT_SELECT} WHERE a.id = $1`,
    [appointmentId]
  );
  return mapAppointment(sel[0]);
}

export async function cancelAppointment(
  organizationId: string,
  appointmentId: string
): Promise<void> {
  await getDb().query(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2`,
    [appointmentId, organizationId]
  );
}

// ── Gestão de baías ─────────────────────────────────────────────────────────

export interface BayInput {
  name: string;
  code: string;
  serviceType: WorkshopBay["serviceType"];
  technicianId?: string;
}

export async function createBay(
  organizationId: string,
  input: BayInput
): Promise<WorkshopBay> {
  const { rows } = await getDb().query<Row>(
    `INSERT INTO bays (organization_id, name, code, service_type, default_technician_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [organizationId, input.name, input.code, input.serviceType, input.technicianId ?? null]
  );
  const bays = await listBays(organizationId);
  return bays.find((b) => b.id === String(rows[0].id))!;
}

export async function updateBay(
  organizationId: string,
  bayId: string,
  input: Partial<BayInput>
): Promise<void> {
  await getDb().query(
    `UPDATE bays SET
       name = COALESCE($3, name),
       service_type = COALESCE($4, service_type),
       default_technician_id = COALESCE($5, default_technician_id)
     WHERE id = $1 AND organization_id = $2`,
    [bayId, organizationId, input.name ?? null, input.serviceType ?? null, input.technicianId ?? null]
  );
}

export async function deleteBay(organizationId: string, bayId: string): Promise<{ ok: boolean; error?: string }> {
  const { rows } = await getDb().query<Row>(
    `SELECT count(*)::int AS n FROM appointments
     WHERE bay_id = $1 AND status NOT IN ('cancelled') AND start_time >= NOW()`,
    [bayId]
  );
  if (Number(rows[0].n) > 0) {
    return { ok: false, error: "A baia tem marcações futuras. Cancela-as primeiro." };
  }
  await getDb().query(
    `DELETE FROM bays WHERE id = $1 AND organization_id = $2`,
    [bayId, organizationId]
  );
  return { ok: true };
}

// ── Atribuir viatura a baia (mapa da oficina) ───────────────────────────────

export async function assignVehicleToBay(
  organizationId: string,
  vehicleId: string,
  bayId: string,
  date: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();

  const { rows: ownerRows } = await db.query<Row>(
    `SELECT c.id AS customer_id FROM vehicle_customer_links l
     JOIN customers c ON c.id = l.customer_id
     WHERE l.vehicle_id = $1 AND l.is_current LIMIT 1`,
    [vehicleId]
  );
  const customerId = ownerRows[0] ? String(ownerRows[0].customer_id) : null;
  if (!customerId) return { ok: false, error: "A viatura não tem proprietário associado." };

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { rows: existing } = await db.query<Row>(
    `SELECT id FROM appointments
     WHERE vehicle_id = $1 AND organization_id = $2
       AND start_time >= $3 AND start_time <= $4 AND status <> 'cancelled'
     LIMIT 1`,
    [vehicleId, organizationId, dayStart, dayEnd]
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE appointments SET bay_id = $3, updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [String(existing[0].id), organizationId, bayId]
    );
    return { ok: true };
  }

  await db.query(
    `INSERT INTO appointments
      (organization_id, vehicle_id, customer_id, bay_id, start_time, end_time, estimated_hours, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled','Atribuída via mapa da oficina')`,
    [organizationId, vehicleId, customerId, bayId, `${date}T09:00:00`, `${date}T13:00:00`, 4]
  );
  return { ok: true };
}

export { getPrimaryOrganizationId } from "@/server/org";
